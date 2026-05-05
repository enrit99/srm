# Progress Tracker

Tracker dinamico dello stato del progetto, decisioni tecniche e storico sessioni.

---

## Stato Attuale

**Fase corrente:** 3 — Contratti, Ordini, Macchine
**Ultima milestone:** v0.1.0 (Fase 2 completata)
**Prossima azione:** Modelli DB Contract/Order/Machine + relativi router

---

## Roadmap

### ✅ Fase -1 — Progettazione
Architettura, stack, data model, convenzioni.

### ✅ Fase 0 — Infrastruttura VPS
VPS Hetzner, Docker, Caddy, HTTPS via Let's Encrypt, dominio srm.devtse.it.

### ✅ Fase 1 — Backend Core
- DB + ORM + migrazioni Alembic
- Modelli User, Supplier, Contact, Communication
- Auth JWT con bcrypt diretto (no passlib)
- Router CRUD completi con paginazione, filtri, soft delete
- Test E2E via Swagger UI ✓

### ✅ Fase 2 — Frontend MVP
- Scaffold React + Vite + Tailwind manuale (no `npm create`)
- Auth flow: Login page, AuthContext, ProtectedRoute, JWT in localStorage
- Lista fornitori con search, filtro, paginazione
- Detail page con tabs (Anagrafica / Contatti / Comunicazioni)
- CRUD completo: create, read, update, delete (con soft delete su supplier)
- Form polimorfici (create + edit via prop `initial`)
- Modal generico riusabile + Tabs riusabile
- React Query con invalidazione corretta (key normalizzate via `String(id)`)
- Endpoint backend estesi: PUT/DELETE su contacts e communications

### 🔄 Fase 3 — Contratti, Ordini, Macchine
- [ ] Modelli DB: Contract, Reminder, Order, Machine, Maintenance
- [ ] Migrazione Alembic
- [ ] Schemi Pydantic + router CRUD
- [ ] Frontend: tab Contratti / Ordini / Macchine in SupplierDetail
- [ ] Upload allegati (PDF, immagini) → endpoint `/upload`

### ⏳ Fase 4 — Scheduler e Reminder
- [ ] APScheduler avviato su startup FastAPI
- [ ] Job giornaliero scadenze contratti
- [ ] Invio email SMTP
- [ ] Badge "in scadenza" + pagina calendario

### ⏳ Fase 5 — Dashboard Analitica
- [ ] Endpoint `/dashboard/stats`
- [ ] KPI + grafici Recharts

### ⏳ Fase 6 — Hardening Produzione
- [ ] Rimuovere bind mount backend
- [ ] Container con utente non-root + UID matching
- [ ] Migrazione SQLite → PostgreSQL
- [ ] Endpoint password reset/change + multi-utente con ruoli
- [ ] Backup automatico DB
- [ ] Rate limiting API
- [ ] Toast notifications (sostituire `alert()` e `confirm()`)
- [ ] Log strutturati JSON con rotazione

---

## Decisioni tecniche

| Data | Decisione | Motivazione |
|---|---|---|
| 2026-05-05 | SQLite in produzione iniziale | Utenti <5, zero config; migrazione futura facile |
| 2026-05-05 | Caddy invece di Nginx | HTTPS automatico, config minimale |
| 2026-05-05 | APScheduler embedded invece di Celery | No broker esterno richiesto |
| 2026-05-05 | Allegati su filesystem invece di BLOB | Performance SQLite |
| 2026-05-05 | Monorepo unico | Deploy atomico, progetto piccolo |
| 2026-05-05 | Cloudflare DNS only (no proxy) | Verifica ACME Let's Encrypt |
| 2026-05-05 | Bind mount `./backend:/app` per dev | Iterazione rapida; rimuovere in Fase 6 |
| 2026-05-05 | bcrypt diretto invece di passlib | passlib 1.7.4 abbandonata, incompatibile con bcrypt 4.x |
| 2026-05-05 | Documenti progetto nel repo Git | Versionamento, single source of truth |
| 2026-05-05 | React Query key normalizzate via `String(id)` | Evita cache miss su mismatch number/string |
| 2026-05-05 | Form polimorfici create/edit | DRY: stesso componente per modal "nuovo" e "modifica" |
| 2026-05-05 | Hard delete contatti/comunicazioni, soft delete fornitori | Coerente con uso: fornitori sono entità di lungo periodo, accessori vanno rimossi pulitamente |

---

## Note operative

- **File ownership da Docker bind mount**: i file creati dal container appaiono come `root:root` sul host. Fix temporaneo con `chown`. Da risolvere strutturalmente in Fase 6.
- **bcrypt limit 72 byte**: gestito esplicitamente in `auth.py` (`password.encode()[:72]`).
- **Swagger UI Authorize button**: per OAuth2 password flow lasciare client_id/client_secret VUOTI.
- **Caddy reload dopo modifica Caddyfile**: `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile` (zero downtime) o `docker compose restart caddy`.
- **Sistema servizio SSH su Ubuntu 24.04**: si chiama `ssh`, non `sshd`.
- **Backup**: script `~/srm/backup.sh` esegue snapshot DB SQLite + tar.gz cifrato con age + upload su Cloudflare R2 (`srm-backups`). Cron giornaliero 03:00. Retention locale 3 giorni, remota 90 giorni. Chiave privata age in `~/.config/srm-backup/key.txt` (BACKUP SEPARATO ESSENZIALE).

---

## Storico sessioni

| Data | Fase | Attività |
|---|---|---|
| 2026-05-05 | -1 | Design architettura, data model, stack |
| 2026-05-05 | 0 | VPS Hetzner, SSH hardening, Docker+Git, Caddy+HTTPS su srm.devtse.it |
| 2026-05-05 | 1 | Backend completo: DB, modelli, schemi, auth bcrypt+JWT, 4 router, Alembic, test E2E |
| 2026-05-05 | infra | Migrazione documenti progetto da Drive a repo Git |
| 2026-05-05 | 2 | Frontend MVP: auth flow, lista fornitori, detail con tabs, CRUD completo |
| 2026-05-05 | 2.1 | Edit/delete contatti e comunicazioni, fix React Query key types |
| 2026-05-05 | docs | Riorganizzazione documentazione: README + ARCHITECTURE + DEPLOYMENT + PROGRESS |
