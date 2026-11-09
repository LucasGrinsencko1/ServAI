from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    product_name: str = Field(min_length=1, max_length=150)
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0)


class OrderItemUpdate(BaseModel):
    product_name: str = Field(min_length=1, max_length=150)
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0)


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_name: str
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(from_attributes=True)