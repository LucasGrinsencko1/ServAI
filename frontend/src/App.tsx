import { useCallback, useEffect, useState } from "react";

import {
  Activity,
  Bot,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Users,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Sun,
  Moon,
} from "lucide-react";

import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Assistant from "./pages/Assistant";
import Conversations from "./pages/Conversations";
import AssistantSettings from "./pages/AssistantSettings";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface DashboardMetrics {
  total_customers: number;
  total_orders: number;
  total_conversations: number;
  orders_by_status: Record<string, number>;
}

const navigation = [
  {
    section: "WORKSPACE",
    items: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "AI Assistant", icon: Bot },
      { label: "Conversations", icon: MessageSquare },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      { label: "Orders", icon: ShoppingBag },
      { label: "Customers", icon: Users },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { label: "System Information", icon: Settings },
      { label: "Assistant Settings", icon: Bot },
    ],
  },
];

function App() {
  const [activePage, setActivePage] = useState(
    () => localStorage.getItem("active_page") || "Overview"
  );

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("servai_theme") === "dark"
  );

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("active_page", activePage);
  }, [activePage]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("servai_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((current) => !current);
  };

  const fetchMetrics = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch(
        `${API_URL}/dashboard/metrics/`
      );

      if (!response.ok) {
        throw new Error("Failed to load dashboard metrics.");
      }

      const data: DashboardMetrics = await response.json();

      setMetrics(data);
      setError("");
    } catch {
      setError("Unable to connect to the backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const pendingOrders = metrics?.orders_by_status?.pending ?? 0;
  const totalOrders = metrics?.total_orders ?? 0;

  const backendConnected = Boolean(metrics) && !error;

  const metricCards = [
    {
      title: "Total interactions",
      value: metrics?.total_conversations ?? 0,
      icon: MessageSquare,
      iconColor:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
      description: "Registered conversations",
      accent: "border-l-indigo-500",
    },
    {
      title: "Total orders",
      value: metrics?.total_orders ?? 0,
      icon: ShoppingBag,
      iconColor:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      description: "Orders in database",
      accent: "border-l-blue-500",
    },
    {
      title: "Total customers",
      value: metrics?.total_customers ?? 0,
      icon: Users,
      iconColor:
        "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
      description: "Registered customers",
      accent: "border-l-violet-500",
    },
    {
      title: "Pending orders",
      value: pendingOrders,
      icon: Package,
      iconColor:
        "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      description: "Awaiting processing",
      accent: "border-l-amber-500",
    },
  ];

  const orderStatuses = [
    {
      key: "pending",
      label: "Pending",
      color: "bg-amber-500",
      textColor: "text-amber-700 dark:text-amber-400",
      dotColor: "bg-amber-500",
    },
    {
      key: "confirmed",
      label: "Confirmed",
      color: "bg-blue-500",
      textColor: "text-blue-700 dark:text-blue-400",
      dotColor: "bg-blue-500",
    },
    {
      key: "preparing",
      label: "Preparing",
      color: "bg-violet-500",
      textColor: "text-violet-700 dark:text-violet-400",
      dotColor: "bg-violet-500",
    },
    {
      key: "out_for_delivery",
      label: "Out for delivery",
      color: "bg-indigo-500",
      textColor: "text-indigo-700 dark:text-indigo-400",
      dotColor: "bg-indigo-500",
    },
    {
      key: "delivered",
      label: "Delivered",
      color: "bg-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      color: "bg-rose-500",
      textColor: "text-rose-700 dark:text-rose-400",
      dotColor: "bg-rose-500",
    },
  ].map((status) => ({
    ...status,
    value: metrics?.orders_by_status?.[status.key] ?? 0,
  }));

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? "dark bg-slate-950 text-slate-100"
          : "bg-[#f8fafc] text-slate-900"
      }`}
    >
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] flex-col border-r border-slate-200 bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 lg:flex">

        {/* Official ServAI Logo */}
        <div className="flex h-[140px] shrink-0 items-center justify-center border-b border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-900">
          <img
            src={
              isDarkMode
                ? "/servai-logo.png"
                : "/servai-logo-light.png"
            }
            alt="ServAI - AI Customer Support"
            className="h-[135px] w-full object-contain object-center"
          />
        </div>

        {/* Workspace Selector */}
        <div className="px-4 pt-6">
          <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                AC
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Acme Corporation
                </p>

                <p className="text-[10px] text-slate-400">
                  Free workspace
                </p>
              </div>
            </div>

            <ChevronDown size={15} className="text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-4 pt-8">
          {navigation.map((group) => (
            <div key={group.section}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.12em] text-slate-400">
                {group.section}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.label;

                  return (
                    <button
                      key={item.label}
                      onClick={() => setActivePage(item.label)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      }`}
                    >
                      <Icon size={17} />

                      {item.label}

                      {item.label === "Conversations" && metrics && (
                        <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {metrics.total_conversations}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="space-y-1 border-t border-slate-100 p-4 dark:border-slate-800">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
            <CircleHelp size={17} />
            Help center
          </button>

          <div className="mt-3 flex items-center gap-3 border-t border-slate-100 px-2 pt-4 dark:border-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
              JD
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                John Doe
              </p>

              <p className="truncate text-[10px] text-slate-400">
                Administrator
              </p>
            </div>

            <MoreHorizontal size={18} className="text-slate-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen lg:pl-[250px]">

        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-md transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/90 sm:px-8">
          <div>
            <p className="text-xs text-slate-400">
              ServAI / {activePage}
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {activePage === "Overview" ? "Dashboard" : activePage}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 md:flex">
              <Search size={15} className="text-slate-400" />

              <span className="text-xs text-slate-400">
                Search anything...
              </span>

              <kbd className="ml-4 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-600 dark:bg-slate-700">
                /
              </kbd>
            </div>

            <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title="System status"
            >
              <Activity size={19} />

              <span
                className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 ${
                  isDarkMode ? "border-slate-900" : "border-white"
                } ${backendConnected ? "bg-emerald-500" : "bg-rose-500"}`}
              />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              JD
            </div>
          </div>
        </header>

        {/* Customers */}
        {activePage === "Customers" ? (
          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <Customers />
          </div>

        /* Orders */
        ) : activePage === "Orders" ? (
          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <Orders />
          </div>

        /* AI Assistant */
        ) : activePage === "AI Assistant" ? (
          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <Assistant />
          </div>

        /* Conversations */
        ) : activePage === "Conversations" ? (
          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <Conversations />
          </div>

        /* Assistant Settings */
        ) : activePage === "Assistant Settings" ? (
          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <AssistantSettings />
          </div>

        /* System Information */
        ) : activePage === "System Information" ? (
          <div className="mx-auto max-w-[1500px] space-y-7 p-5 sm:p-8">

            {/* Page Header */}
            <section>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                  SYSTEM
                </span>

                <span className="text-xs text-slate-400">
                  ServAI Infrastructure
                </span>
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                System information
              </h3>

              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Technical details, infrastructure and connection status.
              </p>
            </section>

            {/* Connection Status */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    {backendConnected ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={20} className="text-rose-500" />
                    )}

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Backend connection
                    </h4>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Current connection status of the application backend.
                  </p>
                </div>

                <span
                  className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${
                    loading
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      : backendConnected
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                  }`}
                >
                  {loading
                    ? "Checking connection"
                    : backendConnected
                      ? "Backend connected"
                      : "Connection unavailable"}
                </span>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  {error} Make sure the backend is running and try refreshing.
                </div>
              )}
            </section>

            {/* Infrastructure */}
            <section>
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Infrastructure
                </h4>

                <p className="mt-1 text-xs text-slate-400">
                  Technologies and services used by ServAI.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

                {/* Backend API */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                    <Activity size={20} />
                  </div>

                  <p className="mt-4 text-xs font-medium text-slate-400">
                    Backend API
                  </p>

                  <h5
                    className={`mt-2 text-lg font-bold ${
                      backendConnected
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {loading
                      ? "Checking..."
                      : backendConnected
                        ? "FastAPI connected"
                        : "Unavailable"}
                  </h5>

                  <p className="mt-2 break-all text-xs text-slate-400">
                    {API_URL}
                  </p>
                </div>

                {/* Database */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <Package size={20} />
                  </div>

                  <p className="mt-4 text-xs font-medium text-slate-400">
                    Database
                  </p>

                  <h5 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                    SQLite
                  </h5>

                  <p className="mt-2 text-xs text-slate-400">
                    Application database
                  </p>
                </div>

                {/* AI Model */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                    <Bot size={20} />
                  </div>

                  <p className="mt-4 text-xs font-medium text-slate-400">
                    AI Provider
                  </p>

                  <h5 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                    Google Gemini
                  </h5>

                  <p className="mt-2 text-xs text-slate-400">
                    gemini-3.5-flash-lite
                  </p>
                </div>

                {/* Frontend */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                    <Activity size={20} />
                  </div>

                  <p className="mt-4 text-xs font-medium text-slate-400">
                    Frontend
                  </p>

                  <h5 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                    React + TypeScript
                  </h5>

                  <p className="mt-2 text-xs text-slate-400">
                    Vite application
                  </p>
                </div>

                {/* API Framework */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <Zap size={20} />
                  </div>

                  <p className="mt-4 text-xs font-medium text-slate-400">
                    API Framework
                  </p>

                  <h5 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                    FastAPI
                  </h5>

                  <p className="mt-2 text-xs text-slate-400">
                    Python backend
                  </p>
                </div>

                {/* Order Statuses */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                    <Clock size={20} />
                  </div>

                  <p className="mt-4 text-xs font-medium text-slate-400">
                    Order statuses
                  </p>

                  <h5 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                    {orderStatuses.length}
                  </h5>

                  <p className="mt-2 text-xs text-slate-400">
                    Supported order status types
                  </p>
                </div>
              </div>
            </section>

            {/* Supported Order Statuses */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Supported order statuses
                </h4>

                <p className="mt-1 text-xs text-slate-400">
                  All order statuses currently supported by the application.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {orderStatuses.map((status) => (
                  <div
                    key={status.key}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${status.dotColor}`}
                      />

                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {status.label}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {metrics?.orders_by_status?.[status.key] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Refresh */}
            <section className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Refresh system information
                </h4>

                <p className="mt-1 text-xs text-slate-400">
                  Check the backend connection and update system data.
                </p>
              </div>

              <button
                onClick={fetchMetrics}
                disabled={refreshing}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-none"
              >
                <RefreshCw
                  size={14}
                  className={`mr-1.5 inline ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />

                {refreshing ? "Refreshing..." : "Refresh data"}
              </button>
            </section>

            {/* Footer */}
            <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 pb-2 pt-5 text-[10px] text-slate-400 dark:border-slate-800 sm:flex-row">
              <p>© 2026 ServAI. All rights reserved.</p>

              <p>Powered by intelligent automation</p>
            </footer>
          </div>

        /* Dashboard / Overview */
        ) : (
          <div className="mx-auto max-w-[1500px] space-y-7 p-5 sm:p-8">

            {/* Welcome Section */}
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                    Overview
                  </span>

                  <span className="text-xs text-slate-400">
                    ServAI Workspace
                  </span>
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Welcome back, John <span>👋</span>
                </h3>

                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                  Here's what's happening with your support operations today.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={fetchMetrics}
                  disabled={refreshing}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-none"
                >
                  <RefreshCw
                    size={14}
                    className={`mr-1.5 inline ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />

                  {refreshing ? "Refreshing..." : "Refresh data"}
                </button>
              </div>
            </section>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle size={19} className="mt-0.5 shrink-0" />

                <div>
                  <p className="font-semibold">
                    Connection problem
                  </p>

                  <p className="mt-1">
                    {error} Make sure the backend is running and try refreshing.
                  </p>
                </div>
              </div>
            )}

            {/* Metric Cards */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Key metrics
                  </h4>

                  <p className="mt-1 text-xs text-slate-400">
                    Overview of your support operations
                  </p>
                </div>

                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Live database data
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((metric) => {
                  const Icon = metric.icon;

                  return (
                    <div
                      key={metric.title}
                      className={`group rounded-xl border border-slate-200 border-l-4 ${metric.accent} bg-white p-5 shadow-sm shadow-slate-100/70 transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {metric.title}
                          </p>

                          <h4 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {loading
                              ? "..."
                              : metric.value.toLocaleString()}
                          </h4>
                        </div>

                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.iconColor} transition group-hover:scale-110`}
                        >
                          <Icon size={20} />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <TrendingUp size={13} className="text-slate-400" />

                        <p className="text-[11px] text-slate-400">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Order Overview and AI Assistant */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">

              {/* Order Status Overview */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none xl:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Order overview
                    </h4>

                    <p className="mt-1 text-xs text-slate-400">
                      Distribution of orders by current status
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                    <ShoppingBag size={18} />
                  </div>
                </div>

                <div className="mt-8 space-y-5">
                  {orderStatuses.map((status) => {
                    const percentage =
                      totalOrders > 0
                        ? Math.min(
                            (status.value / totalOrders) * 100,
                            100
                          )
                        : 0;

                    return (
                      <div key={status.key}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${status.dotColor}`}
                            />

                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {status.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400">
                              {loading
                                ? "..."
                                : `${percentage.toFixed(0)}%`}
                            </span>

                            <span
                              className={`min-w-[25px] text-right text-xs font-bold ${status.textColor}`}
                            >
                              {loading ? "..." : status.value}
                            </span>
                          </div>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${status.color}`}
                            style={{
                              width: loading ? "0%" : `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-400">
                      Total registered orders
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {loading ? "..." : totalOrders}
                    </p>
                  </div>

                  <button
                    onClick={() => setActivePage("Orders")}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                  >
                    View orders

                    <ShoppingBag size={14} />
                  </button>
                </div>
              </div>

              {/* AI Assistant Overview */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      AI assistant
                    </h4>

                    <p className="mt-1 text-xs text-slate-400">
                      Support system overview
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      backendConnected
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                    }`}
                  >
                    {loading
                      ? "Checking"
                      : backendConnected
                        ? "Connected"
                        : "Unavailable"}
                  </span>
                </div>

                <div className="mt-7 flex flex-col items-center">
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-indigo-500/15 dark:to-violet-500/15">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-indigo-600 shadow-md shadow-indigo-100 dark:bg-slate-800 dark:text-indigo-400 dark:shadow-none">
                      <Bot size={53} />
                    </div>

                    <span
                      className={`absolute bottom-5 right-5 h-4 w-4 rounded-full border-[3px] ${
                        isDarkMode ? "border-slate-900" : "border-white"
                      } ${
                        backendConnected
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    />
                  </div>

                  <p className="mt-5 text-lg font-bold text-slate-900 dark:text-slate-100">
                    ServAI
                  </p>

                  <p className="mt-1 text-center text-xs text-slate-400">
                    AI-powered customer support
                  </p>

                  <div className="mt-7 grid w-full grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-indigo-500" />

                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {loading
                            ? "..."
                            : metrics?.total_conversations ?? 0}
                        </p>
                      </div>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Interactions
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-violet-500" />

                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {loading
                            ? "..."
                            : metrics?.total_customers ?? 0}
                        </p>
                      </div>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Customers
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActivePage("AI Assistant")}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-50 px-4 py-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-400 dark:hover:bg-indigo-500/25"
                  >
                    Open AI Assistant

                    <Bot size={15} />
                  </button>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 pb-2 pt-5 text-[10px] text-slate-400 dark:border-slate-800 sm:flex-row">
              <p>© 2026 ServAI. All rights reserved.</p>

              <p>Powered by intelligent automation</p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;