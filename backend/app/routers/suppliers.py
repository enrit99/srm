from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("/", response_model=schemas.SupplierList)
def list_suppliers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    tipo: models.SupplierType = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Supplier).filter(models.Supplier.is_deleted == False)

    if search:
        query = query.filter(models.Supplier.nome.ilike(f"%{search}%"))
    if tipo:
        query = query.filter(models.Supplier.tipo == tipo)

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/", response_model=schemas.SupplierOut, status_code=201)
def create_supplier(
    supplier_in: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    supplier = models.Supplier(**supplier_in.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("/{supplier_id}", response_model=schemas.SupplierOut)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    supplier = db.query(models.Supplier).filter(
        models.Supplier.id == supplier_id,
        models.Supplier.is_deleted == False
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornitore non trovato")
    return supplier


@router.put("/{supplier_id}", response_model=schemas.SupplierOut)
def update_supplier(
    supplier_id: int,
    supplier_in: schemas.SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    supplier = db.query(models.Supplier).filter(
        models.Supplier.id == supplier_id,
        models.Supplier.is_deleted == False
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornitore non trovato")

    # Aggiorna solo i campi inviati (exclude_unset ignora i None non esplicitati)
    for field, value in supplier_in.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    supplier = db.query(models.Supplier).filter(
        models.Supplier.id == supplier_id,
        models.Supplier.is_deleted == False
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornitore non trovato")

    supplier.is_deleted = True   # soft delete: non cancelliamo mai fisicamente
    db.commit()
