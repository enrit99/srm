from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from .models import SupplierType, CommunicationType


# --- User ---

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str


# --- Contact ---

class ContactCreate(BaseModel):
    supplier_id: int
    nome: str
    cognome: Optional[str] = None
    ruolo: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    note: Optional[str] = None

class ContactUpdate(BaseModel):
    nome: Optional[str] = None
    cognome: Optional[str] = None
    ruolo: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    note: Optional[str] = None

class ContactOut(ContactCreate):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# --- Supplier ---

class SupplierCreate(BaseModel):
    nome: str
    tipo: SupplierType
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    sito_web: Optional[str] = None
    indirizzo: Optional[str] = None
    citta: Optional[str] = None
    cap: Optional[str] = None
    paese: Optional[str] = "Italia"
    piva: Optional[str] = None
    codice_fiscale: Optional[str] = None
    note: Optional[str] = None

class SupplierUpdate(SupplierCreate):
    nome: Optional[str] = None
    tipo: Optional[SupplierType] = None

class SupplierOut(SupplierCreate):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    contacts: list[ContactOut] = []
    model_config = {"from_attributes": True}

class SupplierList(BaseModel):
    items: list[SupplierOut]
    total: int
    page: int
    size: int


# --- Communication ---

class CommunicationCreate(BaseModel):
    supplier_id: int
    contact_id: Optional[int] = None
    tipo: CommunicationType
    data: Optional[datetime] = None
    oggetto: Optional[str] = None
    corpo_note: Optional[str] = None

class CommunicationUpdate(BaseModel):
    contact_id: Optional[int] = None
    tipo: Optional[CommunicationType] = None
    data: Optional[datetime] = None
    oggetto: Optional[str] = None
    corpo_note: Optional[str] = None

class CommunicationOut(CommunicationCreate):
    id: int
    created_by_id: Optional[int]
    allegato_path: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}
