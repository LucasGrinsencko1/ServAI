from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.order_service import OrderService
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate
)


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):
    try:
        return OrderService.create_order(
            db=db,
            customer_id=order_data.customer_id,
            items=order_data.items
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.get("/", response_model=list[OrderResponse])
def get_orders(
    db: Session = Depends(get_db)
):
    return OrderService.get_all_orders(db=db)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    try:
        return OrderService.get_order(
            db=db,
            order_id=order_id
        )
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        )


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    try:
        return OrderService.update_order_status(
            db=db,
            order_id=order_id,
            new_status=status_data.status
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )