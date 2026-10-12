import { useEffect, useState } from "react";

function EditProject() {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pathParts = window.location.pathname.split("/");
  const projectId = decodeURIComponent(pathParts[pathParts.length - 1]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProject() {
      try {
        const response = await fetch("/api/admin-projects", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.replace("/admin");
          return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load projects");
        }

        const found = result.data.find((item) => item.id === projectId);

        if (!found) {
          throw new Error("Project not found");
        }

        if (!cancelled) {
          setProject({
            ...found,
            features: (found.features ?? []).join(", "),
            tech: (found.tech ?? []).join(", "),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load project");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProject();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setProject((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!project) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin-projects?id=${encodeURIComponent(projectId)}`,
        {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: project.name,
            channel: project.channel,
            category: project.category,
            type: project.type,
            status: project.status,
            subtitle: project.subtitle,
            overview: project.overview,
            features: project.features
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            tech: project.tech
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          }),
        },
      );

      if (response.status === 401) {
        window.location.replace("/admin");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update project");
      }

      window.location.replace("/admin/panel");
    } catch (err) {
      setError(err.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080D18] px-5 text-white">
        <div className="text-center">
          {loading && (
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          )}

          <p className="text-sm text-cyan-300">
            {loading ? "Loading project..." : error || "Project unavailable"}
          </p>

          {!loading && (
            <button
              type="button"
              onClick={() => window.location.assign("/admin/panel")}
              className="mt-5 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </main>
    );
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
    { name: "overview", label: "Overview", rows: 4, required: true },
    { name: "features", label: "Features (comma-separated)", rows: 2 },
    { name: "tech", label: "Tech Stack (comma-separated)", rows: 2 },
  ];

  return (
    <main className="min-h-screen bg-[#080D18] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <p className="text-xs tracking-[0.22em] text-cyan-400">
            SAP_BYTES / PROJECT REGISTRY
          </p>

          <h1 className="mt-3 text-3xl font-bold">Edit Project</h1>

          <p className="mt-2 text-sm text-slate-400">
            Update the selected project's information.
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
                  value={project[field.name] ?? ""}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-[#080D18] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
                />
              </label>
            ))}

            {textareas.map((field) => (
              <label
                key={field.name}
                className="block text-sm text-slate-300 sm:col-span-2"
              >
                {field.label}

                <textarea
                  name={field.name}
                  value={project[field.name] ?? ""}
                  onChange={handleChange}
                  required={field.required}
                  rows={field.rows}
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
              {saving ? "Saving Changes..." : "Save Changes"}
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

export default EditProject;
