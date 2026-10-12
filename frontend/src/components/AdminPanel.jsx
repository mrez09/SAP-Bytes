import { useEffect, useState } from "react";

function AdminPanel() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/admin-projects", {
          credentials: "same-origin",
          cache: "no-store",
        });

        const result = await response.json();

        if (response.status === 401) {
          setRedirecting(true);
          window.location.replace("/admin");
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load projects");
        }

        setProjects(result.data);
      } catch (err) {
        setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/admin-logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      window.location.replace("/admin");
    }
  }

  async function handleDeleteProject(project) {
    const confirmed = window.confirm(
      `Delete project "${project.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin-projects?id=${encodeURIComponent(project.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );

      if (response.status === 401) {
        window.location.replace("/admin");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete project");
      }

      setProjects((current) =>
        current.filter((item) => item.id !== project.id),
      );
    } catch (err) {
      window.alert(err.message || "Failed to delete project");
    }
  }

  if (loading || redirecting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080D18] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

          <p className="text-sm font-medium text-cyan-300">
            Verifying admin session...
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Checking authorization before loading archive data.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080D18] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs tracking-[0.22em] text-cyan-400">
              SAP_BYTES / CONTROL SYSTEM
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Project Management
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage projects in your archive database.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.assign("/admin/projects/new")}
            className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-cyan-500"
          >
            + Add Project
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-red-400/50 hover:text-red-300"
          >
            Logout
          </button>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#0D1524] p-5">
            <p className="text-sm text-slate-400">Total Projects</p>
            <p className="mt-2 text-3xl font-bold text-cyan-300">
              {projects.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0D1524] p-5">
            <p className="text-sm text-slate-400">Active Projects</p>
            <p className="mt-2 text-3xl font-bold">
              {projects.filter((project) => project.status === "Active").length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0D1524] p-5">
            <p className="text-sm text-slate-400">Archive Status</p>
            <p className="mt-2 text-lg font-semibold text-emerald-300">
              Connected
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0D1524]">
          <div className="flex items-center justify-between border-b border-slate-800 p-5">
            <h2 className="font-semibold">Project Registry</h2>
            <span className="text-xs text-slate-500">
              {projects.length} records
            </span>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-slate-400">
              Loading project records...
            </p>
          ) : error ? (
            <p role="alert" className="p-6 text-sm text-red-300">
              {error}
            </p>
          ) : projects.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No projects found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Project</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{project.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {project.channel}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {project.category}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300">
                          {project.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {project.type}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              window.location.assign(
                                `/admin/projects/edit/${encodeURIComponent(project.id)}`,
                              )
                            }
                            className="rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/10"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project)}
                            className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 text-xs text-slate-600">SAP_BYTES · ADMIN CONSOLE</p>
      </div>
    </main>
  );
}

export default AdminPanel;
