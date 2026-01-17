# 🚀 Setup & Deployment Guide

Guida completa per configurare localmente e deployare su Cloudflare Pages.

## 📋 Prerequisiti

- **Node.js** v18+ 
- **GitHub** account con repository creato
- **Supabase** account (gratuito)
- **Cloudflare** account (gratuito)

---

## 🔧 Setup Locale

### 1. Supabase Database

1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto
2. Nel **SQL Editor**, copia e incolla `supabase-schema.sql` ed esegui
3. (Opzionale) Esegui `supabase-seed.sql` per aggiungere dati di test
4. In **Settings > API**, copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon public key** → `VITE_SUPABASE_ANON_KEY`

### 2. Installazione & Configurazione

```bash
# Installa dipendenze
npm install

# Crea file .env da esempio
cp .env.example .env

# Modifica .env con i tuoi valori
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
VITE_AI_PROVIDER=cloudflare
VITE_CLOUDFLARE_ACCOUNT_ID=xxxxx
VITE_CLOUDFLARE_API_TOKEN=xxxxx
```

### 3. Avvia Localmente

```bash
npm run dev
# Apri http://localhost:3000
```

### 4. Test Base

1. Vai a "Nuovo Allenamento"
2. Scrivi: `Pista 4x200m con recupero 3 minuti. RPE 8.`
3. Clicca "Interpreta con AI"
4. Verifica preview e salva nel database

---

## 🌐 Deploy su Cloudflare Pages

### Step 1: Prepara Repository GitHub

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

**⚠️ Verifica che .env NON sia committato** (controllare `.gitignore`)

### Step 2: Connetti su Cloudflare Pages

1. Vai a [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Pages** → **Create application** → **Connect to Git**
3. Seleziona il repository `training-log`
4. Configura build:
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Clicca **Save and Deploy**

### Step 3: Aggiungi Environment Variables

Nel dashboard Pages, vai a **Settings** → **Environment Variables** → **Production** e aggiungi:

```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJh...
VITE_AI_PROVIDER = cloudflare
VITE_CLOUDFLARE_ACCOUNT_ID = <YOUR_ACCOUNT_ID>
VITE_CLOUDFLARE_API_TOKEN = <YOUR_API_TOKEN>
```

**⚠️ Non committare mai valori reali nel repository**

### Step 4: Riattiva Deploy

Una volta impostate le variabili:
1. Vai alla tab **Deployments**
2. Clicca i tre puntini sul deploy più recente
3. Seleziona **Retry deployment**

L'app sarà live su: `https://training-log.pages.dev`

### Step 5: Auto-Deploy

D'ora in poi, ogni `git push` a `main` fa auto-deploy in ~2 minuti.

---

## ✅ Verifica Deploy

1. **Apri l'app**: https://training-log.pages.dev
2. **Testa AI Parser**:
   - Nuovo Allenamento → scrivi una sessione → Interpreta con AI
3. **Testa Database**:
   - Salva nel Database → verifica in Dashboard
4. **Testa statistiche**:
   - Aggiungi 3+ sessioni e controlla che le metriche siano corrette

---

## 🆘 Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Build fallisce | Verifica variabili d'ambiente su Cloudflare; check build logs |
| Pagina bianca | Apri Console (F12) e cerca errori JavaScript |
| AI non risponde | Verifica Account ID e API Token Cloudflare sono corretti |
| Database non salva | Verifica URL e Anon Key Supabase; check RLS policies |
| Variabili non caricate | Hard refresh (Ctrl+Shift+R) |

---

## 📝 Prossimi Passi

- Aggiungi più sessioni di allenamento
- Personalizza il prompt AI in `src/services/aiParser.js` se necessario
- Aggiungi grafici/metriche alla Dashboard
- Condividi il link con team/coaches

---

## 📚 Documentazione

- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vite Docs](https://vitejs.dev/)
