import { useEffect, useMemo, useState } from "react";

import {
  MessageSquare,
  User,
  Clock,
  Search,
  Bot,
  ArrowLeft,
  Mail,
  CalendarDays,
  Hash,
  Users,
  Activity,
  ChevronRight,
  Trash2,
  Loader2,
} from "lucide-react";

import {
  getAllConversations,
  deleteConversation,
  type AllConversation,
} from "../services/api";

export default function Conversations() {
  const [conversations, setConversations] = useState<AllConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [selectedConversation, setSelectedConversation] =
    useState<AllConversation | null>(null);

  const [conversationToDelete, setConversationToDelete] =
    useState<AllConversation | null>(null);

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await getAllConversations();
        setConversations(data);
      } catch {
        setError("Could not load conversations.");
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, []);

  const uniqueCustomers = useMemo(
    () =>
      new Set(
        conversations.map((conversation) => conversation.customer_id)
      ).size,
    [conversations]
  );

  const recentConversations = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return conversations.filter(
      (conversation) =>
        new Date(conversation.created_at) >= sevenDaysAgo
    ).length;
  }, [conversations]);

  const filteredConversations = conversations.filter((conversation) => {
    const searchTerm = search.toLowerCase();

    return (
      conversation.customer_name.toLowerCase().includes(searchTerm) ||
      conversation.customer_email.toLowerCase().includes(searchTerm) ||
      conversation.message.toLowerCase().includes(searchTerm) ||
      conversation.response.toLowerCase().includes(searchTerm)
    );
  });

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function formatDateOnly(date: string) {
    return new Date(date).toLocaleDateString();
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function requestDeleteConversation(conversation: AllConversation) {
    setActionError("");
    setConversationToDelete(conversation);
  }

  async function confirmDeleteConversation() {
    if (!conversationToDelete) return;

    const conversation = conversationToDelete;

    setDeletingId(conversation.id);
    setActionError("");

    try {
      await deleteConversation(conversation.id);

      setConversations((current) =>
        current.filter((item) => item.id !== conversation.id)
      );

      if (selectedConversation?.id === conversation.id) {
        setSelectedConversation(null);
      }

      setConversationToDelete(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to delete conversation."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function renderDeleteModal() {
    if (!conversationToDelete) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-conversation-title"
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <Trash2 size={25} />
          </div>

          <h2
            id="delete-conversation-title"
            className="text-center text-lg font-semibold text-gray-900 dark:text-white"
          >
            Delete conversation?
          </h2>

          <p className="mt-2 text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Are you sure you want to delete the conversation with{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {conversationToDelete.customer_name}
            </span>
            ? This action cannot be undone.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setConversationToDelete(null)}
              disabled={deletingId !== null}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmDeleteConversation}
              disabled={deletingId === conversationToDelete.id}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingId === conversationToDelete.id ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Yes, delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedConversation(null)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to conversations
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Conversation details
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Complete details of this customer interaction.
            </p>
          </div>

          <button
            type="button"
            onClick={() => requestDeleteConversation(selectedConversation)}
            disabled={deletingId === selectedConversation.id}
            className="flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
          >
            <Trash2 size={16} />
            Delete conversation
          </button>
        </div>

        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {actionError}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <User size={22} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedConversation.customer_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customer information
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-gray-200 pt-5 dark:border-gray-800 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Email address</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                  {selectedConversation.customer_email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash size={18} className="mt-0.5 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Interaction ID</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                  #{selectedConversation.id}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays size={18} className="mt-0.5 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                  {formatDateOnly(selectedConversation.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={18} className="mt-0.5 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                  {formatTime(selectedConversation.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Message history
            </h3>
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              2 messages
            </span>
          </div>

          <div className="space-y-5">
            <div className="flex justify-end">
              <div className="max-w-[85%] sm:max-w-[75%]">
                <div className="mb-2 flex items-center justify-end gap-2">
                  <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">
                    Customer
                  </span>
                  <User size={14} className="text-blue-500 dark:text-blue-400" />
                </div>

                <div className="rounded-2xl rounded-tr-sm border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                    {selectedConversation.message}
                  </p>
                </div>

                <p className="mt-2 text-right text-[11px] text-gray-400 dark:text-gray-500">
                  {formatDate(selectedConversation.created_at)}
                </p>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[75%]">
                <div className="mb-2 flex items-center gap-2">
                  <Bot size={14} className="text-green-500 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-500 dark:text-green-400">
                    AI Assistant
                  </span>
                </div>

                <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-gray-100 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                    {selectedConversation.response}
                  </p>
                </div>

                <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                  {formatDate(selectedConversation.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {renderDeleteModal()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Conversations
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View and manage all customer support interactions.
        </p>
      </div>

      {actionError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError("")}
            className="shrink-0 text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <MessageSquare size={20} />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">All time</span>
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Total conversations
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {conversations.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 dark:text-purple-400">
              <Users size={20} />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Unique</span>
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Customers served
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {uniqueCustomers}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500 dark:text-green-400">
              <Activity size={20} />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Last 7 days</span>
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Recent interactions
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {recentConversations}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none sm:w-96">
          <Search size={18} className="text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {filteredConversations.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {conversations.length}
          </span>{" "}
          conversations
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:shadow-none">
          Loading conversations...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
          <MessageSquare
            size={32}
            className="mx-auto text-gray-400 dark:text-gray-600"
          />
          <p className="mt-3 font-medium text-gray-900 dark:text-white">
            No conversations found
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try another search or start a new conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none dark:hover:border-indigo-500/40"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400">
                    <User size={18} />
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {conversation.customer_name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {conversation.customer_email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <Clock size={14} />
                  {formatDate(conversation.created_at)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-blue-500/10 bg-blue-500/5 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400">
                    Customer
                  </p>
                  <p className="line-clamp-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                    {conversation.message}
                  </p>
                </div>

                <div className="rounded-lg border border-green-500/10 bg-green-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Bot size={14} className="text-green-500 dark:text-green-400" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-500 dark:text-green-400">
                      AI Assistant
                    </p>
                  </div>
                  <p className="line-clamp-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
                    {conversation.response}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => requestDeleteConversation(conversation)}
                  disabled={deletingId === conversation.id}
                  aria-label={`Delete conversation ${conversation.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 size={15} />
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionError("");
                    setSelectedConversation(conversation);
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-indigo-500 transition hover:bg-indigo-500/10 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  View details
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {renderDeleteModal()}
    </div>
  );
}