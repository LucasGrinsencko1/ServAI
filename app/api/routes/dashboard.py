from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.conversation import Conversation


router = APIRouter()


@router.get("/dashboard/metrics/")
def get_dashboard_metrics(db: Session = Depends(get_db)):

    total_customers = db.query(func.count(Customer.id)).scalar() or 0

    total_orders = db.query(func.count(Order.id)).scalar() or 0

    total_conversations = db.query(
        func.count(Conversation.id)
    ).scalar() or 0

    orders_by_status = db.query(
        Order.status,
        func.count(Order.id)
    ).group_by(Order.status).all()

    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_conversations": total_conversations,
        "orders_by_status": {
            status: count
            for status, count in orders_by_status
        }
    }