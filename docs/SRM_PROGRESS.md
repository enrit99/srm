# SRM — Progress Tracker (dinamico)

> Aggiornare questo file alla **fine di ogni sessione** di sviluppo.
> Allegare sempre insieme a SRM_CONTEXT.md all'inizio di ogni nuova conversazione.

---

## Stato Attuale

**Fase corrente:** 1 — Backend Core
**Ultima sessione:** 2026-05-05
**Prossima azione:** Scrivere database.py + models.py + schemas.py

---

## Roadmap Fasi

### ✅ Fase -1 — Progettazione (completata)
- [x] Definizione requisiti funzionali
- [x] Scelta stack tecnologico
- [x] Design data model
- [x] Design struttura repository
- [x] Design API conventions
- [x] Creazione documenti di progetto (SRM_CONTEXT.md + questo file)

---

### ✅ Fase 0 — Infrastruttura VPS (completata)
- [x] Acquisto VPS Hetzner CX22 (Ubuntu 24.04)
- [x] Accesso SSH, hardening base (utente non-root, chiave SSH, fail2ban)
- [x] Installazione Docker + Docker Compose
- [x] Installazione Git
- [x] Creazione repository GitHub `srm`
- [x] Struttura cartelle monorepo inizializzata
- [x] git remote add origin collegato
- [x] docker-compose funzionante con container placeholder
- [x] Caddy configurato con dominio srm.devtse.it + HTTPS Let's Encrypt ✓

**Note Fase 0:**
- Ubuntu 24.04: il servizio SSH si chiama `ssh` (non `sshd`) → `sudo systemctl restart ssh`
- Cloudflare usato come DNS manager (dominio registrato Aruba). Record A su Cloudflare in modalità **DNS only** (nuvola grigia) — necessario per permettere a Caddy/Let's Encrypt di fare la verifica ACME HTTP-01
- srm.devtse.it raggiungibile via HTTPS con certificato valido ✓

---

### 🔄 Fase 1 — Backend Core (API + DB)
- [ ] `database.py`: engine SQLAlchemy, SessionLocal, Base
- [ ] `models.py`: User, Supplier, Contact, Communication
- [ ] Alembic init + prima migrazione
- [ ] `schemas.py`: schemi Pydantic per le entità Fase 1
- [ ] `auth.py`: hash password, generazione/verifica JWT
- [ ] `routers/users.py`: POST /register, POST /token
- [ ] `routers/suppliers.py`: CRUD completo con paginazione e filtri
- [ ] `routers/contacts.py`: CRUD
- [ ] `routers/communications.py`: CRUD + filtro per supplier
- [ ] `main.py`: inclusione router, CORS, startup
- [ ] Test manuale via Swagger UI (`/docs`)
- [ ] Dockerfile backend funzionante

---

### ⏳ Fase 2 — Frontend Base
- [ ] Scaffold React + Vite + Tailwind
- [ ] React Router: struttura pagine (Login, Suppliers, SupplierDetail)
- [ ] Auth flow: login → salvataggio JWT in localStorage → redirect
- [ ] Hook `useAuth` + protezione route
- [ ] Pagina Suppliers: lista con ricerca e paginazione
- [ ] Pagina SupplierDetail: anagrafica + tab comunicazioni + tab contatti
- [ ] Form modale: aggiungi/modifica fornitore
- [ ] Form: log nuova comunicazione
- [ ] Dockerfile frontend (Nginx statico)
- [ ] Docker Compose: backend + frontend + caddy integrati

---

### ⏳ Fase 3 — Contratti, Ordini, Macchine
- [ ] Modelli DB: Contract, Reminder, Order, Machine, Maintenance
- [ ] Migrazione Alembic
- [ ] Schemi Pydantic + router per ogni entità
- [ ] Frontend: tab Contratti in SupplierDetail
- [ ] Frontend: tab Ordini in SupplierDetail
- [ ] Frontend: tab Macchine + Manutenzioni
- [ ] Upload allegati (PDF, immagini) → endpoint `/upload`

---

### ⏳ Fase 4 — Scheduler e Reminder
- [ ] `scheduler.py`: APScheduler avviato su startup FastAPI
- [ ] Job giornaliero: query contratti con `data_fine` entro `giorni_anticipo_notifica`
- [ ] Invio email SMTP con lista scadenze
- [ ] Segnalazione visiva nel frontend (badge "in scadenza")
- [ ] Pagina `/reminders`: vista calendario scadenze

---

### ⏳ Fase 5 — Dashboard Analitica
- [ ] Endpoint `/api/v1/dashboard/stats`
- [ ] KPI: n° fornitori attivi, contratti in scadenza 30gg, ordini ultimo trimestre
- [ ] Grafico: comunicazioni per mese (Recharts BarChart)
- [ ] Grafico: distribuzione fornitori per tipo
- [ ] Tabella: top fornitori per volume ordini

---

### ⏳ Fase 6 — Hardening Produzione (opzionale)
- [ ] Migrazione SQLite → PostgreSQL
- [ ] Backup automatico DB (cron + rsync o rclone su S3/Backblaze)
- [ ] Rate limiting API
- [ ] Multi-utente con ruoli (admin / read-only)
- [ ] Log strutturati (JSON) con rotazione

---

## Decisioni Tecniche Prese

| Data | Decisione | Motivazione |
|---|---|---|
| 2026-05-05 | SQLite in produzione (fase iniziale) | Utenti <5, nessuna concorrenza alta, zero config |
| 2026-05-05 | Caddy invece di Nginx per reverse proxy | HTTPS automatico, config minimale |
| 2026-05-05 | APScheduler embedded invece di Celery | Celery richiede Redis/RabbitMQ; overkill per job giornaliero |
| 2026-05-05 | Allegati su filesystem invece di DB | BLOB in SQLite degrada performance; path in DB è sufficiente |
| 2026-05-05 | Monorepo unico invece di repo separati | Progetto piccolo, deploy atomico più semplice |
| 2026-05-05 | Cloudflare DNS only (no proxy) per srm.devtse.it | Necessario per verifica ACME Let's Encrypt con Caddy |

---

## Problemi Aperti / Note

_Nessuno al momento._

---

## Sessioni di Sviluppo

| Data | Fase | Attività svolte | File modificati |
|---|---|---|---|
| 2026-05-05 | Progettazione | Design completo architettura, data model, stack, documenti | SRM_CONTEXT.md, SRM_PROGRESS.md |
| 2026-05-05 | Fase 0 | VPS Hetzner, SSH hardening, Docker+Git, repo GitHub, monorepo, docker-compose, Caddy+HTTPS su srm.devtse.it | SRM_PROGRESS.md |
