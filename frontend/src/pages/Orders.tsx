import {
  Fragment,
  useEffect,
  useState,
  type FormEvent,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Plus,
  X,
  Trash2,
  ClipboardList,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save,
  Loader2,
  DollarSign,
  Mail,
  Utensils,
} from "lucide-react";

import {
  getOrders,
  getCustomers,
  createCustomer,
  createOrder,
  getOrderDetails,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  updateOrderStatus,
  type Order,
  type Customer,
  type OrderItem,
  type OrderItemInput,
  type OrderDetails,
  type OrderStatus,
} from "../services/api";

interface ProductForm {
  product_name: string;
  quantity: string;
  unit_price: string;
}

interface MenuProduct {
  name: string;
  price: number;
}

const MENU_PRODUCTS: MenuProduct[] = [
  { name: "Hambúrguer", price: 25 },
  { name: "Batata frita", price: 12 },
  { name: "Refrigerante", price: 7 },
];

const EMPTY_PRODUCT: ProductForm = {
  product_name: "",
  quantity: "1",
  unit_price: "",
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [products, setProducts] = useState<ProductForm[]>([
    { ...EMPTY_PRODUCT },
  ]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductForm>({
    ...EMPTY_PRODUCT,
  });

  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newProduct, setNewProduct] = useState<ProductForm>({
    ...EMPTY_PRODUCT,
  });

  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<OrderItem | null>(null);

  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState("");

  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders();
      setOrders(data);
    } catch {
      setError("Unable to load orders. Check if the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch {
      setCreateError(
        "Unable to load customers. Check the backend connection."
      );
    }
  }

  async function refreshOrderDetails(orderId: number) {
    try {
      const details = await getOrderDetails(orderId);
      setOrderDetails(details);

      const updatedOrders = await getOrders();
      setOrders(updatedOrders);
    } catch (err) {
      setItemError(
        err instanceof Error
          ? err.message
          : "Unable to refresh order details."
      );
    }
  }

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const term = search.toLowerCase();
    const status = (order.status || "").toLowerCase();

    return (
      order.id.toString().includes(term) ||
      order.customer_id.toString().includes(term) ||
      status.includes(term)
    );
  });

  function getStatusStyle(status: string | undefined) {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
      case "confirmed":
        return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
      case "preparing":
        return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
      case "out_for_delivery":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
      case "cancelled":
        return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
    }
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  }

  function formatDate(date: string | undefined) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getMenuPrice(productName: string): number | null {
    const normalizedName = productName.trim().toLocaleLowerCase("pt-BR");

    const menuProduct = MENU_PRODUCTS.find(
      (product) =>
        product.name.toLocaleLowerCase("pt-BR") === normalizedName
    );

    return menuProduct ? menuProduct.price : null;
  }

  function updateProduct(
    index: number,
    field: keyof ProductForm,
    value: string
  ) {
    setProducts((current) =>
      current.map((product, productIndex) => {
        if (productIndex !== index) return product;

        const updatedProduct = {
          ...product,
          [field]: value,
        };

        if (field === "product_name") {
          const menuPrice = getMenuPrice(value);

          updatedProduct.unit_price =
            menuPrice !== null ? String(menuPrice) : "";
        }

        return updatedProduct;
      })
    );
  }

  function addProduct() {
    setProducts((current) => [...current, { ...EMPTY_PRODUCT }]);
  }

  function removeProduct(index: number) {
    setProducts((current) =>
      current.filter((_, productIndex) => productIndex !== index)
    );
  }

  function handleNewProductName(
    value: string,
    setter: Dispatch<SetStateAction<ProductForm>>
  ) {
    setter((current) => {
      const menuPrice = getMenuPrice(value);

      return {
        ...current,
        product_name: value,
        unit_price: menuPrice !== null ? String(menuPrice) : "",
      };
    });
  }

  const orderTotal = products.reduce((total, product) => {
    const quantity = Number(product.quantity) || 0;
    const price = Number(product.unit_price.replace(",", ".")) || 0;

    return total + quantity * price;
  }, 0);

  function parseProductForm(product: ProductForm): OrderItemInput | null {
    const price = Number(product.unit_price.replace(",", "."));
    const quantity = Number(product.quantity);

    if (
      !product.product_name.trim() ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return null;
    }

    return {
      product_name: product.product_name.trim(),
      quantity,
      unit_price: price,
    };
  }

  async function findOrCreateCustomer(): Promise<number> {
    const normalizedName = customerName.trim();
    const normalizedEmail = customerEmail.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      throw new Error("Please enter the customer's name and email.");
    }

    const existingCustomer = customers.find(
      (customer) =>
        customer.email.trim().toLowerCase() === normalizedEmail
    );

    if (existingCustomer) {
      return existingCustomer.id;
    }

    const newCustomer = await createCustomer({
      name: normalizedName,
      email: normalizedEmail,
    });

    setCustomers((current) => [...current, newCustomer]);

    return newCustomer.id;
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreateError("");
    setSuccessMessage("");

    if (!customerName.trim() || !customerEmail.trim()) {
      setCreateError("Please enter the customer's name and email.");
      return;
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      customerEmail.trim()
    );

    if (!emailIsValid) {
      setCreateError("Please enter a valid email address.");
      return;
    }

    const items = products.map(parseProductForm);

    if (items.some((item) => item === null)) {
      setCreateError(
        "Please select a menu product or enter a valid product name and price."
      );
      return;
    }

    try {
      setCreating(true);

      const customerId = await findOrCreateCustomer();

      const createdOrder = await createOrder({
        customer_id: customerId,
        items: items as OrderItemInput[],
      });

      await loadOrders();
      await loadCustomers();

      setShowCreateForm(false);
      setCustomerName("");
      setCustomerEmail("");
      setProducts([{ ...EMPTY_PRODUCT }]);

      setSuccessMessage(
        `Order #${createdOrder.id} created successfully!`
      );
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create order."
      );
    } finally {
      setCreating(false);
    }
  }

  async function toggleOrderDetails(orderId: number) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setOrderDetails(null);
      setEditingItemId(null);
      setShowAddItemForm(false);
      setItemError("");
      return;
    }

    try {
      setExpandedOrderId(orderId);
      setOrderDetails(null);
      setLoadingDetails(true);
      setItemError("");
      setEditingItemId(null);
      setShowAddItemForm(false);

      const details = await getOrderDetails(orderId);
      setOrderDetails(details);
    } catch (err) {
      setItemError(
        err instanceof Error
          ? err.message
          : "Unable to load order details."
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  function canModifyOrder(order: Order) {
    return !["cancelled", "delivered"].includes(
      (order.status || "").toLowerCase()
    );
  }

  function getNextStatus(status: string): OrderStatus | null {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "confirmed";
      case "confirmed":
        return "preparing";
      case "preparing":
        return "out_for_delivery";
      case "out_for_delivery":
        return "delivered";
      default:
        return null;
    }
  }

  function getNextStatusLabel(nextStatus: OrderStatus): string {
    switch (nextStatus) {
      case "confirmed":
        return "Confirm Order";
      case "preparing":
        return "Start Preparing";
      case "out_for_delivery":
        return "Send for Delivery";
      case "delivered":
        return "Mark as Delivered";
      default:
        return "Update Status";
    }
  }

  async function handleStatusUpdate(
    order: Order,
    newStatus: OrderStatus
  ) {
    try {
      setStatusLoadingId(order.id);
      setStatusError("");
      setSuccessMessage("");

      await updateOrderStatus(order.id, newStatus);

      const updatedOrders = await getOrders();
      setOrders(updatedOrders);

      if (expandedOrderId === order.id) {
        const details = await getOrderDetails(order.id);
        setOrderDetails(details);
      }

      const statusLabels: Record<OrderStatus, string> = {
        pending: "Pending",
        confirmed: "Confirmed",
        preparing: "Preparing",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered",
        cancelled: "Cancelled",
      };

      setSuccessMessage(
        `Order #${order.id} updated to ${statusLabels[newStatus]} successfully!`
      );
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : "Unable to update order status."
      );
    } finally {
      setStatusLoadingId(null);
    }
  }

  function handleCancelOrder(order: Order) {
    setOrderToCancel(order);
    setShowCancelOrderModal(true);
    setStatusError("");
  }

  async function confirmCancelOrder() {
    if (!orderToCancel) return;

    const orderId = orderToCancel.id;

    try {
      setStatusLoadingId(orderId);
      setStatusError("");
      setSuccessMessage("");

      await updateOrderStatus(orderId, "cancelled");

      const updatedOrders = await getOrders();
      setOrders(updatedOrders);

      if (expandedOrderId === orderId) {
        const details = await getOrderDetails(orderId);
        setOrderDetails(details);
      }

      setShowCancelOrderModal(false);
      setOrderToCancel(null);

      setSuccessMessage(
        `Order #${orderId} cancelled successfully!`
      );
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : "Unable to cancel order."
      );
    } finally {
      setStatusLoadingId(null);
    }
  }

  function startEditing(item: OrderItem) {
    setEditingItemId(item.id);

    setEditingProduct({
      product_name: item.product_name,
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
    });

    setItemError("");
    setShowAddItemForm(false);
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditingProduct({ ...EMPTY_PRODUCT });
    setItemError("");
  }

  async function handleUpdateItem(
    event: FormEvent<HTMLFormElement>,
    itemId: number
  ) {
    event.preventDefault();

    if (!orderDetails) return;

    const itemData = parseProductForm(editingProduct);

    if (!itemData) {
      setItemError("Please enter valid product information.");
      return;
    }

    try {
      setItemLoading(true);
      setItemError("");
      setSuccessMessage("");

      await updateOrderItem(orderDetails.id, itemId, itemData);
      await refreshOrderDetails(orderDetails.id);

      setEditingItemId(null);
      setEditingProduct({ ...EMPTY_PRODUCT });

      setSuccessMessage("Product updated successfully!");
    } catch (err) {
      setItemError(
        err instanceof Error
          ? err.message
          : "Unable to update product."
      );
    } finally {
      setItemLoading(false);
    }
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!orderDetails) return;

    const itemData = parseProductForm(newProduct);

    if (!itemData) {
      setItemError("Please enter valid product information.");
      return;
    }

    try {
      setItemLoading(true);
      setItemError("");
      setSuccessMessage("");

      await addOrderItem(orderDetails.id, itemData);
      await refreshOrderDetails(orderDetails.id);

      setNewProduct({ ...EMPTY_PRODUCT });
      setShowAddItemForm(false);

      setSuccessMessage("Product added successfully!");
    } catch (err) {
      setItemError(
        err instanceof Error
          ? err.message
          : "Unable to add product."
      );
    } finally {
      setItemLoading(false);
    }
  }

  function handleDeleteItem(item: OrderItem) {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }

  async function confirmDeleteItem() {
    if (!orderDetails || !itemToDelete) return;

    const orderId = orderDetails.id;
    const productName = itemToDelete.product_name;

    try {
      setItemLoading(true);
      setItemError("");
      setSuccessMessage("");

      await deleteOrderItem(orderId, itemToDelete.id);

      const updatedOrders = await getOrders();
      setOrders(updatedOrders);

      const orderStillExists = updatedOrders.some(
        (order) => order.id === orderId
      );

      if (!orderStillExists) {
        setExpandedOrderId(null);
        setOrderDetails(null);
        setEditingItemId(null);
        setShowAddItemForm(false);
        setItemError("");

        setSuccessMessage(
          `${productName} removed successfully! Order #${orderId} was also deleted because it had no remaining products.`
        );
      } else {
        const details = await getOrderDetails(orderId);
        setOrderDetails(details);
        setEditingItemId(null);

        setSuccessMessage(`${productName} removed successfully!`);
      }

      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      setItemError(
        err instanceof Error
          ? err.message
          : "Unable to delete product."
      );
    } finally {
      setItemLoading(false);
    }
  }

  const totalValue = orders.reduce(
    (total, order) => total + Number(order.total_amount),
    0
  );

  const pendingOrders = orders.filter(
    (order) => (order.status || "").toLowerCase() === "pending"
  ).length;

  const confirmedOrders = orders.filter(
    (order) => (order.status || "").toLowerCase() === "confirmed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your snack bar orders and customers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowCreateForm(true);
              setCreateError("");
              setSuccessMessage("");
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Plus size={16} />
            Create Order
          </button>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={18} />
          {successMessage}

          <button
            onClick={() => setSuccessMessage("")}
            className="ml-auto"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Status error message */}
      {statusError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <AlertCircle size={18} />
          {statusError}

          <button
            onClick={() => setStatusError("")}
            className="ml-auto"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Orders
            </p>
            <ShoppingBag size={20} className="text-blue-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
            {orders.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pending Orders
            </p>
            <Package size={20} className="text-amber-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
            {pendingOrders}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Order Value
            </p>
            <ShoppingBag size={20} className="text-emerald-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
            {formatAmount(totalValue)}
          </p>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {confirmedOrders} confirmed orders
          </p>
        </div>
      </div>

      {/* Menu */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <Utensils size={19} className="text-indigo-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Snack Bar Menu
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MENU_PRODUCTS.map((product) => (
            <div
              key={product.name}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {product.name}
              </span>

              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {formatAmount(product.price)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Order Form */}
      {showCreateForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Create New Order
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter customer information and select products from the menu.
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateOrder} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <User size={16} />
                  Customer Name
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Enter customer name"
                  maxLength={150}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Mail size={16} />
                  Customer Email
                </label>

                <input
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="customer@email.com"
                  maxLength={255}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
              Existing customers are identified by email. New customers are registered automatically.
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Products
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Choose a product to fill in its price automatically.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addProduct}
                  className="flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  <Plus size={15} />
                  Add Product
                </button>
              </div>

              {products.map((product, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Product {index + 1}
                    </span>

                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="rounded p-1 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        title="Remove product"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                        Product Name
                      </label>

                      <input
                        type="text"
                        list={`menu-products-${index}`}
                        value={product.product_name}
                        onChange={(event) =>
                          updateProduct(index, "product_name", event.target.value)
                        }
                        placeholder="Type or select a product"
                        required
                        maxLength={150}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />

                      <datalist id={`menu-products-${index}`}>
                        {MENU_PRODUCTS.map((menuProduct) => (
                          <option
                            key={menuProduct.name}
                            value={menuProduct.name}
                          />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                        Quantity
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={product.quantity}
                        onChange={(event) =>
                          updateProduct(index, "quantity", event.target.value)
                        }
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                        Unit Price (R$)
                      </label>

                      <input
                        type="text"
                        inputMode="decimal"
                        value={product.unit_price}
                        onChange={(event) =>
                          updateProduct(index, "unit_price", event.target.value)
                        }
                        placeholder="Automatic price"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                    Subtotal:{" "}
                    {formatAmount(
                      (Number(product.quantity) || 0) *
                        (Number(product.unit_price.replace(",", ".")) || 0)
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-500/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Order Total
                </p>

                <p className="mt-1 text-2xl font-bold text-indigo-900 dark:text-indigo-200">
                  {formatAmount(orderTotal)}
                </p>

                <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                  Automatically calculated based on products and quantities.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={16} />
                  )}

                  {creating ? "Creating..." : "Create Order"}
                </button>
              </div>
            </div>

            {createError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle size={17} />
                {createError}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order ID, customer ID or status..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500">
            Loading orders...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-rose-500 dark:text-rose-400">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500">
            <ClipboardList
              size={32}
              className="mx-auto mb-3 opacity-40"
            />
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status / Actions</th>
                  <th className="px-5 py-4">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const nextStatus = getNextStatus(order.status);

                  const canCancel = ["pending", "confirmed"].includes(
                    (order.status || "").toLowerCase()
                  );

                  return (
                    <Fragment key={order.id}>
                      <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          #{order.id}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {customers.find(
                            (customer) => customer.id === order.customer_id
                          )?.name || `Customer #${order.customer_id}`}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(order.created_at)}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {formatAmount(Number(order.total_amount))}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-[190px] flex-col items-start gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                                order.status
                              )}`}
                            >
                              {(order.status || "Unknown").replace(/ /g, "")}
                            </span>

                            {nextStatus && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(order, nextStatus)
                                }
                                disabled={statusLoadingId === order.id}
                                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {statusLoadingId === order.id ? (
                                  <Loader2
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle2 size={13} />
                                )}

                                {getNextStatusLabel(nextStatus)}
                              </button>
                            )}

                            {canCancel && (
                              <button
                                onClick={() => handleCancelOrder(order)}
                                disabled={statusLoadingId === order.id}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                              >
                                <X size={13} />
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleOrderDetails(order.id)}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={15} />
                                Close
                              </>
                            ) : (
                              <>
                                <ChevronDown size={15} />
                                View
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={6}
                            className="bg-slate-50/80 px-5 py-6 dark:bg-slate-950/40"
                          >
                            <div className="space-y-5">
                              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                    Order #{order.id} Products
                                  </h3>

                                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Manage the products registered in this order.
                                  </p>
                                </div>

                                {canModifyOrder(order) && (
                                  <button
                                    onClick={() => {
                                      setShowAddItemForm(!showAddItemForm);
                                      setEditingItemId(null);
                                      setItemError("");
                                      setNewProduct({ ...EMPTY_PRODUCT });
                                    }}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-700"
                                  >
                                    <Plus size={15} />
                                    Add Product
                                  </button>
                                )}
                              </div>

                              {loadingDetails || !orderDetails ? (
                                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500 dark:text-slate-400">
                                  <Loader2
                                    size={18}
                                    className="animate-spin"
                                  />
                                  Loading order details...
                                </div>
                              ) : (
                                <>
                                  {itemError && (
                                    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                                      <AlertCircle size={17} />
                                      {itemError}

                                      <button
                                        onClick={() => setItemError("")}
                                        className="ml-auto"
                                      >
                                        <X size={15} />
                                      </button>
                                    </div>
                                  )}

                                  {orderDetails.items.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                                      <Package
                                        size={30}
                                        className="mx-auto mb-2 text-slate-400"
                                      />

                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        No products in this order.
                                      </p>

                                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Add a product to get started.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                                      <table className="w-full text-left">
                                        <thead className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500">
                                          <tr>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3">Quantity</th>
                                            <th className="px-4 py-3">Unit Price</th>
                                            <th className="px-4 py-3">Subtotal</th>
                                            <th className="px-4 py-3">Actions</th>
                                          </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                          {orderDetails.items.map((item) => {
                                            const isEditing =
                                              editingItemId === item.id;

                                            return (
                                              <tr key={item.id}>
                                                {isEditing ? (
                                                  <td colSpan={5} className="p-4">
                                                    <form
                                                      onSubmit={(event) =>
                                                        handleUpdateItem(event, item.id)
                                                      }
                                                      className="grid grid-cols-1 items-end gap-3 md:grid-cols-4"
                                                    >
                                                      <div>
                                                        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                                                          Product Name
                                                        </label>

                                                        <input
                                                          type="text"
                                                          list="edit-menu-products"
                                                          value={editingProduct.product_name}
                                                          onChange={(event) =>
                                                            setEditingProduct((current) => {
                                                              const menuPrice = getMenuPrice(event.target.value);

                                                              return {
                                                                ...current,
                                                                product_name: event.target.value,
                                                                unit_price:
                                                                  menuPrice !== null
                                                                    ? String(menuPrice)
                                                                    : current.unit_price,
                                                              };
                                                            })
                                                          }
                                                          maxLength={150}
                                                          required
                                                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                        />

                                                        <datalist id="edit-menu-products">
                                                          {MENU_PRODUCTS.map((product) => (
                                                            <option
                                                              key={product.name}
                                                              value={product.name}
                                                            />
                                                          ))}
                                                        </datalist>
                                                      </div>

                                                      <div>
                                                        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                                                          Quantity
                                                        </label>

                                                        <input
                                                          type="number"
                                                          min="1"
                                                          step="1"
                                                          value={editingProduct.quantity}
                                                          onChange={(event) =>
                                                            setEditingProduct((current) => ({
                                                              ...current,
                                                              quantity: event.target.value,
                                                            }))
                                                          }
                                                          required
                                                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                        />
                                                      </div>

                                                      <div>
                                                        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                                                          Unit Price (R$)
                                                        </label>

                                                        <input
                                                          type="text"
                                                          inputMode="decimal"
                                                          value={editingProduct.unit_price}
                                                          onChange={(event) =>
                                                            setEditingProduct((current) => ({
                                                              ...current,
                                                              unit_price: event.target.value,
                                                            }))
                                                          }
                                                          required
                                                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                        />
                                                      </div>

                                                      <div className="flex gap-2">
                                                        <button
                                                          type="submit"
                                                          disabled={itemLoading}
                                                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                                        >
                                                          {itemLoading ? (
                                                            <Loader2
                                                              size={14}
                                                              className="animate-spin"
                                                            />
                                                          ) : (
                                                            <Save size={14} />
                                                          )}
                                                          Save
                                                        </button>

                                                        <button
                                                          type="button"
                                                          onClick={cancelEditing}
                                                          disabled={itemLoading}
                                                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                        >
                                                          <X size={14} />
                                                        </button>
                                                      </div>
                                                    </form>
                                                  </td>
                                                ) : (
                                                  <>
                                                    <td className="px-4 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                                                      {item.product_name}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                      {item.quantity}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                      {formatAmount(Number(item.unit_price))}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                      {formatAmount(
                                                        item.quantity * Number(item.unit_price)
                                                      )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                      {canModifyOrder(order) && (
                                                        <div className="flex items-center gap-2">
                                                          <button
                                                            onClick={() => startEditing(item)}
                                                            disabled={itemLoading}
                                                            title="Edit product"
                                                            className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                                                          >
                                                            <Pencil size={16} />
                                                          </button>

                                                          <button
                                                            onClick={() => handleDeleteItem(item)}
                                                            disabled={itemLoading}
                                                            title="Delete product"
                                                            className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10"
                                                          >
                                                            <Trash2 size={16} />
                                                          </button>
                                                        </div>
                                                      )}
                                                    </td>
                                                  </>
                                                )}
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {showAddItemForm && (
                                    <form
                                      onSubmit={handleAddItem}
                                      className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                                          Add Product to Order
                                        </h4>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setShowAddItemForm(false);
                                            setNewProduct({ ...EMPTY_PRODUCT });
                                          }}
                                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                        >
                                          <X size={17} />
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                        <div>
                                          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                            Product Name
                                          </label>

                                          <input
                                            type="text"
                                            list="add-menu-products"
                                            value={newProduct.product_name}
                                            onChange={(event) =>
                                              handleNewProductName(
                                                event.target.value,
                                                setNewProduct
                                              )
                                            }
                                            placeholder="Type or select a product"
                                            maxLength={150}
                                            required
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                          />

                                          <datalist id="add-menu-products">
                                            {MENU_PRODUCTS.map((product) => (
                                              <option
                                                key={product.name}
                                                value={product.name}
                                              />
                                            ))}
                                          </datalist>
                                        </div>

                                        <div>
                                          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                            Quantity
                                          </label>

                                          <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={newProduct.quantity}
                                            onChange={(event) =>
                                              setNewProduct((current) => ({
                                                ...current,
                                                quantity: event.target.value,
                                              }))
                                            }
                                            required
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                          />
                                        </div>

                                        <div>
                                          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                            Unit Price (R$)
                                          </label>

                                          <input
                                            type="text"
                                            inputMode="decimal"
                                            value={newProduct.unit_price}
                                            onChange={(event) =>
                                              setNewProduct((current) => ({
                                                ...current,
                                                unit_price: event.target.value,
                                              }))
                                            }
                                            placeholder="Automatic price"
                                            required
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex justify-end">
                                        <button
                                          type="submit"
                                          disabled={itemLoading}
                                          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                          {itemLoading ? (
                                            <Loader2
                                              size={15}
                                              className="animate-spin"
                                            />
                                          ) : (
                                            <Plus size={15} />
                                          )}
                                          Add Product
                                        </button>
                                      </div>
                                    </form>
                                  )}

                                  <div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center">
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Order Total
                                      </p>

                                      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                        {formatAmount(Number(orderDetails.total_amount))}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                      <DollarSign
                                        size={16}
                                        className="text-emerald-500"
                                      />
                                      Automatically recalculated
                                    </div>
                                  </div>

                                  {!canModifyOrder(order) && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                      This order is {order.status}. Product modifications are disabled.
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelOrderModal && orderToCancel && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (statusLoadingId === null) {
              setShowCancelOrderModal(false);
              setOrderToCancel(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/10">
                <AlertCircle
                  size={27}
                  className="text-rose-600 dark:text-rose-400"
                />
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cancel Order?
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Are you sure you want to cancel order{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  #{orderToCancel.id}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={statusLoadingId !== null}
                onClick={() => {
                  setShowCancelOrderModal(false);
                  setOrderToCancel(null);
                }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Keep Order
              </button>

              <button
                type="button"
                disabled={statusLoadingId !== null}
                onClick={confirmCancelOrder}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {statusLoadingId !== null ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <X size={16} />
                )}

                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!itemLoading) {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/10">
                <Trash2
                  size={26}
                  className="text-rose-600 dark:text-rose-400"
                />
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirmar exclusão?
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Tem certeza de que deseja excluir{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {itemToDelete.product_name}
                </span>
                ? Essa ação não poderá ser desfeita.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={itemLoading}
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={itemLoading}
                onClick={confirmDeleteItem}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {itemLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}