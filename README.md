# SRM — Supplier Relationship Management

Tool web self-hosted per gestire relazioni con fornitori e costruttori di macchine in azienda metalmeccanica. Sostituisce gestione manuale via email/Excel con un sistema strutturato di anagrafica, log comunicazioni, contratti e manutenzioni.

**Status:** Fase 2 completata · MVP funzionante · `v0.1.0`

## Funzionalità

- 🔐 Autenticazione JWT
- 🏢 Anagrafica fornitori con tipologia (fornitore, costruttore, entrambi)
- 👥 Gestione contatti per fornitore
- 💬 Log cronologico comunicazioni (email, telefonate, visite)
- 🔍 Ricerca, filtri, paginazione
- 🗑️ Soft delete fornitori, hard delete su contatti/comunicazioni
- 📱 UI responsive con Tailwind

In roadmap (Fase 3+): contratti con scadenze, ordini, parco macchine, scheduler reminder via email, dashboard analitica.

## Stack

| Layer | Tecnologia |
|---|---|
| Backend | FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 |
| Database | SQLite (Postgres in roadmap) |
| Auth | JWT con bcrypt |
| Frontend | React 18 · Vite · Tailwind CSS · React Router · TanStack Query |
| Infra | Docker Compose · Caddy (HTTPS auto via Let's Encrypt) |
| Hosting | Hetzner Cloud · Ubuntu 24.04 LTS |

## Quick Start

```bash
git clone git@github.com:TUO_USERNAME/srm.git
cd srm
cp .env.example .env
# Edita .env e imposta SECRET_KEY (genera con: python3 -c "import secrets; print(secrets.token_hex(32))")
docker compose up -d
```

L'app è disponibile su `https://TUO_DOMINIO`. Per il setup completo da zero su VPS vedi [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documentazione

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — design, data model, convenzioni di codice
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — guida deploy su VPS pulito
- [docs/PROGRESS.md](docs/PROGRESS.md) — roadmap, decisioni tecniche, storico sessioni

## Struttura repo

- **`srm/`**
  - `backend/ ` — eFastAPI app + Alembic migrations
  - `frontend/` — React + Vite app
  - `docs/` — Documentazione progetto
  - `docker-compose.yml`
  - `Caddyfile`
  - `.env.example`
 
## License

Progetto privato. Tutti i diritti riservati.
