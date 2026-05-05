# SRM — Supplier Relationship Management
## Documento di Contesto Progetto (statico)

> Allegare questo file + SRM_PROGRESS.md all'inizio di ogni sessione di sviluppo.
> Questo file cambia raramente. Aggiornarlo solo se cambiano stack, architettura o data model.

---

## 1. Obiettivo

Tool web leggero per la gestione delle relazioni con **fornitori e costruttori di macchine** in un'azienda metalmeccanica (produzione serbatoi in acciaio inox).
Sostituisce la gestione manuale via email/fogli Excel. Non integrato con Team System ERP (progetto indipendente, self-hosted).

**Utente primario:** personale ufficio (1-5 utenti). Non è un prodotto SaaS pubblico.

---

## 2. Stack Tecnologico

| Layer | Tecnologia | Versione target | Note |
|---|---|---|---|
| Backend | FastAPI | ≥ 0.111 | Python 3.12 |
| ORM | SQLAlchemy | 2.x (async) | Con Alembic per migrazioni |
| Validazione | Pydantic | v2 | Integrato in FastAPI |
| Database | SQLite → PostgreSQL | — | SQLite in dev, Postgres in prod quando scala |
| Auth | JWT (python-jose + passlib) | — | OAuth2PasswordBearer flow |
| Scheduler | APScheduler | 3.x | Integrato nel processo FastAPI |
| Email | smtplib / fastapi-mail | — | Per reminder scadenze |
| Frontend | React 18 + Vite | Vite 5 | |
| CSS | Tailwind CSS | v3 | |
| HTTP client | React Query (TanStack) | v5 | Caching e sync stato server |
| Routing FE | React Router | v6 | |
| Grafici | Recharts | — | Dashboard analitica |
| Containerizzazione | Docker + Docker Compose | — | Un container per servizio |
| Reverse proxy | Caddy | v2 | HTTPS automatico via Let's Encrypt |
| VPS | Hetzner CX22 | — | 2 vCPU, 4 GB RAM, ~4,15 €/mese |
| OS | Ubuntu 24.04 LTS | — | |
| Versionamento | Git + GitHub | — | Monorepo |

---

## 3. Struttura Repository (Monorepo)

```
srm/
├── backend/
│   ├── app/
│   │   ├── main.py            # Entry point FastAPI, inclusione router, startup APScheduler
│   │   ├── database.py        # Engine SQLAlchemy, SessionLocal, Base
│   │   ├── models.py          # Modelli ORM (tabelle DB)
│   │   ├── schemas.py         # Schemi Pydantic (request/response)
│   │   ├── auth.py            # JWT: creazione token, verifica, hash password
│   │   ├── scheduler.py       # Job APScheduler (controllo scadenze)
│   │   └── routers/
│   │       ├── suppliers.py
│   │       ├── contacts.py
│   │       ├── communications.py
│   │       ├── contracts.py
│   │       ├── orders.py
│   │       ├── machines.py
│   │       └── users.py
│   ├── alembic/               # Migrazioni DB
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/               # Funzioni fetch verso backend
│   │   ├── components/        # Componenti riutilizzabili (Table, Modal, Badge...)
│   │   ├── pages/             # Una cartella per sezione (Suppliers, Contracts...)
│   │   └── hooks/             # Custom hooks React Query
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── Caddyfile
├── .env.example
├── SRM_CONTEXT.md             # Questo file
└── SRM_PROGRESS.md            # Tracker dinamico
```

---

## 4. Data Model

### Entità e relazioni

