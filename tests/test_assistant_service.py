import pytest
from decimal import Decimal
from types import SimpleNamespace

from app.services.assistant_service import AssistantService
from app.services.customer_service import CustomerService
from app.services.order_service import OrderService


def test_get_response_registers_all_tools(db_session, monkeypatch):

    def mock_generate_response(prompt, tools=None):
        assert tools is not None

        tool_names = [tool.__name__ for tool in tools]

        assert tool_names == [
            "get_order_status",
            "get_customer_orders",
            "get_order_items",
            "cancel_order"
        ]

        return "Hello! How can I help you?"

    monkeypatch.setattr(
        "app.services.assistant_service.LLMService.generate_response",
        mock_generate_response
    )

    response = AssistantService.get_response(
        message="Hello!",
        db=db_session,
        customer_email="lucas@example.com"
    )

    assert response == "Hello! How can I help you?"


def test_get_order_status_tool_execution(db_session, monkeypatch):

    customer = CustomerService.create_customer(
        db=db_session,
        name="Lucas Silva",
        email="lucas@example.com"
    )

    initial_item = SimpleNamespace(
        product_name="Test Product",
        quantity=1,
        unit_price=Decimal("49.90")
    )

    order = OrderService.create_order(
        db=db_session,
        customer_id=customer.id,
        items=[initial_item]
    )

    def mock_generate_response(prompt, tools=None):
        return tools[0](order.id)

    monkeypatch.setattr(
        "app.services.assistant_service.LLMService.generate_response",
        mock_generate_response
    )

    response = AssistantService.get_response(
        message="What is my order status?",
        db=db_session,
        customer_email=customer.email
    )

    assert response["order_id"] == order.id
    assert response["status"] == "pending"


def test_get_response_rejects_empty_message(db_session):
    with pytest.raises(ValueError, match="Message cannot be empty."):
        AssistantService.get_response(
            message="",
            db=db_session,
            customer_email="lucas@example.com"
        )


def test_get_response_rejects_whitespace_message(db_session):
    with pytest.raises(ValueError, match="Message cannot be empty."):
        AssistantService.get_response(
            message="   ",
            db=db_session,
            customer_email="lucas@example.com"
        )