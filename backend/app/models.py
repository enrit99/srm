from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, Enum, Text, Float
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class SupplierType(str, enum.Enum):
    FORNITORE = "FORNITORE"
    COSTRUTTORE = "COSTRUTTORE"
    ENTRAMBI = "ENTRAMBI"


class CommunicationType(str, enum.Enum):
    EMAIL = "EMAIL"
    TELEFONO = "TELEFONO"
    VISITA = "VISITA"
    ALTRO = "ALTRO"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    communications = relationship("Communication", back_populates="created_by_user")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False, index=True)
    tipo = Column(Enum(SupplierType), nullable=False)
    email = Column(String(100))
    telefono = Column(String(30))
    sito_web = Column(String(200))
    indirizzo = Column(String(200))
    citta = Column(String(100))
    cap = Column(String(10))
    paese = Column(String(50), default="Italia")
    piva = Column(String(20))
    codice_fiscale = Column(String(20))
    note = Column(Text)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    contacts = relationship("Contact", back_populates="supplier", cascade="all, delete-orphan")
    communications = relationship("Communication", back_populates="supplier", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    nome = Column(String(100), nullable=False)
    cognome = Column(String(100))
    ruolo = Column(String(100))
    email = Column(String(100))
    telefono = Column(String(30))
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="contacts")
    communications = relationship("Communication", back_populates="contact")


class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tipo = Column(Enum(CommunicationType), nullable=False)
    data = Column(DateTime, nullable=False, default=datetime.utcnow)
    oggetto = Column(String(250))
    corpo_note = Column(Text)
    allegato_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="communications")
    contact = relationship("Contact", back_populates="communications")
    created_by_user = relationship("User", back_populates="communications")
