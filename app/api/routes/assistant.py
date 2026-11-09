
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.assistant import ChatRequest, ChatResponse
from app.services.assistant_service import AssistantService
from app.models.customer import Customer
from app.models.conversation import Conversation


router = APIRouter()


@router.post("/chat/", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    try:
        response = AssistantService.get_response(
            message=request.message,
            db=db,
            customer_email=request.customer_email
        )

        return ChatResponse(response=response)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your message."
        )


@router.get("/chat/history/")
def get_chat_history(
    customer_email: str,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.email == customer_email
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found."
        )

    conversations = db.query(Conversation).filter(
        Conversation.customer_id == customer.id
    ).order_by(
        Conversation.created_at.asc()
    ).all()

    return [
        {
            "id": conversation.id,
            "message": conversation.message,
            "response": conversation.response,
            "created_at": conversation.created_at
        }
        for conversation in conversations
    ]


@router.get("/chat/conversations/")
def get_all_conversations(
    db: Session = Depends(get_db)
):
    conversations = (
        db.query(Conversation)
        .join(Customer)
        .order_by(Conversation.created_at.desc())
        .all()
    )

    return [
        {
            "id": conversation.id,
            "customer_id": conversation.customer_id,
            "customer_name": conversation.customer.name,
            "customer_email": conversation.customer.email,
            "message": conversation.message,
            "response": conversation.response,
            "created_at": conversation.created_at
        }
        for conversation in conversations
    ]


@router.delete("/chat/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    db.delete(conversation)
    db.commit()

    return {
        "message": "Conversation deleted successfully."
    }
