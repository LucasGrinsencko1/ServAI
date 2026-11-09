const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface Customer {
  id: number;
  name: string;
  email: string;
}

export interface CustomerCreate {
  name: string;
  email: string;
}

export interface Order {
  id: number;
  customer_id: number;
  status: string;
  total_amount: number;
  created_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface OrderDetails extends Order {
  items: OrderItem[];
}

export interface OrderItemInput {
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface OrderCreate {
  customer_id: number;
  items: OrderItemInput[];
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationHistory {
  id: number;
  message: string;
  response: string;
  created_at: string;
}

export interface AllConversation {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  message: string;
  response: string;
  created_at: string;
}

export async function getCustomers(): Promise<Customer[]> {
  const response = await fetch(`${API_URL}/customers/`);

  if (!response.ok) {
    throw new Error("Failed to fetch customers.");
  }

  return response.json();
}

export async function createCustomer(
  customerData: CustomerCreate
): Promise<Customer> {
  const response = await fetch(`${API_URL}/customers/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to create customer."
    );
  }

  return response.json();
}

export async function getOrders(): Promise<Order[]> {
  const response = await fetch(`${API_URL}/orders/`);

  if (!response.ok) {
    throw new Error("Failed to fetch orders.");
  }

  return response.json();
}

export async function createOrder(
  orderData: OrderCreate
): Promise<Order> {
  const response = await fetch(`${API_URL}/orders/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to create order."
    );
  }

  return response.json();
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<Order> {
  const response = await fetch(
    `${API_URL}/orders/${orderId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to update order status."
    );
  }

  return response.json();
}

export async function getOrderDetails(
  orderId: number
): Promise<OrderDetails> {
  const [orderResponse, itemsResponse] = await Promise.all([
    fetch(`${API_URL}/orders/${orderId}`),
    fetch(`${API_URL}/orders/${orderId}/items`),
  ]);

  if (!orderResponse.ok) {
    throw new Error("Failed to fetch order details.");
  }

  if (!itemsResponse.ok) {
    throw new Error("Failed to fetch order items.");
  }

  const order = await orderResponse.json();
  const items = await itemsResponse.json();

  return {
    ...order,
    items,
  };
}

export async function addOrderItem(
  orderId: number,
  itemData: OrderItemInput
): Promise<OrderItem> {
  const response = await fetch(
    `${API_URL}/orders/${orderId}/items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to add order item."
    );
  }

  return response.json();
}

export async function updateOrderItem(
  orderId: number,
  itemId: number,
  itemData: OrderItemInput
): Promise<OrderItem> {
  const response = await fetch(
    `${API_URL}/orders/${orderId}/items/${itemId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to update order item."
    );
  }

  return response.json();
}

export async function deleteOrderItem(
  orderId: number,
  itemId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/orders/${orderId}/items/${itemId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to delete order item."
    );
  }
}

export async function sendMessage(
  message: string,
  customerEmail: string
): Promise<string> {
  const response = await fetch(`${API_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      customer_email: customerEmail,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to send message."
    );
  }

  const data = await response.json();

  return data.response;
}

export async function getChatHistory(
  customerEmail: string
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_URL}/chat/history/?customer_email=${encodeURIComponent(customerEmail)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch chat history.");
  }

  const data: ConversationHistory[] = await response.json();

  return data.flatMap((conversation) => [
    {
      role: "user" as const,
      content: conversation.message,
    },
    {
      role: "assistant" as const,
      content: conversation.response,
    },
  ]);
}

export async function getAllConversations(): Promise<AllConversation[]> {
  const response = await fetch(`${API_URL}/chat/conversations/`);

  if (!response.ok) {
    throw new Error("Failed to fetch conversations.");
  }

  return response.json();
}

export async function deleteConversation(
  conversationId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/chat/conversations/${conversationId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to delete conversation."
    );
  }
}