from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.order_item import OrderItem


class OrderItemRepository:

    @staticmethod
    def create(
        db: Session,
        order_id: int,
        product_name: str,
        quantity: int,
        unit_price: Decimal
    ):
        order_item = OrderItem(
            order_id=order_id,
            product_name=product_name,
            quantity=quantity,
            unit_price=unit_price
        )

        db.add(order_item)
        db.flush()

        return order_item

    @staticmethod
    def get_by_order_id(db: Session, order_id: int):
        return db.query(OrderItem).filter(
            OrderItem.order_id == order_id
        ).all()

    @staticmethod
    def get_by_id(
        db: Session,
        order_id: int,
        item_id: int
    ):
        return db.query(OrderItem).filter(
            OrderItem.id == item_id,
            OrderItem.order_id == order_id
        ).first()

    @staticmethod
    def update(
        db: Session,
        item: OrderItem,
        product_name: str,
        quantity: int,
        unit_price: Decimal
    ):
        item.product_name = product_name
        item.quantity = quantity
        item.unit_price = unit_price

        db.flush()

        return item

    @staticmethod
    def delete(db: Session, item: OrderItem):
        db.delete(item)
        db.flush()