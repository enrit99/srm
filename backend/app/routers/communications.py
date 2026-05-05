from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/communications", tags=["communications"])


@router.post("/", response_model=schemas.CommunicationOut, status_code=201)
def create_communication(
    comm_in: schemas.CommunicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    supplier = db.query(models.Supplier).filter(
        models.Supplier.id == comm_in.supplier_id,
        models.Supplier.is_deleted == False
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornitore non trovato")

    #comm = models.Communication(
    #    **comm_in.model_dump(),
    #    created_by_id=current_user.id,
    #    data=comm_in.data or datetime.utcnow()
    #)
    
    data_dict = comm_in.model_dump(exclude={"data"})  # escludi data dal dump
    comm = models.Communication(
        **data_dict,
        created_by_id=current_user.id,
        data=comm_in.data or datetime.utcnow()
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)
    return comm


@router.get("/supplier/{supplier_id}", response_model=list[schemas.CommunicationOut])
def get_supplier_communications(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Communication).filter(
        models.Communication.supplier_id == supplier_id
    ).order_by(models.Communication.data.desc()).all()

@router.put("/{comm_id}", response_model=schemas.CommunicationOut)
def update_communication(
    comm_id: int,
    comm_in: schemas.CommunicationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comm = db.query(models.Communication).filter(models.Communication.id == comm_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Comunicazione non trovata")

    for field, value in comm_in.model_dump(exclude_unset=True).items():
        setattr(comm, field, value)

    db.commit()
    db.refresh(comm)
    return comm


@router.delete("/{comm_id}", status_code=204)
def delete_communication(
    comm_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comm = db.query(models.Communication).filter(models.Communication.id == comm_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Comunicazione non trovata")
    db.delete(comm)
    db.commit()
