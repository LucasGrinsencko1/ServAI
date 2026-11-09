import { useEffect, useState } from "react";
import {
  Bot,
  Save,
  RotateCcw,
  CheckCircle2,
  Settings2,
} from "lucide-react";

interface AssistantConfiguration {
  assistantName: string;
  welcomeMessage: string;
  language: string;
  tone: string;
  enabled: boolean;
}

const DEFAULT_SETTINGS: AssistantConfiguration = {
  assistantName: "ServAI",
  welcomeMessage:
    "Hello! I'm ServAI. How can I help you today?",
  language: "Auto-detect",
  tone: "Professional and friendly",
  enabled: true,
};

const generateWelcomeMessage = (assistantName: string) => {
  const name = assistantName.trim() || "Assistant";

  return `Hello! I'm ${name}. How can I help you today?`;
};

export default function AssistantSettings() {
  const [settings, setSettings] =
    useState<AssistantConfiguration>(() => {
      try {
        const saved = localStorage.getItem("assistant_settings");

        if (saved) {
          const parsed = JSON.parse(saved);

          const assistantName =
            parsed.assistantName ?? DEFAULT_SETTINGS.assistantName;

          return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            assistantName,
            welcomeMessage: generateWelcomeMessage(assistantName),
          };
        }

        return DEFAULT_SETTINGS;
      } catch {
        return DEFAULT_SETTINGS;
      }
    });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [settings]);

  const updateSetting = (
    field: keyof AssistantConfiguration,
    value: string | boolean
  ) => {
    setSettings((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (field === "assistantName") {
        updated.welcomeMessage = generateWelcomeMessage(
          value as string
        );
      }

      return updated;
    });
  };

  const saveSettings = () => {
    localStorage.setItem(
      "assistant_settings",
      JSON.stringify(settings)
    );

    setSaved(true);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);

    localStorage.setItem(
      "assistant_settings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-7">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            CONFIGURATION
          </span>

          <span className="text-xs text-slate-400 dark:text-slate-500">
            AI Assistant
          </span>
        </div>

        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Assistant settings
        </h3>

        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Customize your AI assistant's behavior and communication preferences.
        </p>
      </section>

      {/* General settings */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Bot size={20} />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              General settings
            </h4>

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Basic information about your assistant.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assistant name
            </label>

            <input
              type="text"
              value={settings.assistantName}
              onChange={(event) =>
                updateSetting("assistantName", event.target.value)
              }
              placeholder="Enter assistant name"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/10"
            />

            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              The name displayed to customers.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Welcome message
            </label>

            <textarea
              value={settings.welcomeMessage}
              readOnly
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800/70 dark:text-white"
            />

            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              Automatically generated using the assistant name.
            </p>
          </div>
        </div>
      </section>

      {/* Communication preferences */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Settings2 size={20} />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Communication preferences
            </h4>

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Define how your assistant communicates with customers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Default language
            </label>

            <select
              value={settings.language}
              onChange={(event) =>
                updateSetting("language", event.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-500/10"
            >
              <option>Auto-detect</option>
              <option>English</option>
              <option>Português</option>
              <option>Español</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Communication tone
            </label>

            <select
              value={settings.tone}
              onChange={(event) =>
                updateSetting("tone", event.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-500/10"
            >
              <option>Professional and friendly</option>
              <option>Formal</option>
              <option>Casual and friendly</option>
              <option>Direct and objective</option>
            </select>
          </div>
        </div>
      </section>

      {/* Assistant status */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Assistant availability
            </h4>

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Enable or disable the assistant.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              updateSetting("enabled", !settings.enabled)
            }
            className={`relative flex h-7 w-12 items-center rounded-full transition ${
              settings.enabled
                ? "bg-indigo-600"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
            aria-label="Toggle assistant availability"
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                settings.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span
            className={`h-2 w-2 rounded-full ${
              settings.enabled ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />

          <span
            className={`text-xs font-semibold ${
              settings.enabled
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-rose-700 dark:text-rose-400"
            }`}
          >
            {settings.enabled ? "Assistant enabled" : "Assistant disabled"}
          </span>
        </div>
      </section>

      {/* Actions */}
      <section className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:flex-row sm:items-center">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Save your changes
          </h4>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Your preferences will be saved in this browser.
          </p>

          {saved && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} />
              Settings saved successfully.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={resetSettings}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw size={14} />
            Reset defaults
          </button>

          <button
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 dark:shadow-none"
          >
            <Save size={14} />
            Save settings
          </button>
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 pb-2 pt-5 text-[10px] text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row">
        <p>© 2026 ServAI. All rights reserved.</p>
        <p>Powered by intelligent automation</p>
      </footer>
    </div>
  );
}