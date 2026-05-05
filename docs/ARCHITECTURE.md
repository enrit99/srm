# Architecture

Documento di riferimento sull'architettura, le scelte tecniche e le convenzioni di SRM.

---

## 1. Obiettivo del sistema

Tool web self-hosted per gestione relazioni con fornitori e costruttori di macchine in azienda metalmeccanica. Caso d'uso interno (1-5 utenti). Non è un SaaS pubblico.

---

## 2. Stack tecnologico

### Backend
| Componente | Tecnologia | Note |
|---|---|---|
| Web framework | FastAPI ≥ 0.111 | Python 3.12 |
| ORM | SQLAlchemy 2.x | API moderna con `DeclarativeBase` |
| Migrazioni | Alembic | Generate da `Base.metadata` |
| Validazione | Pydantic v2 | `model_config = {"from_attributes": True}` |
| Database | SQLite | Migrabile a PostgreSQL via cambio `DATABASE_URL` |
| Auth | JWT (`python-jose`) + `bcrypt` 4.x | No `passlib` (dipendenza abbandonata) |
| Scheduler | APScheduler | Embedded, no broker esterno |
| Container | Python 3.12-slim |

### Frontend
| Componente | Tecnologia | Note |
|---|---|---|
| UI library | React 18 | Functional components + hooks |
| Bundler/dev server | Vite 5 | HMR via WebSocket through Caddy |
| Routing | React Router 6 | `BrowserRouter` |
| State server-side | TanStack Query 5 | Cache automatica, invalidazione esplicita |
| State client-side | React Context (auth) + `useState` | Niente Redux/Zustand |
| Styling | Tailwind CSS 3 | Utility-first, no CSS custom |
| Container dev | Node 20-alpine |

### Infrastruttura
| Componente | Tecnologia | Note |
|---|---|---|
| Orchestrazione | Docker Compose | Single-host |
| Reverse proxy | Caddy 2 | HTTPS automatico via Let's Encrypt |
| VPS | Hetzner Cloud CX22 | 2 vCPU, 4 GB RAM |
| OS | Ubuntu 24.04 LTS |
| DNS | Cloudflare (modalità DNS only) | Proxy disabilitato per ACME challenge |
| Versionamento | Git + GitHub | SSH key auth, branch `main`/`dev` |

---

## 3. Architettura runtime

```mermaid
flowchart TD
    Internet["🌐 Internet<br/>HTTPS :443"]
    Caddy["Caddy<br/>TLS termination + routing"]
    Backend["Backend<br/>FastAPI · :8000"]
    Frontend["Frontend<br/>Vite dev server · :5173"]
    DB[("SQLite<br/>./data/srm.db")]

    Internet --> Caddy
    Caddy -->|"/api/*"| Backend
    Caddy -->|"/*"| Frontend
    Backend --> DB

    classDef external fill:#1e293b,stroke:#475569,color:#e2e8f0
    classDef proxy fill:#1e3a8a,stroke:#3b82f6,color:#dbeafe
    classDef app fill:#064e3b,stroke:#10b981,color:#d1fae5
    classDef storage fill:#581c87,stroke:#a855f7,color:#f3e8ff

    class Internet external
    class Caddy proxy
    class Backend,Frontend app
    class DB storage
```

I container `backend` e `frontend` non hanno porte esposte direttamente sull'host: tutto il traffico passa obbligatoriamente da Caddy. La comunicazione interna avviene sulla rete Docker `srm_net` tramite hostname dei container (es. `backend:8000`, `frontend:5173`).

**Volumi persistenti:**
- `./data/` → database SQLite
- `./uploads/` → allegati (PDF, immagini caricate dagli utenti)
- `./caddy_data/` → certificati TLS Let's Encrypt

---

## 4. Data model

Diagramma entità-relazione. Le entità marcate (Phase 3) sono in roadmap.

```mermaid
erDiagram
    USER ||--o{ COMMUNICATION : "crea"
    SUPPLIER ||--o{ CONTACT : "ha"
    SUPPLIER ||--o{ COMMUNICATION : "log"
    SUPPLIER ||--o{ CONTRACT : "ha (Phase 3)"
    SUPPLIER ||--o{ ORDER : "ha (Phase 3)"
    SUPPLIER ||--o{ MACHINE : "ha (Phase 3)"
    CONTACT ||--o{ COMMUNICATION : "associato"
    MACHINE ||--o{ MAINTENANCE : "ha (Phase 3)"
    CONTRACT ||--o{ REMINDER : "ha (Phase 3)"

    USER {
        int id PK
        string username UK
        string email UK
        string hashed_password
        bool is_active
        datetime created_at
    }
    SUPPLIER {
        int id PK
        string nome
        enum tipo "FORNITORE|COSTRUTTORE|ENTRAMBI"
        string email
        string telefono
        string sito_web
        string indirizzo
        string citta
        string cap
        string paese
        string piva
        string codice_fiscale
        text note
        bool is_deleted "soft delete"
        datetime created_at
        datetime updated_at
    }
    CONTACT {
        int id PK
        int supplier_id FK
        string nome
        string cognome
        string ruolo
        string email
        string telefono
        text note
    }
    COMMUNICATION {
        int id PK
        int supplier_id FK
        int contact_id FK "nullable"
        int created_by FK
        enum tipo "EMAIL|TELEFONO|VISITA|ALTRO"
        datetime data
        string oggetto
        text corpo_note
        string allegato_path
    }
    CONTRACT {
        int id PK
        int supplier_id FK
        enum tipo
        string numero_contratto
        date data_inizio
        date data_fine
        decimal valore_eur
        enum stato
    }
    ORDER {
        int id PK
        int supplier_id FK
        string numero_documento
        enum tipo
        date data
        decimal importo_eur
        string allegato_path
    }
    MACHINE {
        int id PK
        int supplier_id FK
        string nome
        string modello
        string matricola
        date data_acquisto
        date data_fine_garanzia
    }
    MAINTENANCE {
        int id PK
        int machine_id FK
        enum tipo
        date data
        decimal costo_eur
        text descrizione
    }
    REMINDER {
        int id PK
        int contract_id FK
        date data_scadenza
        int giorni_anticipo_notifica
        bool notificato
    }
```

