from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.order_item import OrderItemCreate


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderStatusUpdate(BaseModel):
    status: Literal[
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled"
    ]


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    status: str
    total_amount: float

    model_config = ConfigDict(from_attributes=True)