import pytest
from decimal import Decimal
from types import SimpleNamespace

from app.services.customer_service import CustomerService
from app.services.order_service import OrderService
from app.services.order_item_service import OrderItemService
from app.services.assistant_tools import AssistantTools


def create_test_order(db_session, customer_id, amount="49.90"):
    item = SimpleNamespace(
        product_name="Test Product",
        quantity=1,
        unit_price=Decimal(amount)
    )

    return OrderService.create_order(
        db=db_session,
        customer_id=customer_id,
        items=[item]
    )


def test_get_order_status(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas.tools@example.com"
    )

    order = create_test_order(
        db_session,
        customer.id,
        "99.90"
    )

    result = AssistantTools.get_order_status(
        db=db_session,
        order_id=order.id,
        customer_email=customer.email
    )

    assert result["order_id"] == order.id
    assert result["status"] == "pending"
    assert result["total_amount"] == "99.90"
    assert "created_at" in result


def test_prevent_access_to_another_customers_order(db_session):
    customer_one = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas.one@example.com"
    )

    customer_two = CustomerService.create_customer(
        db=db_session,
        name="Maria Santos",
        email="maria.two@example.com"
    )

    order = create_test_order(
        db_session,
        customer_one.id,
        "59.90"
    )

    with pytest.raises(ValueError):
        AssistantTools.get_order_status(
            db=db_session,
            order_id=order.id,
            customer_email=customer_two.email
        )


def test_get_order_status_with_nonexistent_order(db_session):
    with pytest.raises(ValueError, match="Order not found."):
        AssistantTools.get_order_status(
            db=db_session,
            order_id=999,
            customer_email="lucas.tools@example.com"
        )


def test_get_customer_orders(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas.orders@example.com"
    )

    first_order = create_test_order(
        db_session,
        customer.id,
        "49.90"
    )

    second_order = create_test_order(
        db_session,
        customer.id,
        "79.90"
    )

    result = AssistantTools.get_customer_orders(
        db=db_session,
        customer_email=customer.email
    )

    assert len(result) == 2
    assert result[0]["order_id"] == first_order.id
    assert result[1]["order_id"] == second_order.id


def test_get_customer_orders_with_nonexistent_customer(db_session):
    with pytest.raises(ValueError, match="Customer not found."):
        AssistantTools.get_customer_orders(
            db=db_session,
            customer_email="unknown@example.com"
        )


def test_get_order_items(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas.items@example.com"
    )

    order = create_test_order(
        db_session,
        customer.id,
        "20.00"
    )

    OrderItemService.add_item(
        db=db_session,
        order_id=order.id,
        product_name="Burger",
        quantity=2,
        unit_price=Decimal("10.00")
    )

    result = AssistantTools.get_order_items(
        db=db_session,
        order_id=order.id,
        customer_email=customer.email
    )

    assert len(result) == 2

    burger = next(
        item for item in result
        if item["product_name"] == "Burger"
    )

    assert burger["quantity"] == 2
    assert burger["unit_price"] == "10.00"
    assert burger["subtotal"] == "20.00"


def test_prevent_access_to_another_customers_order_items(db_session):
    customer_one = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas.items.one@example.com"
    )

    customer_two = CustomerService.create_customer(
        db=db_session,
        name="Maria Santos",
        email="maria.items.two@example.com"
    )

    order = create_test_order(
        db_session,
        customer_one.id,
        "20.00"
    )

    with pytest.raises(ValueError):
        AssistantTools.get_order_items(
            db=db_session,
            order_id=order.id,
            customer_email=customer_two.email
        )


def test_cancel_order(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas.cancel@example.com"
    )

    order = create_test_order(
        db_session,
        customer.id,
        "49.90"
    )

    result = AssistantTools.cancel_order(
        db=db_session,
        order_id=order.id,
        customer_email=customer.email
    )

    assert result["order_id"] == order.id
    assert result["status"] == "cancelled"
    assert result["message"] == "Order cancelled successfully."


def test_prevent_cancellation_of_order_in_preparation(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas.preparing@example.com"
    )

    order = create_test_order(
        db_session,
        customer.id,
        "49.90"
    )

    OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="confirmed"
    )

    OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="preparing"
    )

    with pytest.raises(ValueError):
        AssistantTools.cancel_order(
            db=db_session,
            order_id=order.id,
            customer_email=customer.email
        )