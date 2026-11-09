from app.db.session import SessionLocal
from app.models.order import Order
from app.models.order_item import OrderItem


def clear_orders():
    db = SessionLocal()

    try:
        total_items = db.query(OrderItem).count()
        total_orders = db.query(Order).count()

        db.query(OrderItem).delete(synchronize_session=False)
        db.query(Order).delete(synchronize_session=False)

        db.commit()

        print("\nLimpeza concluída!")
        print(f"Pedidos removidos: {total_orders}")
        print(f"Itens removidos: {total_items}")

    except Exception as error:
        db.rollback()
        print(f"Erro ao limpar pedidos: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    clear_orders()