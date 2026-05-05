# SRM — Progress Tracker (dinamico)

> Aggiornare questo file alla **fine di ogni sessione** di sviluppo.
> Il file vive nel repo Git: ogni modifica significativa va committata.

---

## Stato Attuale

**Fase corrente:** 2 — Frontend Base
**Ultima sessione:** 2026-05-05
**Prossima azione:** Scaffold React + Vite + Tailwind, primo login funzionante

---

## Roadmap Fasi

### ✅ Fase -1 — Progettazione (completata)
- [x] Definizione requisiti funzionali
- [x] Scelta stack tecnologico
- [x] Design data model
- [x] Design struttura repository
- [x] Design API conventions
- [x] Creazione documenti di progetto

---

### ✅ Fase 0 — Infrastruttura VPS (completata)
- [x] Acquisto VPS Hetzner CX22 (Ubuntu 24.04)
- [x] Accesso SSH, hardening base (utente non-root, chiave SSH, fail2ban)
- [x] Installazione Docker + Docker Compose
- [x] Installazione Git
- [x] Repository GitHub `srm` creato e collegato via SSH
- [x] Struttura cartelle monorepo inizializzata
- [x] docker-compose con Caddy + frontend placeholder + backend
- [x] DNS via Cloudflare (modalità DNS only) → srm.devtse.it
- [x] HTTPS automatico via Caddy + Let's Encrypt ✓

---

### ✅ Fase 1 — Backend Core (completata)
- [x] `database.py`: engine SQLAlchemy, SessionLocal, Base, get_db dependency
- [x] `models.py`: User, Supplier, Contact, Communication + Enum types
- [x] `schemas.py`: schemi Pydantic v2 con `from_attributes`
- [x] `auth.py`: bcrypt diretto (no passlib), JWT, get_current_user dependency
- [x] `routers/users.py`: register + token endpoints
- [x] `routers/suppliers.py`: CRUD completo + paginazione + filtri (search, tipo) + soft delete
- [x] `routers/contacts.py`: CRUD
- [x] `routers/communications.py`: POST + GET per supplier
- [x] `main.py`: CORS, inclusione router, docs sotto `/api/v1/docs`
- [x] Alembic init + bind mount per development + prima migration
- [x] Dockerfile backend + integrazione docker-compose
- [x] Test end-to-end via Swagger UI: register → login → CRUD supplier → communication ✓

---

### 🔄 Fase 2 — Frontend Base
- [ ] Scaffold React + Vite + Tailwind
- [ ] React Router: struttura pagine (Login, Suppliers, SupplierDetail)
- [ ] Auth flow: login → JWT in localStorage → redirect
- [ ] Hook `useAuth` + protezione route
- [ ] Pagina Suppliers: lista con ricerca e paginazione
- [ ] Pagina SupplierDetail: anagrafica + tab comunicazioni + tab contatti
- [ ] Form modale: aggiungi/modifica fornitore
- [ ] Form: log nuova comunicazione
- [ ] Dockerfile frontend (build statico → Nginx)
- [ ] Docker Compose: backend + frontend + caddy integrati

---

### ⏳ Fase 3 — Contratti, Ordini, Macchine
- [ ] Modelli DB: Contract, Reminder, Order, Machine, Maintenance
- [ ] Migrazione Alembic
- [ ] Schemi Pydantic + router per ogni entità
- [ ] Frontend: tab Contratti / Ordini / Macchine in SupplierDetail
- [ ] Upload allegati (PDF, immagini) → endpoint `/upload`

---

### ⏳ Fase 4 — Scheduler e Reminder
- [ ] `scheduler.py`: APScheduler avviato su startup FastAPI
- [ ] Job giornaliero: query contratti in scadenza
- [ ] Invio email SMTP con lista scadenze
- [ ] Badge "in scadenza" nel frontend
- [ ] Pagina `/reminders`: vista calendario scadenze

---

### ⏳ Fase 5 — Dashboard Analitica
- [ ] Endpoint `/api/v1/dashboard/stats`
- [ ] KPI: fornitori attivi, contratti in scadenza, ordini ultimo trimestre
- [ ] Grafici Recharts: comunicazioni per mese, distribuzione fornitori
- [ ] Top fornitori per volume ordini

---

### ⏳ Fase 6 — Hardening Produzione (opzionale)
- [ ] Rimuovere bind mount backend (production immutability)
- [ ] Container backend con utente non-root + UID matching host
- [ ] Migrazione SQLite → PostgreSQL
- [ ] Endpoint password reset/change
- [ ] Backup automatico DB
- [ ] Rate limiting API
- [ ] Multi-utente con ruoli (admin / read-only)
- [ ] Log strutturati (JSON) con rotazione

---

## Decisioni Tecniche Prese

| Data | Decisione | Motivazione |
|---|---|---|
| 2026-05-05 | SQLite in produzione (fase iniziale) | Utenti <5, zero config, migrazione futura facile |
| 2026-05-05 | Caddy invece di Nginx | HTTPS automatico via Let's Encrypt, config minimale |
| 2026-05-05 | APScheduler embedded invece di Celery | Celery richiede Redis/RabbitMQ; overkill per job giornaliero |
| 2026-05-05 | Allegati su filesystem invece di DB | BLOB in SQLite degrada performance |
| 2026-05-05 | Monorepo unico | Progetto piccolo, deploy atomico più semplice |
| 2026-05-05 | Cloudflare DNS only (no proxy) | Necessario per verifica ACME Let's Encrypt |
| 2026-05-05 | Servizio SSH su Ubuntu 24.04 si chiama `ssh` non `sshd` | `sudo systemctl restart ssh` |
| 2026-05-05 | bcrypt direttamente, eliminata passlib | passlib 1.7.4 abbandonata, incompatibile con bcrypt 4.x |
| 2026-05-05 | Bind mount `./backend:/app` per sviluppo | Iterazione veloce; da rimuovere in produzione (Fase 6) |
| 2026-05-05 | Documenti progetto nel repo Git (`docs/`) invece di Google Drive | Versionamento, single source of truth, no MCP update API |

---

## Note Operative

- **File ownership da Docker bind mount**: i file creati dal container appaiono come `root:root` sul host. Fix temporaneo con `sudo chown -R enrico:enrico ~/srm/...`. Risoluzione strutturale rimandata a Fase 6.
- **Truncamento bcrypt 72 byte**: implementato esplicitamente in `auth.py` (`password.encode()[:72]`) per evitare ValueError su password lunghe.
- **Swagger UI Authorize button**: per OAuth2PasswordBearer flow lasciare client_id e client_secret VUOTI; compilare solo username + password.

---

## Problemi Aperti / Note

_Nessuno al momento._

---

## Sessioni di Sviluppo

| Data | Fase | Attività svolte |
|---|---|---|
| 2026-05-05 | -1 | Design completo: architettura, data model, stack, documenti |
| 2026-05-05 | 0 | VPS Hetzner, SSH hardening, Docker+Git, repo GitHub, monorepo, docker-compose, Caddy+HTTPS su srm.devtse.it |
| 2026-05-05 | 1 | Backend completo: DB, modelli, schemi, auth bcrypt+JWT, 4 router, Alembic, test E2E in Swagger |
| 2026-05-05 | infra | Migrazione documenti progetto da Drive a repo Git (cartella `docs/`), workflow GitHub via SSH key |
