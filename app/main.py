
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.customers import router as customers_router
from app.api.routes.orders import router as orders_router
from app.api.routes.order_items import router as order_items_router
from app.api.routes.assistant import router as assistant_router
from app.api.routes.dashboard import router as dashboard_router


app = FastAPI(
    title="AI Support Assistant",
    description="An AI-powered customer support application.",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
    ],
    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(order_items_router)
app.include_router(assistant_router)
app.include_router(dashboard_router)