```
User (autenticazione)
└── username, email, hashed_password, is_active

Supplier (fornitore/costruttore)
├── id, nome, tipo [FORNITORE | COSTRUTTORE | ENTRAMBI]
├── email, telefono, sito_web
├── indirizzo, citta, cap, paese
├── piva, codice_fiscale
├── note, created_at, updated_at
│
├── 1:N → Contact        (referenti del fornitore)
├── 1:N → Communication  (log interazioni)
├── 1:N → Contract       (contratti attivi/storici)
├── 1:N → Order          (storico ordini/documenti)
└── 1:N → Machine        (macchine acquistate dal fornitore)

Contact
└── supplier_id, nome, cognome, ruolo, email, telefono, note

Communication
└── supplier_id, contact_id (nullable), tipo [EMAIL|TELEFONO|VISITA|ALTRO]
    data, oggetto, corpo_note, allegato_path, created_by (user_id)

Contract
├── supplier_id, tipo [FORNITURA|MANUTENZIONE|NOLEGGIO|ALTRO]
├── numero_contratto, descrizione
├── data_inizio, data_fine, valore_eur
├── stato [ATTIVO|SCADUTO|RINNOVATO|ANNULLATO]
├── note, allegato_path
└── 1:N → Reminder

Reminder
└── contract_id, titolo, data_scadenza, giorni_anticipo_notifica
    notificato [bool], email_destinatario

Order
└── supplier_id, numero_documento, tipo [ORDINE|DDT|FATTURA|OFFERTA]
    data, importo_eur, descrizione, allegato_path, note

Machine
├── supplier_id, nome, modello, matricola
├── data_acquisto, data_fine_garanzia
├── note
└── 1:N → Maintenance

Maintenance
└── machine_id, tipo [PREVENTIVA|CORRETTIVA|STRAORDINARIA]
    data, descrizione, costo_eur, tecnico_esterno, note
    → genera automaticamente Reminder se pianificata
```

### Convenzioni DB
- Tutti gli `id` sono `INTEGER PRIMARY KEY AUTOINCREMENT` (SQLite) / `SERIAL` (Postgres)
- Tutti i timestamp: `created_at`, `updated_at` con `default=datetime.utcnow`
- Soft delete: campo `is_deleted BOOLEAN DEFAULT FALSE` su Supplier, Contract, Order
- Allegati: salvati in `./uploads/` sul filesystem, path relativo in DB (non BLOB)

---

## 5. API Design (convenzioni REST)

- Base URL: `/api/v1/`
- Auth header: `Authorization: Bearer <token>`
- Tutti gli endpoint protetti tranne `POST /api/v1/auth/token`
- Risposta lista: `{ "items": [...], "total": N, "page": P, "size": S }`
- Risposta errore: `{ "detail": "messaggio errore" }`
- Paginazione: query params `?page=1&size=20`
- Filtri: query params `?search=...&tipo=...&stato=...`

Endpoint principali:
```
POST   /api/v1/auth/token
GET    /api/v1/suppliers/          + POST
GET    /api/v1/suppliers/{id}      + PUT + DELETE
GET    /api/v1/suppliers/{id}/communications
GET    /api/v1/suppliers/{id}/contracts
GET    /api/v1/suppliers/{id}/orders
GET    /api/v1/suppliers/{id}/machines
POST   /api/v1/communications/
POST   /api/v1/contracts/
POST   /api/v1/orders/
POST   /api/v1/machines/
GET    /api/v1/dashboard/stats
GET    /api/v1/reminders/upcoming  (usato dallo scheduler)
```

---

## 6. Infrastruttura Deploy

```
Internet
    │ HTTPS (443)
    ▼
[Caddy]  ← gestisce TLS automatico
    │
    ├── /api/*  → proxy → backend:8000  (FastAPI)
    └── /*      → proxy → frontend:3000 (React/Vite in prod: Nginx statico)

Docker Compose services:
  - backend   (FastAPI, porta 8000 interna)
  - frontend  (Nginx che serve build React, porta 80 interna)
  - caddy     (porta 80+443 pubblica)

Volumi persistenti:
  - ./data/srm.db        → SQLite database
  - ./uploads/           → allegati
  - ./caddy_data/        → certificati TLS Caddy
```

### Variabili d'ambiente (.env)
```
SECRET_KEY=<stringa random 64 char>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
DATABASE_URL=sqlite:///./data/srm.db
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
NOTIFICATION_EMAIL=
```

---

## 7. Convenzioni di Codice

- **Python**: snake_case, type hints ovunque, docstring sulle funzioni pubbliche
- **React**: PascalCase per componenti, camelCase per variabili/funzioni
- **Commit**: `feat:`, `fix:`, `docs:`, `refactor:` (Conventional Commits)
- **Branch**: `main` (prod), `dev` (sviluppo), `feature/<nome>` per funzionalità
- Nessun `print()` in produzione → usare `logging` Python standard
