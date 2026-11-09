import pytest
from decimal import Decimal
from types import SimpleNamespace

from app.services.customer_service import CustomerService
from app.services.order_service import OrderService
from app.services.order_item_service import OrderItemService


def create_test_order(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Test Customer",
        email="test.items@example.com"
    )

    initial_item = SimpleNamespace(
        product_name="Initial Product",
        quantity=1,
        unit_price=Decimal("50.00")
    )

    return OrderService.create_order(
        db=db_session,
        customer_id=customer.id,
        items=[initial_item]
    )


def test_add_item_to_order(db_session):
    order = create_test_order(db_session)

    item = OrderItemService.add_item(
        db=db_session,
        order_id=order.id,
        product_name="Cheeseburger",
        quantity=2,
        unit_price=Decimal("25.00")
    )

    assert item.id is not None
    assert item.order_id == order.id
    assert item.product_name == "Cheeseburger"
    assert item.quantity == 2
    assert item.unit_price == Decimal("25.00")


def test_add_item_to_nonexistent_order(db_session):
    with pytest.raises(ValueError, match="Order not found."):
        OrderItemService.add_item(
            db=db_session,
            order_id=999,
            product_name="Cheeseburger",
            quantity=1,
            unit_price=Decimal("25.00")
        )


def test_add_item_with_invalid_quantity(db_session):
    order = create_test_order(db_session)

    with pytest.raises(ValueError, match="Quantity must be greater than zero."):
        OrderItemService.add_item(
            db=db_session,
            order_id=order.id,
            product_name="Cheeseburger",
            quantity=0,
            unit_price=Decimal("25.00")
        )


def test_get_order_items(db_session):
    order = create_test_order(db_session)

    OrderItemService.add_item(
        db=db_session,
        order_id=order.id,
        product_name="Cheeseburger",
        quantity=2,
        unit_price=Decimal("25.00")
    )

    items = OrderItemService.get_order_items(
        db=db_session,
        order_id=order.id
    )

    assert len(items) == 2

    cheeseburger = next(
        item for item in items
        if item.product_name == "Cheeseburger"
    )

    assert cheeseburger.quantity == 2


def test_add_item_updates_order_total(db_session):
    order = create_test_order(db_session)

    OrderItemService.add_item(
        db=db_session,
        order_id=order.id,
        product_name="Cheeseburger",
        quantity=2,
        unit_price=Decimal("25.00")
    )

    db_session.refresh(order)

    assert order.total_amount == Decimal("100.00")


def test_add_multiple_items_updates_order_total(db_session):
    order = create_test_order(db_session)

    OrderItemService.add_item(
        db=db_session,
        order_id=order.id,
        product_name="Cheeseburger",
        quantity=2,
        unit_price=Decimal("25.00")
    )

    OrderItemService.add_item(
        db=db_session,
        order_id=order.id,
        product_name="Soda",
        quantity=2,
        unit_price=Decimal("5.00")
    )

    db_session.refresh(order)

    assert order.total_amount == Decimal("110.00")


def test_prevent_adding_items_to_cancelled_order(db_session):
    order = create_test_order(db_session)

    OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="cancelled"
    )

    with pytest.raises(
        ValueError,
        match="Cannot modify items in a cancelled or delivered order."
    ):
        OrderItemService.add_item(
            db=db_session,
            order_id=order.id,
            product_name="Cheeseburger",
            quantity=1,
            unit_price=Decimal("25.00")
        )


def test_prevent_adding_items_to_delivered_order(db_session):
    order = create_test_order(db_session)

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

    OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="out_for_delivery"
    )

    OrderService.update_order_status(
        db=db_session,
        order_id=order.id,
        new_status="delivered"
    )

    with pytest.raises(
        ValueError,
        match="Cannot modify items in a cancelled or delivered order."
    ):
        OrderItemService.add_item(
            db=db_session,
            order_id=order.id,
            product_name="Cheeseburger",
            quantity=1,
            unit_price=Decimal("25.00")
        )


def test_prevent_cancellation_when_order_is_preparing(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Test Customer",
        email="preparing.order@example.com"
    )

    initial_item = SimpleNamespace(
        product_name="Initial Product",
        quantity=1,
        unit_price=Decimal("50.00")
    )

    order = OrderService.create_order(
        db=db_session,
        customer_id=customer.id,
        items=[initial_item]
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

    with pytest.raises(ValueError, match="Cannot change order status"):
        OrderService.update_order_status(
            db=db_session,
            order_id=order.id,
            new_status="cancelled"
        )