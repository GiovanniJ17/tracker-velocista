const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

// --- FUNZIONE 1: ANALISI TESTO ---
export async function analyzeWorkout(text: string) {
  if (!apiKey) throw new Error("Chiave API mancante.");

  try {
    // Tentativo con modello Pro (più robusto) se Flash da problemi
    const modelName = "gemini-1.5-pro"; 
    const today = new Date();
    const todayString = today.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Prompt Ingegnerizzato per Riconoscimento Unità
    const prompt = `
      Sei un assistente specializzato in Track & Field (Atletica Leggera) e Powerlifting.
      Analizza il testo fornito ed estrai i dati in formato JSON rigoroso.
      
      DATA DI OGGI: ${todayString}.
      
      INPUT UTENTE: "${text}"

      ISTRUZIONI DI PARSING FONDAMENTALI:
      1. RICONOSCIMENTO ESERCIZI:
         - Divisione in "groups" (blocchi di esercizi simili).
         - "Riscaldamento", "Defaticamento" sono gruppi a parte.
         - Se l'utente scrive "5x(30m + 60m)", significa che il gruppo ha due esercizi (30m e 60m) ripetuti 5 volte ciascuno. Espandi se necessario o raggruppa logicamente.

      2. UNITA' DI MISURA (MOLTO IMPORTANTE):
         - DISTANZA: Cerca "m", "km", "metri". Converti tutto in METRI (field: "distance_m"). Es: "2.5km" -> 2500. "60m" -> 60.
         - PESO: Cerca "kg", "kili". Converti in CHILOGRAMMI (field: "weight_kg"). Es: "100kg" -> 100.
         - TEMPO (Performance): Se c'è un tempo di esecuzione (es. "in 12s", "in 10.5"), mettilo in "time_s" (SECONDI).
           - "12.55" -> 12.55
           - "1'20" -> 80 (converti minuti in secondi)
         - RECUPERO: Cerca "rec", "r", "rest". Converti in SECONDI (field: "recovery_s"). Es: "rec 3'" -> 180.
      
      3. STRUTTURA PERFETTA JSON:
      Devi restituire SOLO il JSON, niente markdown.
      {
        "workouts": [
          {
            "session": { 
              "date": "YYYY-MM-DD" (se implicita usa data oggi), 
              "type": "pista|palestra|strada|gara|altro", 
              "title": "Titolo breve sessione", 
              "notes": "Note generali",
              "rpe": numero 1-10 (se presente, altrimenti null)
            },
            "groups": [
              {
                "name": "Nome Blocco (es. Riscaldamento, Blocchi, Panca)",
                "order_index": 1,
                "sets": [
                  { 
                    "exercise_name": "Nome Esercizio (es. 60m Sprint, Squat)", 
                    "sets": numero (es. 1 per singola, 5 per 5x...), 
                    "reps": numero (reps per set), 
                    "weight_kg": numero_float (o null), 
                    "distance_m": numero_float (o null), 
                    "time_s": numero_float (o null - performance cronometrica), 
                    "recovery_s": numero_int (o null - recupero DOPO questo esercizio), 
                    "notes": "Dettagli extra (es. 'vento a favore')" 
                  }
                ]
              }
            ]
          }
        ]
      }
    `;

    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) throw new Error("Errore AI response");
    const data = await response.json();
    return cleanAndParseJSON(data.candidates?.[0]?.content?.parts?.[0]?.text);

  } catch (error: any) {
    console.error("❌ Errore AI:", error);
    throw error;
  }
}

// --- FUNZIONE 2: COACH INTELLIGENCE ---
export async function getCoachAdvice(stats: any) {
  if (!apiKey) return "Chiave API mancante.";
  try {
    const modelName = "gemini-1.5-pro";
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const prompt = `
      Sei un Allenatore di Atletica Leggera di livello Olimpico.
      Analizza questi dati del tuo atleta e dai un feedback breve e tecnico.
      
      DATI ATLETA:
      - Sessioni totali: ${stats.totalSessions}
      - RPE Medio: ${stats.avgRpe}/10
      - Metri corsi totali: ${stats.totalDistance}m
      - Volume sollevato: ${stats.totalVolume}kg
      
      RICHIESTA:
      Scrivi un report di max 80 parole.
      1. Analizza lo stato di forma.
      2. Dai un consiglio mirato per la prossima settimana.
      3. Usa un tono motivante ma tecnico.
    `;

    const response = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Il coach sta riposando...";

  } catch (error) {
    return "Impossibile contattare il coach al momento.";
  }
}

function cleanAndParseJSON(text: string) {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    return JSON.parse(text);
  } catch (e) { throw new Error("JSON non valido."); }
}