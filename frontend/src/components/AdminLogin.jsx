import { useState } from "react";

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Login failed");
      }

      setError("");
      window.location.replace("/admin/panel");
    } catch (err) {
      setError(err.message || "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080D18] px-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,145,178,0.13),transparent_55%)]" />

      <section className="relative w-full max-w-md">
        <header className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-7 w-7"
            >
              <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10l2 2h6.5A1.5 1.5 0 0 1 20 7.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
              <path d="M8 11h8M8 14h5" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-[0.18em]">SAP_BYTES</h1>
            <p className="mt-1 text-[10px] tracking-[0.22em] text-cyan-400">
              ARCHIVE CONTROL SYSTEM
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-700/80 bg-[#0D1524]/95 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6"
              >
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <path d="M12 14v3" />
              </svg>
            </div>

            <p className="mb-2 text-xs font-medium tracking-[0.2em] text-cyan-400">
              RESTRICTED ACCESS
            </p>

            <h2 className="text-2xl font-semibold tracking-tight">
              Admin Login
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Authenticate to access the archive management panel.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Admin Password
              </label>

              <div className="flex items-center rounded-lg border border-slate-700 bg-[#080D18] transition focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-slate-600"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="px-4 py-3.5 text-xs text-slate-400 transition hover:text-cyan-300"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3.5 text-sm font-semibold tracking-wide transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "ACCESS ARCHIVE"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-between border-t border-slate-800 pt-5 text-[10px] tracking-wider text-slate-500">
            <span>SAP_BYTES CONSOLE</span>
            <span>AUTHORIZED PERSONNEL ONLY</span>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          Secure access · Archive management system
        </p>
      </section>
    </main>
  );
}

export default AdminLogin;