### Convenzioni DB
- ID `INTEGER PRIMARY KEY AUTOINCREMENT` (SQLite) / `SERIAL` (Postgres)
- Timestamp `created_at`/`updated_at` con default automatico
- `Supplier` usa soft delete (`is_deleted=True`)
- `Contact`/`Communication` usano hard delete (entità accessorie)
- Allegati su filesystem in `./uploads/`, NO BLOB nel DB

## 5. API REST

Base URL: `/api/v1/`. Tutti gli endpoint richiedono `Authorization: Bearer <token>` tranne `POST /auth/token`.

### Ciclo di vita di una richiesta autenticata

```mermaid
sequenceDiagram
    participant C as Client (browser)
    participant Cy as Caddy
    participant F as FastAPI
    participant A as get_current_user<br/>(dependency)
    participant DB as SQLite

    C->>Cy: GET /api/v1/suppliers/<br/>Authorization: Bearer JWT
    Cy->>F: forward (rete srm_net)
    F->>A: verifica token (firma + scadenza)
    A->>DB: SELECT user WHERE username = jwt.sub
    DB-->>A: user record
    A-->>F: User object (iniettato come parametro)
    F->>DB: SELECT suppliers WHERE is_deleted = 0<br/>LIMIT/OFFSET per paginazione
    DB-->>F: rows
    F-->>Cy: 200 OK + JSON {items, total, page, size}
    Cy-->>C: 200 OK (TLS terminato)

    Note over C,DB: Token scaduto o invalido
    A--xF: HTTPException 401
    F-->>Cy: 401 Unauthorized
    Cy-->>C: 401 → frontend redirect /login
```

### Endpoint principali

| Method | Path | Descrizione |
|---|---|---|
| `POST` | `/auth/register` | Crea nuovo utente |
| `POST` | `/auth/token` | Login (form-data, restituisce JWT) |
| `GET` | `/suppliers/` | Lista paginata + filtri (`?page&size&search&tipo`) |
| `POST` | `/suppliers/` | Crea fornitore |
| `GET` | `/suppliers/{id}` | Dettaglio (include `contacts` annidati) |
| `PUT` | `/suppliers/{id}` | Aggiorna parziale |
| `DELETE` | `/suppliers/{id}` | Soft delete |
| `POST` | `/contacts/` | Crea contatto |
| `GET` | `/contacts/{id}` | Dettaglio |
| `PUT` | `/contacts/{id}` | Aggiorna |
| `DELETE` | `/contacts/{id}` | Hard delete |
| `GET` | `/communications/supplier/{supplier_id}` | Lista cronologica per fornitore |
| `POST` | `/communications/` | Crea |
| `PUT` | `/communications/{id}` | Aggiorna |
| `DELETE` | `/communications/{id}` | Hard delete |

### Convenzioni di risposta
- Liste: `{ "items": [...], "total": N, "page": P, "size": S }`
- Errori: `{ "detail": "messaggio" }`
- Documentazione interattiva: `/api/v1/docs` (Swagger UI)

## 6. Frontend architecture

### Pipeline dati: dal click utente al re-render

```mermaid
flowchart LR
    U([👤 User])
    P[Page Component<br/>SupplierDetail.jsx]
    F[Form Component<br/>SupplierForm.jsx]
    H[React Query Hook<br/>useUpdateSupplier]
    API[API Module<br/>api/suppliers.js]
    Cl[client.js<br/>fetch + auth header]
    BE[(Backend<br/>FastAPI)]
    QC[(React Query<br/>Cache)]

    U -->|click Salva| F
    F -->|onSubmit| P
    P -->|mutateAsync| H
    H -->|api.updateSupplier| API
    API -->|apiRequest| Cl
    Cl -->|fetch + Bearer JWT| BE
    BE -->|200 + JSON| Cl
    Cl --> API
    API --> H
    H -->|onSuccess →<br/>invalidateQueries| QC
    QC -->|stale → refetch| P
    P -->|re-render| U

    classDef ui fill:#1e3a8a,stroke:#3b82f6,color:#dbeafe
    classDef logic fill:#064e3b,stroke:#10b981,color:#d1fae5
    classDef data fill:#581c87,stroke:#a855f7,color:#f3e8ff

    class P,F ui
    class H,API,Cl logic
    class BE,QC data
```

