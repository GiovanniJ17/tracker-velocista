# 🔒 Security Notes

## Secrets Management

### ⚠️ IMPORTANTE: Non committare mai

- `.env` file (generato localmente)
- Token API (Cloudflare, OpenAI, Anthropic, Supabase)
- Private keys o credenziali

### ✅ Come gestire secrets

**Localmente:**
```
cp .env.example .env
# Modifica .env con i TUOI valori locali
# .env è ignorato da Git
```

**Su Cloudflare Pages:**
- Vai al dashboard di progetto → Settings → Environment Variables
- Imposta variabili solo lì (non in .env committato)

**In questo repository:**
- `.env.example` contiene SOLO placeholder
- Documentazione (DEPLOY.md, ecc) usa `<YOUR_VALUE>` anzichè valori reali

### Variabili Sensibili

| Variabile | Dove Prenderla | Dove Metterla |
|-----------|----------------|---------------|
| `VITE_SUPABASE_URL` | Supabase Settings > API | `.env` (locale) + Cloudflare Pages |
| `VITE_SUPABASE_ANON_KEY` | Supabase Settings > API | `.env` (locale) + Cloudflare Pages |
| `VITE_CLOUDFLARE_ACCOUNT_ID` | CF Dashboard > Account Home | `.env` (locale) + Cloudflare Pages |
| `VITE_CLOUDFLARE_API_TOKEN` | CF Dashboard > API Tokens | `.env` (locale) + Cloudflare Pages |

### Controllo veloce

```bash
# Verifica che .env sia in .gitignore
cat .gitignore | grep "\.env"

# Controlla che non ci siano token nel codice committato
git log -S "sk-" --oneline  # cerchiamosecret API keys
```

Se accidentalmente hai committato un secret:

1. **Revoca immediatamente il token** su Cloudflare/Supabase
2. Genera uno nuovo
3. Force push per rimuovere il commit (⚠️ attenzione in team!)
4. Ricorda: i secret rimangono nella storia Git, ma il token revocato è inutile

---

## RLS Policies (Supabase)

L'app usa modalità **anonymous** con Row-Level Security:

- **training_sessions**: Users can SELECT/INSERT (no DELETE/UPDATE per anonymous)
- **workout_groups**: Same policy
- **workout_sets**: Same policy

Se deployi con autenticazione utente in futuro, aggiorna le RLS policies di conseguenza.

---

## Refs

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Cloudflare Secrets Management](https://developers.cloudflare.com/workers/configuration/secrets/)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
