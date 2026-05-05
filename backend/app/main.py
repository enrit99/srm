from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import users, suppliers, contacts, communications

# Crea tutte le tabelle al primo avvio (in produzione useremo Alembic)
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SRM — Supplier Relationship Management",
    description="Gestione fornitori e costruttori di macchine",
    version="0.1.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json"
)

# CORS: permette al frontend React (porta diversa) di chiamare il backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://srm.devtse.it"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra tutti i router sotto /api/v1/
app.include_router(users.router, prefix="/api/v1")
app.include_router(suppliers.router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1")
app.include_router(communications.router, prefix="/api/v1")

@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
