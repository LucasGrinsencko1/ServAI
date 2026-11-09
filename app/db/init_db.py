from app.db.session import engine, Base

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.conversation import Conversation


def create_tables():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_tables()
    print("Database tables created successfully.")