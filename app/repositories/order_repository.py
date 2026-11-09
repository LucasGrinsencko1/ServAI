from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.order import Order


class OrderRepository:

    @staticmethod
    def create(
        db: Session,
        customer_id: int,
        total_amount: Decimal,
        status: str = "pending"
    ):
        order = Order(
            customer_id=customer_id,
            total_amount=total_amount,
            status=status
        )

        db.add(order)
        db.flush()

        return order

    @staticmethod
    def get_all(db: Session):
        return db.query(Order).order_by(Order.id.desc()).all()

    @staticmethod
    def get_by_id(db: Session, order_id: int):
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def get_by_customer_id(db: Session, customer_id: int):
        return db.query(Order).filter(
            Order.customer_id == customer_id
        ).all()

    @staticmethod
    def update_status(db: Session, order_id: int, new_status: str):
        order = OrderRepository.get_by_id(db, order_id)

        if order is None:
            return None

        order.status = new_status

        db.commit()
        db.refresh(order)

        return order

    @staticmethod
    def delete(db: Session, order):
        db.delete(order)
        db.flush()

        return order