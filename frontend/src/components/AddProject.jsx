import { useEffect, useState } from "react";

const initialForm = {
  name: "",
  videoUrl: "",
  channel: "",
  category: "",
  type: "",
  status: "Active",
  subtitle: "",
  overview: "",
  features: "",
  tech: "",
};

function AddProject() {
  const [project, setProject] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const response = await fetch("/api/admin-projects", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.replace("/admin");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to verify admin session");
        }
      } catch {
        if (!cancelled) {
          setSessionError(
            "Unable to verify your session. Please refresh the page.",
          );
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setProject((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin-projects", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...project,
          features: project.features
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          tech: project.tech
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        window.location.replace("/admin");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create project");
      }

      window.location.replace("/admin/panel");
    } catch (err) {
      setError(err.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { name: "name", label: "Project Name" },
    { name: "channel", label: "Channel / Slug" },
    { name: "category", label: "Category" },
    { name: "type", label: "Project Type" },
    { name: "status", label: "Status" },
    { name: "subtitle", label: "Subtitle" },
  ];

  const textareas = [
    { name: "overview", label: "Overview", required: true },
    { name: "features", label: "Features (comma-separated)" },
    { name: "tech", label: "Tech Stack (comma-separated)" },
  ];

  if (checkingSession || sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080D18] px-5 text-white">
        <div className="max-w-md text-center">
          {checkingSession && (
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          )}

          <p className="text-sm font-medium text-cyan-300">
            {checkingSession
              ? "Verifying admin session..."
              : "Session verification failed"}
          </p>

          {sessionError && (
            <>
              <p className="mt-3 text-sm text-slate-400">{sessionError}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold hover:bg-cyan-500"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080D18] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <p className="text-xs tracking-[0.22em] text-cyan-400">
            SAP_BYTES / PROJECT REGISTRY
          </p>

          <h1 className="mt-3 text-3xl font-bold">Add New Project</h1>

          <p className="mt-2 text-sm text-slate-400">
            Register a new project in the archive database.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-800 bg-[#0D1524] p-5 sm:p-8"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className="block text-sm text-slate-300">
                {field.label}

                <input
                  name={field.name}
                  value={project[field.name]}
                  onChange={handleChange}
                  required
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-[#080D18] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
                />
              </label>
            ))}
            <label className="block text-sm text-slate-300 sm:col-span-2">
              YouTube Video URL
              <input
                name="videoUrl"
                type="url"
                value={project.videoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-2 w-full rounded-lg border border-slate-700 bg-[#080D18] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
              />
              <span className="mt-2 block text-xs text-slate-500">
                Optional. Add the main YouTube video for this project.
              </span>
            </label>

            {textareas.map((field) => (
              <label
                key={field.name}
                className="block text-sm text-slate-300 sm:col-span-2"
              >
                {field.label}

                <textarea
                  name={field.name}
                  value={project[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  rows={field.name === "overview" ? 4 : 2}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-[#080D18] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
                />
              </label>
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {saving ? "Saving Project..." : "Save Project"}
            </button>

            <button
              type="button"
              onClick={() => window.location.assign("/admin/panel")}
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AddProject;
