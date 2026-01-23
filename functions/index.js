const {setGlobalOptions} = require("firebase-functions/v2");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

setGlobalOptions({maxInstances: 10});

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const DEFAULT_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-1.5-flash";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || "";
  return raw
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  if (!allowedOrigins.length) return true;
  return allowedOrigins.includes(origin);
}

function buildCorsHeaders(origin, allowedOrigins) {
  const allowAny = !allowedOrigins.length;
  const allowedOrigin = allowAny ? "*" : origin;

  return {
    "Access-Control-Allow-Origin": allowedOrigin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Custom-API-Key",
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin",
  };
}

exports.aiProxy = onRequest({secrets: [GEMINI_API_KEY]}, async (req, res) => {
  const origin = req.get("Origin") || "";
  const allowedOrigins = getAllowedOrigins();
  const corsHeaders = buildCorsHeaders(origin, allowedOrigins);

  if (!isOriginAllowed(origin, allowedOrigins)) {
    res.set(corsHeaders).status(403).json({error: {message: "Origin not allowed"}});
    return;
  }

  if (req.method === "OPTIONS") {
    res.set(corsHeaders).status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.set(corsHeaders).status(405).json({error: {message: "Method not allowed"}});
    return;
  }

  try {
    const body = req.body || {};
    const {provider, messages, model, apiKey, responseSchema, responseFormat} = body;
    const hasSchemaProps = !!responseSchema?.properties &&
      Object.keys(responseSchema.properties).length > 0;
    const inferredSchema = hasSchemaProps ? responseSchema : null;
    const useJsonMime = responseFormat?.type === "json_object";

    if (!provider) {
      res.set(corsHeaders).status(400).json({error: {message: "Provider is required"}});
      return;
    }

    if (provider !== "gemini") {
      res.set(corsHeaders).status(400).json({error: {message: "Unsupported provider"}});
      return;
    }

    const isEmulator = !!process.env.FUNCTIONS_EMULATOR;
    const headerKey = req.get("X-Custom-API-Key");
    const resolvedKey = isEmulator ?
      (headerKey || apiKey || GEMINI_API_KEY.value()) :
      GEMINI_API_KEY.value();

    if (!resolvedKey) {
      res.set(corsHeaders).status(500).json({error: {message: "Gemini API key missing"}});
      return;
    }

    logger.info("aiProxy request", {
      provider,
      model: model || DEFAULT_MODEL,
      messagesCount: Array.isArray(messages) ? messages.length : 0,
      hasSchema: !!inferredSchema,
      hasSchemaProps,
      schemaKeys: hasSchemaProps ? Object.keys(responseSchema.properties) : [],
      useJsonMime,
      hasOrigin: !!origin,
      emulator: isEmulator,
    });

    const result = await callGemini(
        messages,
        model || DEFAULT_MODEL,
        resolvedKey,
        inferredSchema,
        useJsonMime,
    );
    res.set(corsHeaders).status(200).json(result);
  } catch (error) {
    logger.error("aiProxy error", {
      message: error.message,
      stack: error.stack,
    });
    res.set(corsHeaders).status(500).json({
      error: {
        message: error.message || "Unknown error",
      },
    });
  }
});

async function callGemini(messages, model, apiKey, responseSchema, useJsonMime) {
  const systemPrompt = (messages || []).find((m) => m.role === "system")?.content || "";
  const userContent = (messages || [])
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n\n");
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userContent}` : userContent;

  const requestBody = {
    contents: [{parts: [{text: fullPrompt}]}],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  };

  if (responseSchema) {
    requestBody.generationConfig.responseMimeType = "application/json";
    requestBody.generationConfig.responseSchema = responseSchema;
  } else if (useJsonMime) {
    requestBody.generationConfig.responseMimeType = "application/json";
  }

  const modelsToTry = [model];
  if (model === DEFAULT_MODEL) {
    modelsToTry.push(FALLBACK_MODEL);
  }

  let lastError = null;

  for (const candidateModel of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${apiKey}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return {
          choices: [{
            message: {content: text},
          }],
        };
      }

      const message = data?.error?.message || `Gemini API error: ${response.statusText}`;
      const overloaded = response.status === 429 ||
        response.status === 503 ||
        /overloaded/i.test(message);

      lastError = new Error(message);

      if (overloaded && attempt === 0) {
        await sleep(750);
        continue;
      }

      break;
    }
  }

  throw lastError || new Error("Gemini API error");
}
