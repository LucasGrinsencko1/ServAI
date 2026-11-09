import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Loader2,
  Package,
  Truck,
  XCircle,
  ArrowRight,
  CalendarDays,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import {
  sendMessage,
  getChatHistory,
  getOrderDetails,
  type ChatMessage,
  type OrderDetails,
} from "../services/api";

export default function Assistant() {
  const [email, setEmail] = useState(
    () => localStorage.getItem("customer_email") || ""
  );

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const [orderDetails, setOrderDetails] = useState<
    Record<number, OrderDetails>
  >({});

  const [loadingOrders, setLoadingOrders] = useState<number[]>([]);
  const [orderErrors, setOrderErrors] = useState<
    Record<number, string>
  >({});

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    null
  );

  const orderCardRefs = useRef<
    Record<number, HTMLDivElement | null>
  >({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickReplies = [
    {
      label: "Where is my order?",
      message: "Where is my order?",
      description: "Track your latest purchase",
      icon: Truck,
    },
    {
      label: "Check my order status",
      message: "I want to check my order status.",
      description: "See the current order status",
      icon: Package,
    },
    {
      label: "Cancel my order",
      message: "I want to cancel my order.",
      description: "Request an order cancellation",
      icon: XCircle,
    },
  ];

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim()
  );

  // Find the latest assistant message.
  const latestAssistantIndex = messages.reduce(
    (latestIndex, item, index) =>
      item.role === "assistant" ? index : latestIndex,
    -1
  );

  const latestAssistantMessage =
    latestAssistantIndex >= 0
      ? messages[latestAssistantIndex]
      : undefined;

  // Find the latest user message before the assistant response.
  const latestUserMessage =
    latestAssistantIndex >= 0
      ? [...messages.slice(0, latestAssistantIndex)]
          .reverse()
          .find((item) => item.role === "user")
      : undefined;

  // Detect when the customer requests order details.
  const orderDetailsPattern =
    /(?:details?|detalhes?|informaç(?:ões|ao)|informacoes).{0,80}(?:order|pedido)|(?:order|pedido).{0,80}(?:details?|detalhes?|informaç(?:ões|ao)|informacoes)/i;

  const asksForOrderDetails = orderDetailsPattern.test(
    latestUserMessage?.content || ""
  );

  // Detect when the customer asks to see their order list.
  // Examples: "What are my orders?", "Show my recent orders",
  // "Quais são meus pedidos?" and "Liste meus pedidos".
  const orderListPattern =
    /\b(?:my|all my|recent)\s+orders?\b|\b(?:what|show|list|display).{0,50}\borders?\b|\b(?:quais|mostre|listar|liste|ver).{0,50}\bpedidos?\b|\bmeus pedidos\b/i;

  const asksForOrderList = orderListPattern.test(
    latestUserMessage?.content || ""
  );

  // Extract order numbers from both messages.
  // Supports: "order #1", "pedido #1", "pedido 1".
  const orderReferenceText = [
    latestAssistantMessage?.content || "",
    latestUserMessage?.content || "",
  ].join("\n");

  const orderReferences =
    orderReferenceText.match(
      /\b(?:order|pedido)\s*#?\s*\d+\b/gi
    ) || [];

  const orderIds = Array.from(
    new Set(
      orderReferences
        .map((reference) => reference.match(/\d+/)?.[0])
        .filter((id): id is string => Boolean(id))
    )
  );

  const orderIdsKey = orderIds.join(",");

  // Hide the assistant text when the customer requested either
  // the order list or order details and order cards can be displayed.
  const isOrderDetailsResponse =
    (asksForOrderDetails || asksForOrderList) && orderIds.length > 0;

  // Load order details automatically.
  useEffect(() => {
    if (!orderIdsKey || !validEmail) {
      return;
    }

    let cancelled = false;

    async function loadOrderDetails() {
      const ids = orderIdsKey
        .split(",")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0);

      setLoadingOrders((previous) =>
        Array.from(new Set([...previous, ...ids]))
      );

      setOrderErrors((previous) => {
        const updated = { ...previous };

        ids.forEach((id) => {
          delete updated[id];
        });

        return updated;
      });

      await Promise.all(
        ids.map(async (id) => {
          try {
            const details = await getOrderDetails(id);

            if (!cancelled) {
              setOrderDetails((previous) => ({
                ...previous,
                [id]: details,
              }));
            }
          } catch {
            if (!cancelled) {
              setOrderErrors((previous) => ({
                ...previous,
                [id]: "Unable to load this order's details.",
              }));
            }
          } finally {
            if (!cancelled) {
              setLoadingOrders((previous) =>
                previous.filter((orderId) => orderId !== id)
              );
            }
          }
        })
      );
    }

    loadOrderDetails();

    return () => {
      cancelled = true;
    };
  }, [orderIdsKey, validEmail]);

  // Persist customer email.
  useEffect(() => {
    localStorage.setItem("customer_email", email);
  }, [email]);

  // Load conversation history.
  useEffect(() => {
    const trimmedEmail = email.trim();

    setMessages([]);
    setError("");
    setOrderDetails({});
    setOrderErrors({});
    setLoadingOrders([]);
    setSelectedOrderId(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);

      try {
        const history = await getChatHistory(trimmedEmail);

        if (!cancelled) {
          setMessages(history);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load conversation history.");
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [email]);

  // Automatically scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, historyLoading, orderDetails]);

  // Scroll to the selected order card.
  useEffect(() => {
    if (selectedOrderId === null) {
      return;
    }

    orderCardRefs.current[selectedOrderId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [selectedOrderId, orderDetails, loadingOrders]);

  function handleViewOrder(orderId: number) {
    setSelectedOrderId(orderId);
  }

  // Send a message to the assistant.
  async function handleSendMessage(customMessage?: string) {
    const trimmedMessage = (customMessage ?? message).trim();
    const trimmedEmail = email.trim();

    if (
      !trimmedMessage ||
      !trimmedEmail ||
      !validEmail ||
      loading ||
      historyLoading
    ) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedMessage,
    };

    setMessages((previous) => [...previous, userMessage]);
    setMessage("");
    setError("");
    setSelectedOrderId(null);
    setLoading(true);

    try {
      const response = await sendMessage(
        trimmedMessage,
        trimmedEmail
      );

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to contact the assistant."
      );
    } finally {
      setLoading(false);
    }
  }

  // Get visual status styles.
  function getStatusStyle(status: string) {
    switch (status.toLowerCase()) {
      case "pending":
        return {
          label: "Pending",
          className:
            "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
        };

      case "confirmed":
        return {
          label: "Confirmed",
          className:
            "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
        };

      case "preparing":
        return {
          label: "Preparing",
          className:
            "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
        };

      case "out_for_delivery":
        return {
          label: "Out for delivery",
          className:
            "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
        };

      case "delivered":
        return {
          label: "Delivered",
          className:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
        };

      case "cancelled":
        return {
          label: "Cancelled",
          className:
            "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
        };

      default:
        return {
          label: status,
          className:
            "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        };
    }
  }

  // Brazilian Real formatting.
  function formatPrice(value: number) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const assistantStatus = historyLoading
    ? "Loading conversation..."
    : loading
      ? "Generating response..."
      : validEmail
        ? "Ready to help"
        : "Customer email required";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
            <MessageCircle size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              AI Assistant
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Intelligent customer support powered by AI.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <Bot size={25} />

              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Support Assistant
              </h2>

              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    loading || historyLoading
                      ? "animate-pulse bg-amber-500"
                      : validEmail
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                  }`}
                />

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {assistantStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 sm:flex">
            <ShieldCheck
              size={16}
              className="text-emerald-600 dark:text-emerald-400"
            />

            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Support chat
            </span>
          </div>
        </div>

        {/* Customer Email */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="customer-email"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Customer email
            </label>

            {validEmail && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                Valid email
              </span>
            )}
          </div>

          <input
            id="customer-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="customer@example.com"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
              email.trim() && !validEmail
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/50 dark:focus:ring-rose-500/10"
                : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 dark:border-slate-700 dark:focus:ring-indigo-500/10"
            }`}
          />

          {email.trim() && !validEmail && (
            <p className="mt-2 text-xs text-rose-500 dark:text-rose-400">
              Please enter a valid email address.
            </p>
          )}

          {!email.trim() && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Enter a customer email to access the support assistant.
            </p>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/50 sm:p-6">

          {/* History Loading */}
          {historyLoading && (
            <div className="flex items-center justify-center gap-3 py-10">
              <Loader2
                size={19}
                className="animate-spin text-indigo-600 dark:text-indigo-400"
              />

              <span className="text-sm text-slate-500 dark:text-slate-400">
                Loading conversation history...
              </span>
            </div>
          )}

          {/* Welcome Screen */}
          {!historyLoading && messages.length === 0 && (
            <div className="flex min-h-full flex-col items-center justify-center py-6 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 shadow-sm dark:from-indigo-500/15 dark:to-violet-500/15 dark:text-indigo-400">
                <Sparkles size={35} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                How can I help you?
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                I'm your AI support assistant. Ask me about
                your orders, delivery status, or anything
                related to your purchase.
              </p>

              <div className="mt-8 w-full max-w-lg">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Quick questions
                  </p>

                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Choose an option
                  </span>
                </div>

                <div className="grid gap-3">
                  {quickReplies.map((reply) => {
                    const Icon = reply.icon;

                    return (
                      <button
                        key={reply.label}
                        onClick={() =>
                          handleSendMessage(reply.message)
                        }
                        disabled={
                          !validEmail ||
                          loading ||
                          historyLoading
                        }
                        className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/60"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:group-hover:bg-indigo-500/20">
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {reply.label}
                          </p>

                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {reply.description}
                          </p>
                        </div>

                        <ArrowRight
                          size={17}
                          className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600 dark:text-slate-600 dark:group-hover:text-indigo-400"
                        />
                      </button>
                    );
                  })}
                </div>

                {!validEmail && (
                  <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">
                    Enter a valid customer email to use quick replies.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          {messages.map((item, index) => {
            const isUser = item.role === "user";

            const isCurrentOrderDetails =
              item.role === "assistant" &&
              index === latestAssistantIndex &&
              isOrderDetailsResponse;

            return (
              <div key={index} className="space-y-3">

                {/* Hide AI text bubble for order detail responses */}
                {!isCurrentOrderDetails && (
                  <div
                    className={`flex items-end gap-2.5 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                        <Bot size={19} />
                      </div>
                    )}

                    <div
                      className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="mb-1.5 px-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {isUser ? "You" : "AI Assistant"}
                      </span>

                      <div
                        className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3.5 text-sm leading-6 shadow-sm ${
                          isUser
                            ? "rounded-br-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white"
                            : "rounded-bl-sm border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        }`}
                      >
                        {item.content}
                      </div>
                    </div>

                    {isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        <User size={19} />
                      </div>
                    )}
                  </div>
                )}

                {/* Contextual Order Buttons */}
                {item.role === "assistant" &&
                  index === latestAssistantIndex &&
                  orderIds.length > 0 &&
                  !isOrderDetailsResponse &&
                  !loading && (
                    <div className="ml-11 max-w-md">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Explore your orders
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {orderIds.map((orderId) => {
                          const numericId = Number(orderId);
                          const isSelected =
                            selectedOrderId === numericId;

                          return (
                            <button
                              key={orderId}
                              onClick={() =>
                                handleViewOrder(numericId)
                              }
                              disabled={
                                !validEmail || historyLoading
                              }
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                                  : "border-indigo-200 bg-white text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-indigo-400 dark:hover:border-indigo-400 dark:hover:bg-indigo-500/10"
                              }`}
                            >
                              <Package size={14} />

                              View order #{orderId}

                              {isSelected ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <ArrowRight size={13} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Order Details Cards */}
                {item.role === "assistant" &&
                  index === latestAssistantIndex &&
                  orderIds.map((orderId) => {
                    const numericId = Number(orderId);
                    const order = orderDetails[numericId];

                    const isLoading = loadingOrders.includes(
                      numericId
                    );

                    const orderError = orderErrors[numericId];

                    const isSelected =
                      selectedOrderId === numericId;

                    if (isLoading) {
                      return (
                        <div
                          key={`loading-${orderId}`}
                          ref={(element) => {
                            orderCardRefs.current[numericId] = element;
                          }}
                          className="ml-11 max-w-md rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <Loader2
                              size={18}
                              className="animate-spin text-indigo-600 dark:text-indigo-400"
                            />

                            Loading order #{orderId} details...
                          </div>
                        </div>
                      );
                    }

                    if (orderError) {
                      return (
                        <div
                          key={`error-${orderId}`}
                          ref={(element) => {
                            orderCardRefs.current[numericId] = element;
                          }}
                          className="ml-11 max-w-md rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
                        >
                          {orderError}
                        </div>
                      );
                    }

                    if (!order) {
                      return null;
                    }

                    const orderItems = Array.isArray(order.items)
                      ? order.items
                      : [];

                    const status = getStatusStyle(order.status);

                    const itemsTotal = orderItems.reduce(
                      (total, product) =>
                        total +
                        product.quantity * product.unit_price,
                      0
                    );

                    const hasTotalMismatch =
                      Math.abs(itemsTotal - order.total_amount) >
                      0.01;

                    return (
                      <div
                        key={`order-${orderId}`}
                        ref={(element) => {
                          orderCardRefs.current[numericId] = element;
                        }}
                        className={`ml-11 max-w-md overflow-hidden rounded-xl bg-white transition-all duration-300 dark:bg-slate-900 ${
                          isSelected
                            ? "border-2 border-indigo-500 shadow-lg ring-4 ring-indigo-100 dark:ring-indigo-500/10"
                            : "border border-slate-200 shadow-sm dark:border-slate-700"
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
                              }`}
                            >
                              <ShoppingBag size={20} />
                            </div>

                            <div>
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                Order details
                              </p>

                              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                                #{order.id}
                              </h3>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        {/* Order Summary */}
                        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                          <div>
                            <div className="mb-1 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                              <DollarSign size={14} />
                              Total amount
                            </div>

                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              {formatPrice(order.total_amount)}
                            </p>
                          </div>

                          <div>
                            <div className="mb-1 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                              <CalendarDays size={14} />
                              Customer ID
                            </div>

                            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                              #{order.customer_id}
                            </p>
                          </div>
                        </div>

                        {/* Products */}
                        <div className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <Package
                              size={17}
                              className="text-indigo-600 dark:text-indigo-400"
                            />

                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              Products
                            </h4>

                            <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {orderItems.length} items
                            </span>
                          </div>

                          {orderItems.length > 0 ? (
                            <div className="space-y-3">
                              {orderItems.map((product) => (
                                <div
                                  key={product.id}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                      {product.product_name}
                                    </p>

                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                      Qty: {product.quantity} ×{" "}
                                      {formatPrice(product.unit_price)}
                                    </p>
                                  </div>

                                  <p className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {formatPrice(
                                      product.quantity *
                                        product.unit_price
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-500">
                              No products found for this order.
                            </p>
                          )}
                        </div>

                        {/* Total Mismatch Warning */}
                        {hasTotalMismatch && (
                          <div className="mx-4 mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                            <AlertTriangle
                              size={18}
                              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                            />

                            <div>
                              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                                Order total mismatch
                              </p>

                              <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-400">
                                The sum of the products (
                                {formatPrice(itemsTotal)}) differs
                                from the registered order total (
                                {formatPrice(order.total_amount)}).
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Order #{order.id}
                            </span>

                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              Total: {formatPrice(order.total_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}

          {/* AI Typing Indicator */}
          {loading && (
            <div className="flex items-end gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                <Bot size={19} />
              </div>

              <div>
                <span className="mb-1.5 block px-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  AI Assistant
                </span>

                <div className="flex items-center gap-3 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-indigo-500"
                      style={{ animationDelay: "0ms" }}
                    />

                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-indigo-500"
                      style={{ animationDelay: "150ms" }}
                    />

                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-indigo-500"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Generating response...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
              <XCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Something went wrong
                </p>

                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:ring-indigo-500/10">
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              disabled={loading || historyLoading}
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={
                loading ||
                historyLoading ||
                !message.trim() ||
                !validEmail
              }
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />

              <span className="hidden sm:inline">
                Send
              </span>
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <ShieldCheck
              size={13}
              className="text-slate-400 dark:text-slate-500"
            />

            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              AI responses may not always be accurate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}