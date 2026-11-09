
import json

from sqlalchemy.orm import Session

from app.services.llm_service import LLMService
from app.services.assistant_tools import AssistantTools
from app.models.customer import Customer
from app.models.conversation import Conversation


class AssistantService:

    SYSTEM_INSTRUCTION = """
    You are ServAI, an intelligent customer support assistant.

    Your responsibilities:
    - Help customers with questions about their orders.
    - Communicate clearly, politely, and professionally.
    - Respond in the same language used by the customer.
    - Ask for clarification when information is missing.

    Available tools:
    - get_order_status: Retrieve a specific order.
    - get_customer_orders: List the customer's orders.
    - get_order_items: Retrieve the items in a specific order.
    - cancel_order: Cancel an eligible order.

    Customer identification and security:
    - The authenticated customer email is provided by the backend.
    - Never ask the customer to provide another customer's email.
    - Never attempt to access another customer's orders.
    - Always use the available tools to retrieve real customer information.
    - Never invent customer information or order details.

    Order consultation rules:
    - When the customer asks about their orders, order history,
      recent purchases, or all their orders, ALWAYS call
      get_customer_orders.
    - When the customer asks about a specific order and provides
      its ID, call get_order_status.
    - When the customer asks for the products in an order,
      call get_order_items.
    - When the customer asks for complete order details,
      retrieve both order information and its items.
    - If the customer mentions an order but does not provide
      enough information to identify it, ask for clarification.
    - Present order information in a clear and organized way.
    - If the customer has no orders, explain this clearly.
    - Never invent missing products, statuses, dates, or values.

    Order status rules:
    - Explain the order status in simple language.
    - pending: The order is awaiting confirmation.
    - confirmed: The order has been confirmed.
    - preparing: The order is being prepared.
    - out_for_delivery: The order is on its way.
    - delivered: The order has been delivered.
    - cancelled: The order has been cancelled.
    - Preserve the actual status returned by the backend.

    Cancellation rules:
    - Never cancel an order unless the customer explicitly requests it.
    - Before cancellation, identify the correct order.
    - Never attempt to bypass backend business rules.
    - Python backend services enforce all business rules.
    - If a cancellation is rejected, explain why.
    - Never claim an operation succeeded unless the backend confirms it.

    Currency and formatting rules:
    - The platform uses Brazilian Real (BRL).
    - ALWAYS display monetary values using the R$ symbol.
    - NEVER use $, USD, or any other currency symbol.
    - Format monetary values using Brazilian conventions.
    - Example: R$ 109,90 instead of $109.90.
    - Preserve the exact monetary values returned by the backend.
    - Do not convert or recalculate the order total.

    Order details rules:
    - Display each product with its name, quantity, unit price,
      and subtotal when this information is available.
    - Display the total amount returned by get_order_status.
    - Do not assume that the sum of the items equals the order total.
    - If the sum of the item subtotals differs from the order total,
      clearly inform the customer that the values do not match.
    - Never invent missing products or values.

    General rules:
    - Always use tools to retrieve real order information.
    - Never claim information was retrieved if a tool was not executed.
    - Be transparent when information is unavailable.
    - Keep responses concise and helpful.
    """

    @staticmethod
    def get_response(
        message: str,
        db: Session,
        customer_email: str
    ) -> str:

        if not message.strip():
            raise ValueError("Message cannot be empty.")

        customer = db.query(Customer).filter(
            Customer.email == customer_email
        ).first()

        def get_order_status(order_id: int) -> dict:
            """Retrieve the status and details of a specific customer order."""
            print(f"TOOL EXECUTED: get_order_status({order_id})")

            try:
                return AssistantTools.get_order_status(
                    db=db,
                    order_id=order_id,
                    customer_email=customer_email
                )
            except ValueError as error:
                return {"error": str(error)}

        def get_customer_orders() -> list:
            """List all orders belonging to the current customer."""
            print("TOOL EXECUTED: get_customer_orders()")

            try:
                return AssistantTools.get_customer_orders(
                    db=db,
                    customer_email=customer_email
                )
            except ValueError as error:
                return {"error": str(error)}

        def get_order_items(order_id: int) -> list:
            """Retrieve all items belonging to a specific customer order."""
            print(f"TOOL EXECUTED: get_order_items({order_id})")

            try:
                return AssistantTools.get_order_items(
                    db=db,
                    order_id=order_id,
                    customer_email=customer_email
                )
            except ValueError as error:
                return {"error": str(error)}

        def cancel_order(order_id: int) -> dict:
            """Cancel a specific order when explicitly requested by the customer."""
            print(f"TOOL EXECUTED: cancel_order({order_id})")

            try:
                return AssistantTools.cancel_order(
                    db=db,
                    order_id=order_id,
                    customer_email=customer_email
                )
            except ValueError as error:
                return {"error": str(error)}

        prompt = f"""
        {AssistantService.SYSTEM_INSTRUCTION}

        Authenticated customer email:
        {customer_email}

        Customer message:
        {message}
        """

        response = LLMService.generate_response(
            prompt=prompt,
            tools=[
                get_order_status,
                get_customer_orders,
                get_order_items,
                cancel_order
            ]
        )

        if isinstance(response, (dict, list)):
            stored_response = json.dumps(
                response,
                ensure_ascii=False,
                default=str
            )
        else:
            stored_response = str(response)

        if customer:
            conversation = Conversation(
                customer_id=customer.id,
                message=message,
                response=stored_response
            )

            try:
                db.add(conversation)
                db.commit()
            except Exception:
                db.rollback()
                raise

        return response
