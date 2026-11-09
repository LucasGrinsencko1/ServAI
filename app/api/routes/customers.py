from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.customer_service import CustomerService
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.schemas.order import OrderResponse


router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


@router.post("/", response_model=CustomerResponse, status_code=201)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db)
):
    try:
        return CustomerService.create_customer(
            db=db,
            name=customer_data.name,
            email=customer_data.email
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/", response_model=list[CustomerResponse])
def get_all_customers(db: Session = Depends(get_db)):
    return CustomerService.get_all_customers(db=db)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    try:
        return CustomerService.get_customer(
            db=db,
            customer_id=customer_id
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("/{customer_id}/orders", response_model=list[OrderResponse])
def get_customer_orders(
    customer_id: int,
    db: Session = Depends(get_db)
):
    try:
        return CustomerService.get_customer_orders(
            db=db,
            customer_id=customer_id
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))