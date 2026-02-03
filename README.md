# ZackAI

ZackAI ist eine Next.js‑App mit:
- Registrierung, Login und E‑Mail‑Verifikation (Brevo SMTP)
- Mehreren Chat‑Sessions pro User
- Groq‑Integration mit Free‑Modus (begrenzte Nutzung) und Pro‑Modus (eigener API‑Key)
- SQLite + Prisma

## Setup

1. Abhängigkeiten installieren
```bash
npm install
```

2. `.env` anlegen
```bash
copy .env.example .env
```

3. `.env` ausfüllen
- `APP_ENCRYPTION_KEY`: 32‑Byte Base64‑Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
- Brevo SMTP Felder setzen
- Optional: `GROQ_API_KEY` für Free‑Modus nutzen
- Optional: `PRO_MODEL` für Standard‑Modell im Pro‑Modus

4. Datenbank migrieren
```bash
cmd /c npx.cmd prisma migrate dev --name init
```

5. Dev‑Server starten
```bash
npm run dev
```

## Hinweise
- Ohne eigenen Groq‑Key ist die Nutzung begrenzt und hängt vom `GROQ_API_KEY` des Servers ab.
- User‑Keys werden verschlüsselt gespeichert (AES‑256‑GCM).
- E‑Mail‑Verifikation ist Pflicht.
