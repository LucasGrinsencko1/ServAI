import { useEffect, useState } from "react";
import { Search, Users, Mail, RefreshCw } from "lucide-react";
import { getCustomers, type Customer } from "../services/api";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomers();
      setCustomers(data);
    } catch {
      setError("Unable to load customers. Check if the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const term = search.toLowerCase();

    return (
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Customers
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage and view your registered customers.
          </p>
        </div>

        <button
          onClick={loadCustomers}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Customers
            </p>
            <Users className="text-blue-500" size={20} />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
            {customers.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Filtered Results
            </p>
            <Search className="text-purple-500" size={20} />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
            {filteredCustomers.length}
          </p>
        </div>
      </div>

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
              placeholder="Search customers by name or email..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500">
            Loading customers...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-rose-500 dark:text-rose-400">
            {error}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Customer ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>

                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {customer.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Mail
                          size={15}
                          className="text-slate-400 dark:text-slate-500"
                        />
                        {customer.email}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      #{customer.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}