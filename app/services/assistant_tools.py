from sqlalchemy.orm import Session

from app.repositories.customer_repository import CustomerRepository
from app.services.order_service import OrderService
from app.services.order_item_service import OrderItemService


class AssistantTools:

    @staticmethod
    def get_order_status(
        db: Session,
        order_id: int,
        customer_email: str
    ) -> dict:

        order = OrderService.get_order_for_customer(
            db=db,
            order_id=order_id,
            customer_email=customer_email
        )

        return {
            "order_id": order.id,
            "status": order.status,
            "total_amount": str(order.total_amount),
            "created_at": order.created_at.isoformat()
        }

    @staticmethod
    def get_customer_orders(
        db: Session,
        customer_email: str
    ) -> list:

        customer = CustomerRepository.get_by_email(
            db,
            customer_email.strip().lower()
        )

        if customer is None:
            raise ValueError("Customer not found.")

        orders = OrderService.get_customer_orders(
            db=db,
            customer_id=customer.id
        )

        return [
            {
                "order_id": order.id,
                "status": order.status,
                "total_amount": str(order.total_amount),
                "created_at": order.created_at.isoformat()
            }
            for order in orders
        ]

    @staticmethod
    def get_order_items(
        db: Session,
        order_id: int,
        customer_email: str
    ) -> list:

        print("\n========== ORDER ITEMS DIAGNOSTIC ==========")
        print(f"Order ID: {order_id}")
        print(f"Customer: {customer_email}")

        OrderService.get_order_for_customer(
            db=db,
            order_id=order_id,
            customer_email=customer_email
        )

        items = OrderItemService.get_order_items(
            db=db,
            order_id=order_id
        )

        print(f"Items found in database: {len(items)}")

        result = [
            {
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "subtotal": str(item.quantity * item.unit_price)
            }
            for item in items
        ]

        print(f"Data returned by tool: {result}")
        print("============================================\n")

        return result

    @staticmethod
    def cancel_order(
        db: Session,
        order_id: int,
        customer_email: str
    ) -> dict:

        OrderService.get_order_for_customer(
            db=db,
            order_id=order_id,
            customer_email=customer_email
        )

        order = OrderService.update_order_status(
            db=db,
            order_id=order_id,
            new_status="cancelled"
        )

        return {
            "order_id": order.id,
            "status": order.status,
            "message": "Order cancelled successfully."
        }