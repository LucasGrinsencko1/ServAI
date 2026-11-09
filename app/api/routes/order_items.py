from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.order_item_service import OrderItemService
from app.schemas.order_item import (
    OrderItemCreate,
    OrderItemUpdate,
    OrderItemResponse
)


router = APIRouter(
    prefix="/orders",
    tags=["Order Items"]
)


@router.post(
    "/{order_id}/items",
    response_model=OrderItemResponse,
    status_code=201
)
def add_order_item(
    order_id: int,
    item_data: OrderItemCreate,
    db: Session = Depends(get_db)
):
    try:
        return OrderItemService.add_item(
            db=db,
            order_id=order_id,
            product_name=item_data.product_name,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.get(
    "/{order_id}/items",
    response_model=list[OrderItemResponse]
)
def get_order_items(
    order_id: int,
    db: Session = Depends(get_db)
):
    try:
        return OrderItemService.get_order_items(
            db=db,
            order_id=order_id
        )
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        )


@router.put(
    "/{order_id}/items/{item_id}",
    response_model=OrderItemResponse
)
def update_order_item(
    order_id: int,
    item_id: int,
    item_data: OrderItemUpdate,
    db: Session = Depends(get_db)
):
    try:
        return OrderItemService.update_item(
            db=db,
            order_id=order_id,
            item_id=item_id,
            product_name=item_data.product_name,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.delete(
    "/{order_id}/items/{item_id}"
)
def delete_order_item(
    order_id: int,
    item_id: int,
    db: Session = Depends(get_db)
):
    try:
        return OrderItemService.delete_item(
            db=db,
            order_id=order_id,
            item_id=item_id
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )