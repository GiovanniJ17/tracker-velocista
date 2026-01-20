#!/usr/bin/env node

/**
 * 🔥 Stress Test Configuration & Runner
 * 
 * Permette di eseguire diversi profili di test stress:
 * - quick: 10 sessioni, 5 utenti (30 secondi)
 * - standard: 50 sessioni, 20 utenti (1 minuto)
 * - heavy: 100 sessioni, 50 utenti (2-3 minuti)
 * - full: 365 sessioni, 100 utenti (5-10 minuti) - TEST PRODUZIONE
 * 
 * Uso:
 *   npm run test:stress quick
 *   npm run test:stress standard
 *   npm run test:stress heavy
 *   npm run test:stress full
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurazioni predefinite
const testProfiles = {
  quick: {
    sessions: 10,
    users: 5,
    description: '⚡ QUICK TEST (10 sessioni, 5 utenti) - 30 secondi',
    useCase: 'Verifica veloce che il sistema funzioni'
  },
  standard: {
    sessions: 50,
    users: 20,
    description: '📊 STANDARD TEST (50 sessioni, 20 utenti) - 1 minuto',
    useCase: 'Benchmark di default'
  },
  heavy: {
    sessions: 100,
    users: 50,
    description: '🔥 HEAVY TEST (100 sessioni, 50 utenti) - 2-3 minuti',
    useCase: 'Carico elevato, come 1 mese di dati'
  },
  full: {
    sessions: 365,
    users: 100,
    description: '💪 FULL TEST (365 sessioni, 100 utenti) - 5-10 minuti',
    useCase: '1 anno di dati + carico massimo (TEST PRODUZIONE)'
  }
};

const profile = process.argv[2] || 'standard';

if (!testProfiles[profile]) {
  console.error('❌ Profilo non riconosciuto.');
  console.error('\nProfili disponibili:');
  Object.entries(testProfiles).forEach(([key, config]) => {
    console.error(`  ${key}: ${config.description}`);
    console.error(`     👉 ${config.useCase}`);
  });
  process.exit(1);
}

const config = testProfiles[profile];

console.log(`\n🔥 ${config.description}`);
console.log(`📌 ${config.useCase}\n`);

// Leggi lo script originale
const scriptPath = path.join(__dirname, 'tests', 'massive-stress-test.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf-8');

// Sostituisci parametri
scriptContent = scriptContent.replace(
  /const sessionsToInsert = \d+;/,
  `const sessionsToInsert = ${config.sessions};`
);

scriptContent = scriptContent.replace(
  /const concurrentUsers = \d+;/,
  `const concurrentUsers = ${config.users};`
);

// Scrivi file temporaneo
const tempScriptPath = path.join(__dirname, '.stress-test-temp.js');
fs.writeFileSync(tempScriptPath, scriptContent);

// Esegui con lo stesso processo (così eredita environment)
// Converti path assoluto a URL file:// per Windows compatibility
const tempScriptUrl = pathToFileURL(tempScriptPath).href;
import(tempScriptUrl).finally(() => {
  // Cleanup
  try {
    fs.unlinkSync(tempScriptPath);
  } catch (e) {
    // ignore
  }
});
