import pytest

from app.services.customer_service import CustomerService


def test_create_customer(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="John Doe",
        email="john.doe.test@example.com"
    )

    assert customer.id is not None
    assert customer.name == "John Doe"
    assert customer.email == "john.doe.test@example.com"


def test_get_customer(db_session):
    customer = CustomerService.create_customer(
        db=db_session,
        name="Jane Doe",
        email="jane.doe.test@example.com"
    )

    retrieved_customer = CustomerService.get_customer(
        db=db_session,
        customer_id=customer.id
    )

    assert retrieved_customer.id == customer.id
    assert retrieved_customer.name == "Jane Doe"


def test_create_customer_with_duplicate_email(db_session):
    CustomerService.create_customer(
        db=db_session,
        name="John Doe",
        email="duplicate@example.com"
    )

    with pytest.raises(ValueError):
        CustomerService.create_customer(
            db=db_session,
            name="Another Person",
            email="duplicate@example.com"
        )