### Struttura cartelle

src/
├── main.jsx                  ← entry React
├── App.jsx                   ← Provider tree + Routes
├── api/
│   ├── client.js             ← fetch wrapper con auth header + 401 handler
│   ├── suppliers.js          ← funzioni CRUD per resource
│   ├── contacts.js
│   └── communications.js
├── hooks/
│   ├── useAuth.jsx           ← AuthContext + useAuth hook
│   ├── useSuppliers.js       ← React Query hooks (read + mutations)
│   ├── useContacts.js
│   └── useCommunications.js
├── components/
│   ├── Modal.jsx             ← UI primitives riusabili
│   ├── Tabs.jsx
│   ├── ProtectedRoute.jsx
│   ├── SupplierForm.jsx      ← form polimorfico (create + edit)
│   ├── ContactForm.jsx
│   └── CommunicationForm.jsx
├── pages/
│   ├── Login.jsx
│   ├── Suppliers.jsx         ← list page
│   └── SupplierDetail.jsx    ← detail con tabs
└── utils/
└── format.js             ← formattazione date locale-it

### Pattern adottati
- **API module pattern**: una funzione per ogni endpoint, mai `fetch` inline nei componenti
- **React Query come data layer**: cache automatica, invalidazione esplicita, retry, stato loading/error
- **Query key normalizzate**: `String(id)` ovunque per evitare cache miss da type mismatch
- **Form polimorfici**: stesso componente per create e edit via prop `initial`
- **Stato modale a tre valori**: `null` (chiuso), `{}` (nuovo), `{...id}` (modifica)

## 7. Auth flow

```mermaid
sequenceDiagram
    actor U as User
    participant LP as Login Page
    participant AC as AuthContext
    participant Cl as api/client.js
    participant BE as Backend
    participant LS as localStorage
    participant R as React Router

    Note over U,R: Login

    U->>LP: inserisce username + password
    LP->>AC: login(username, password)
    AC->>Cl: loginRequest(...)
    Cl->>BE: POST /auth/token<br/>(form-data: username, password)
    BE->>BE: verify_password (bcrypt.checkpw)
    BE-->>Cl: 200 + {access_token, token_type}
    Cl-->>AC: token
    AC->>LS: setItem('srm_token', token)
    AC->>AC: setToken(...) → isAuthenticated=true
    AC-->>LP: success
    LP->>R: navigate('/suppliers')
    R-->>U: rendering Suppliers page

    Note over U,R: Richiesta autenticata successiva

    U->>Cl: lista fornitori
    Cl->>LS: getItem('srm_token')
    LS-->>Cl: token
    Cl->>BE: GET /api/v1/suppliers/<br/>Authorization: Bearer <token>
    BE->>BE: jwt.decode (verifica firma + scadenza)
    BE-->>Cl: 200 + data

    Note over U,R: Token scaduto

    Cl->>BE: GET /api/v1/suppliers/<br/>Authorization: Bearer <expired-token>
    BE-->>Cl: 401 Unauthorized
    Cl->>LS: removeItem('srm_token')
    Cl->>R: window.location = '/login'
    R-->>U: redirect a login
```

**Caratteristiche del flusso:**
- Token JWT firmato HS256 con `SECRET_KEY` random 64 char
- Validità token: 480 minuti (8 ore)
- Niente refresh token in questa fase (richiede nuovo login a scadenza)
- Token salvato in `localStorage` (vulnerabile XSS — accettato per ambito interno; in roadmap Fase 6 valutare httpOnly cookie)
- Verifica password con bcrypt (cost factor default 12) — limite 72 byte gestito esplicitamente

## 8. Convenzioni di codice

- **Python**: snake_case · type hints obbligatori · docstring sulle funzioni pubbliche · `logging` standard library, no `print()`
- **JavaScript**: PascalCase per componenti React, camelCase per il resto · ES modules · arrow functions
- **Git commit**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)
- **Branch**: `main` (stabile, solo merge da dev su milestone), `dev` (sviluppo continuo), `feature/<nome>` per feature lunghe

---

## 9. Sicurezza

| Area | Misura |
|---|---|
| Trasporto | HTTPS forzato via Caddy + HSTS auto |
| Auth | JWT firmato HS256 con `SECRET_KEY` random 64 char |
| Password | Hash bcrypt (cost factor default 12) |
| SSH server | Login root disabilitato, key-only, fail2ban attivo |
| DB | Bind mount fuori dal container, no porte esposte |
| Frontend | Token in `localStorage` (vulnerabile XSS — accettato per ambito interno) |

Hardening avanzato in roadmap Fase 6: rate limiting, log strutturati, multi-utente con ruoli, container non-root.
