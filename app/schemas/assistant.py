
from pydantic import BaseModel, EmailStr, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    customer_email: EmailStr


class ChatResponse(BaseModel):
    response: str
