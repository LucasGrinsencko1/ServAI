
from sqlalchemy.orm import Session

from app.repositories.customer_repository import CustomerRepository
from app.repositories.order_repository import OrderRepository


class CustomerService:

    @staticmethod
    def create_customer(db: Session, name: str, email: str):
        existing_customer = CustomerRepository.get_by_email(db, email)

        if existing_customer:
            raise ValueError("A customer with this email already exists.")

        return CustomerRepository.create(
            db=db,
            name=name,
            email=email
        )

    @staticmethod
    def get_customer(db: Session, customer_id: int):
        customer = CustomerRepository.get_by_id(db, customer_id)

        if customer is None:
            raise ValueError("Customer not found.")

        return customer

    @staticmethod
    def get_customer_orders(db: Session, customer_id: int):
        customer = CustomerRepository.get_by_id(db, customer_id)

        if customer is None:
            raise ValueError("Customer not found.")

        return OrderRepository.get_by_customer_id(
            db=db,
            customer_id=customer_id
        )

    @staticmethod
    def get_all_customers(db: Session):
        return CustomerRepository.get_all(db)
