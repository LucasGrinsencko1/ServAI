
import pytest
from decimal import Decimal
from types import SimpleNamespace

from app.services.customer_service import CustomerService
from app.services.order_service import OrderService


def create_test_order(db_session, customer_id, amount="59.90"):
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


def test_create_order(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="John Doe",
        email="john.order@example.com"
    )

    order = create_test_order(
        db_session,
        customer.id,
        "59.90"
    )

    assert order.id is not None
    assert order.customer_id == customer.id
    assert order.total_amount == Decimal("59.90")
    assert order.status == "pending"
    assert len(order.items) == 1


def test_create_order_with_invalid_customer(db_session):
    item = SimpleNamespace(
        product_name="Test Product",
        quantity=1,
        unit_price=Decimal("59.90")
    )

    with pytest.raises(ValueError, match="Customer not found."):
        OrderService.create_order(
            db=db_session,
            customer_id=999,
            items=[item]
        )


def test_create_order_with_invalid_amount(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Jane Doe",
        email="jane.order@example.com"
    )

    item = SimpleNamespace(
        product_name="Test Product",
        quantity=1,
        unit_price=Decimal("0")
    )

    with pytest.raises(ValueError, match="Unit price must be greater than zero."):
        OrderService.create_order(
            db=db_session,
            customer_id=customer.id,
            items=[item]
        )


def test_get_order(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Carlos Silva",
        email="carlos.order@example.com"
    )

    order = create_test_order(
        db_session,
        customer.id,
        "89.90"
    )

    retrieved_order = OrderService.get_order(
        db=db_session,
        order_id=order.id
    )

    assert retrieved_order.id == order.id
    assert retrieved_order.customer_id == customer.id


def test_get_nonexistent_order(db_session):
    with pytest.raises(ValueError, match="Order not found."):
        OrderService.get_order(
            db=db_session,
            order_id=999
        )


def test_update_order_status(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Maria Santos",
        email="maria.order@example.com"
    )

    order = create_test_order(db_session, customer.id)

    updated_order = OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="confirmed"
    )

    assert updated_order.status == "confirmed"


def test_prevent_invalid_order_status_transition(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Pedro Costa",
        email="pedro.order@example.com"
    )

    order = create_test_order(db_session, customer.id)

    OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="confirmed"
    )

    with pytest.raises(ValueError, match="Cannot change order status"):
        OrderService.update_order_status(
            db=db_session,
            order_id=order.id,
            new_status="delivered"
        )


def test_allow_valid_order_status_transition(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Ana Lima",
        email="ana.order@example.com"
    )

    order = create_test_order(db_session, customer.id)

    updated_order = OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="confirmed"
    )

    assert updated_order.status == "confirmed"


def test_allow_order_cancellation(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Bruno Alves",
        email="bruno.order@example.com"
    )

    order = create_test_order(db_session, customer.id)

    OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="confirmed"
    )

    cancelled_order = OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="cancelled"
    )

    assert cancelled_order.status == "cancelled"


def test_prevent_status_change_after_cancellation(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Julia Martins",
        email="julia.order@example.com"
    )

    order = create_test_order(db_session, customer.id)

    OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="cancelled"
    )

    with pytest.raises(ValueError, match="Cannot change order status"):
        OrderService.update_order_status(
            db=db_session,
            order_id=order.id,
            new_status="confirmed"
        )


def test_get_order_for_customer(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas@example.com"
    )

    order = create_test_order(
        db_session,
        customer.id,
        "99.90"
    )

    retrieved_order = OrderService.get_order_for_customer(
        db=db_session,
        order_id=order.id,
        customer_email="lucas@example.com"
    )

    assert retrieved_order.id == order.id
    assert retrieved_order.customer_id == customer.id


def test_prevent_customer_from_accessing_another_customers_order(db_session):
    customer_one = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas@example.com"
    )

    customer_two = CustomerService.create_customer(
        db=db_session,
        name="Maria Santos",
        email="maria@example.com"
    )

    order = create_test_order(
        db_session,
        customer_one.id,
        "99.90"
    )

    with pytest.raises(
        ValueError,
        match="Order not found for this customer."
    ):
        OrderService.get_order_for_customer(
            db=db_session,
            order_id=order.id,
            customer_email=customer_two.email
        )


def test_get_order_for_customer_with_nonexistent_order(db_session):
    with pytest.raises(ValueError, match="Order not found."):
        OrderService.get_order_for_customer(
            db=db_session,
            order_id=999,
            customer_email="lucas@example.com"
        )
