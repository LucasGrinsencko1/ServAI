from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories.order_repository import OrderRepository
from app.repositories.order_item_repository import OrderItemRepository


class OrderItemService:

    @staticmethod
    def recalculate_order_total(db: Session, order):
        items = OrderItemRepository.get_by_order_id(
            db,
            order.id
        )

        total = sum(
            (
                Decimal(str(item.unit_price)) * item.quantity
                for item in items
            ),
            Decimal("0.00")
        )

        order.total_amount = total.quantize(Decimal("0.01"))

        return order

    @staticmethod
    def validate_order(order):
        if order is None:
            raise ValueError("Order not found.")

        if order.status in ["cancelled", "delivered"]:
            raise ValueError(
                "Cannot modify items in a cancelled or delivered order."
            )

    @staticmethod
    def validate_item(
        product_name: str,
        quantity: int,
        unit_price: Decimal
    ):
        if not product_name or not product_name.strip():
            raise ValueError("Product name cannot be empty.")

        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")

        if Decimal(str(unit_price)) <= Decimal("0"):
            raise ValueError("Unit price must be greater than zero.")

    @staticmethod
    def add_item(
        db: Session,
        order_id: int,
        product_name: str,
        quantity: int,
        unit_price: Decimal
    ):
        try:
            order = OrderRepository.get_by_id(db, order_id)

            OrderItemService.validate_order(order)

            OrderItemService.validate_item(
                product_name,
                quantity,
                unit_price
            )

            item = OrderItemRepository.create(
                db=db,
                order_id=order_id,
                product_name=product_name.strip(),
                quantity=quantity,
                unit_price=Decimal(str(unit_price))
            )

            OrderItemService.recalculate_order_total(db, order)

            db.commit()
            db.refresh(item)

            return item

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def update_item(
        db: Session,
        order_id: int,
        item_id: int,
        product_name: str,
        quantity: int,
        unit_price: Decimal
    ):
        try:
            order = OrderRepository.get_by_id(db, order_id)

            OrderItemService.validate_order(order)

            OrderItemService.validate_item(
                product_name,
                quantity,
                unit_price
            )

            item = OrderItemRepository.get_by_id(
                db,
                order_id,
                item_id
            )

            if item is None:
                raise ValueError("Order item not found.")

            OrderItemRepository.update(
                db=db,
                item=item,
                product_name=product_name.strip(),
                quantity=quantity,
                unit_price=Decimal(str(unit_price))
            )

            OrderItemService.recalculate_order_total(db, order)

            db.commit()
            db.refresh(item)

            return item

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def delete_item(
        db: Session,
        order_id: int,
        item_id: int
    ):
        try:
            order = OrderRepository.get_by_id(db, order_id)

            OrderItemService.validate_order(order)

            item = OrderItemRepository.get_by_id(
                db,
                order_id,
                item_id
            )

            if item is None:
                raise ValueError("Order item not found.")

            OrderItemRepository.delete(db, item)

            remaining_items = OrderItemRepository.get_by_order_id(
                db,
                order_id
            )

            if not remaining_items:
                OrderRepository.delete(db, order)

                db.commit()

                return {
                    "message": "Last item deleted. Order removed automatically.",
                    "order_id": order_id,
                    "item_id": item_id,
                    "order_deleted": True
                }

            OrderItemService.recalculate_order_total(db, order)

            db.commit()

            return {
                "message": "Order item deleted successfully.",
                "order_id": order_id,
                "item_id": item_id,
                "order_deleted": False,
                "total_amount": float(order.total_amount)
            }

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def get_order_items(db: Session, order_id: int):
        order = OrderRepository.get_by_id(db, order_id)

        if order is None:
            raise ValueError("Order not found.")

        return OrderItemRepository.get_by_order_id(db, order_id)