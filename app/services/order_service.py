from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories.order_repository import OrderRepository
from app.repositories.order_item_repository import OrderItemRepository
from app.repositories.customer_repository import CustomerRepository


class OrderService:

    VALID_STATUSES = [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled"
    ]

    VALID_TRANSITIONS = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["preparing", "cancelled"],
        "preparing": ["out_for_delivery"],
        "out_for_delivery": ["delivered"],
        "delivered": [],
        "cancelled": []
    }

    @staticmethod
    def calculate_order_total(items):
        """
        Calculates the order total using the registered products.
        """

        total = Decimal("0.00")

        for item in items:
            quantity = item.quantity
            unit_price = Decimal(str(item.unit_price))

            total += Decimal(quantity) * unit_price

        return total.quantize(Decimal("0.01"))

    @staticmethod
    def recalculate_order_total(db: Session, order):
        """
        Recalculates and corrects the registered order total.
        """

        items = OrderItemRepository.get_by_order_id(
            db,
            order.id
        )

        calculated_total = OrderService.calculate_order_total(items)

        registered_total = Decimal(
            str(order.total_amount)
        ).quantize(Decimal("0.01"))

        if registered_total != calculated_total:
            order.total_amount = calculated_total

            db.commit()
            db.refresh(order)

        return order

    @staticmethod
    def create_order(
        db: Session,
        customer_id: int,
        items: list
    ):
        try:
            customer = CustomerRepository.get_by_id(
                db,
                customer_id
            )

            if customer is None:
                raise ValueError("Customer not found.")

            if not items:
                raise ValueError(
                    "An order must contain at least one item."
                )

            total_amount = Decimal("0.00")

            for item in items:
                product_name = item.product_name.strip()
                quantity = item.quantity
                unit_price = Decimal(str(item.unit_price))

                if not product_name:
                    raise ValueError(
                        "Product name cannot be empty."
                    )

                if quantity <= 0:
                    raise ValueError(
                        "Quantity must be greater than zero."
                    )

                if unit_price <= Decimal("0"):
                    raise ValueError(
                        "Unit price must be greater than zero."
                    )

                total_amount += Decimal(quantity) * unit_price

            total_amount = total_amount.quantize(
                Decimal("0.01")
            )

            order = OrderRepository.create(
                db=db,
                customer_id=customer_id,
                total_amount=total_amount
            )

            for item in items:
                OrderItemRepository.create(
                    db=db,
                    order_id=order.id,
                    product_name=item.product_name.strip(),
                    quantity=item.quantity,
                    unit_price=Decimal(str(item.unit_price))
                )

            db.commit()
            db.refresh(order)

            return order

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def get_all_orders(db: Session):
        orders = OrderRepository.get_all(db)

        try:
            for order in orders:
                OrderService.recalculate_order_total(
                    db,
                    order
                )

            return orders

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def get_order(db: Session, order_id: int):
        order = OrderRepository.get_by_id(db, order_id)

        if order is None:
            raise ValueError("Order not found.")

        return OrderService.recalculate_order_total(
            db,
            order
        )

    @staticmethod
    def get_order_for_customer(
        db: Session,
        order_id: int,
        customer_email: str
    ):
        order = OrderRepository.get_by_id(db, order_id)

        if order is None:
            raise ValueError("Order not found.")

        customer = CustomerRepository.get_by_id(
            db,
            order.customer_id
        )

        if (
            customer is None
            or customer.email.lower() != customer_email.strip().lower()
        ):
            raise ValueError(
                "Order not found for this customer."
            )

        return OrderService.recalculate_order_total(
            db,
            order
        )

    @staticmethod
    def get_customer_orders(db: Session, customer_id: int):
        customer = CustomerRepository.get_by_id(
            db,
            customer_id
        )

        if customer is None:
            raise ValueError("Customer not found.")

        orders = OrderRepository.get_by_customer_id(
            db,
            customer_id
        )

        try:
            for order in orders:
                OrderService.recalculate_order_total(
                    db,
                    order
                )

            return orders

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def update_order_status(
        db: Session,
        order_id: int,
        new_status: str
    ):
        if new_status not in OrderService.VALID_STATUSES:
            raise ValueError("Invalid order status.")

        order = OrderRepository.get_by_id(
            db,
            order_id
        )

        if order is None:
            raise ValueError("Order not found.")

        allowed_transitions = OrderService.VALID_TRANSITIONS[
            order.status
        ]

        if new_status not in allowed_transitions:
            raise ValueError(
                f"Cannot change order status from "
                f"'{order.status}' to '{new_status}'."
            )

        return OrderRepository.update_status(
            db=db,
            order_id=order_id,
            new_status=new_status
        )