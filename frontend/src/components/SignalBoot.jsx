import { useEffect, useState } from "react";
import ArchiveHome from "./ArchiveHome";

function SignalBoot() {
  const [status, setStatus] = useState("NO SIGNAL");
  const [glitch, setGlitch] = useState(false);
  const [connected, setConnected] = useState(false);
  const [access, setAccess] = useState(false);
  const [archiveReady, setArchiveReady] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [authStatus, setAuthStatus] = useState("AUTHENTICATING");
  const [dots, setDots] = useState("");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStatus("SIGNAL DETECTED");
    }, 600);

    const timer2 = setTimeout(() => {
      setGlitch(true);
      setStatus("CHANNEL 01 CONNECTING");
    }, 1200);

    const timer3 = setTimeout(() => {
      setGlitch(false);
      setConnected(true);
      setStatus("CHANNEL 01 CONNECTED");
    }, 2000);

    /*
    const timer4 = setTimeout(() => {
      setAccess(true);
    }, 2300);*/

    const timer4 = setTimeout(() => {
      const lastAccess = localStorage.getItem("sap_bytes_last_access");
      const now = Date.now();
      const cooldown = 10 * 60 * 1000;

      //if (!lastAccess || now - Number(lastAccess) >= cooldown) {
      //cd 10 monit

      if (true) {
        //nocd
        setAccess(true);
        localStorage.setItem("sap_bytes_last_access", now);
      } else {
        setArchiveReady(true);
      }
    }, 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Fake password dots
  useEffect(() => {
    if (!access) return;

    let count = 0;

    const interval = setInterval(() => {
      count++;

      if (count <= 8) {
        setDots("•".repeat(count));
      }

      if (count === 10) {
        setAuthStatus("AUTHENTICATION TIMEOUT");
      }

      if (count === 13) {
        setAuthStatus("GUEST ACCESS GRANTED");
      }

      if (count === 16) {
        setAccess(false);
        setArchiveReady(true);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [access]);

  //archive home
  useEffect(() => {
    if (!archiveReady) return;

    const timer = setTimeout(() => {
      setShowArchive(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [archiveReady]);

  if (showArchive) {
    return <ArchiveHome />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050914] text-white">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="h-full w-full bg-[linear-gradient(rgba(50,130,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(50,130,255,0.08)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-[scan_4s_linear_infinite] bg-blue-400/50 shadow-[0_0_12px_rgba(96,165,250,0.8)]" />

      {/* Interference */}
      {glitch && (
        <>
          <div className="pointer-events-none absolute inset-0 z-20 animate-[interference_0.12s_steps(2)_infinite] bg-blue-400/[0.03]" />

          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-px bg-blue-300/70 shadow-[0_0_15px_rgba(96,165,250,0.9)]" />

          <div className="pointer-events-none absolute inset-x-0 top-[48%] z-30 h-px bg-white/20" />

          <div className="pointer-events-none absolute inset-x-0 top-[53%] z-30 h-px bg-blue-400/30" />
        </>
      )}

      {/* Main */}
      <div
        className={`relative flex min-h-screen items-center justify-center ${
          glitch ? "animate-[glitch_0.12s_steps(2)_infinite]" : ""
        }`}
      >
        {!connected ? (
          <div className="text-center">
            <p
              key={status}
              className="mb-5 text-xs tracking-[0.5em] text-blue-400 animate-[fadeIn_0.5s_ease-out]"
            >
              {status}
            </p>

            <h1 className="text-5xl font-bold tracking-[0.2em] md:text-7xl">
              SAP_BYTES
            </h1>

            <p className="mt-5 text-xs tracking-[0.35em] text-slate-500">
              SOFTWARE ARCHIVE PROJECT
            </p>
          </div>
        ) : (
          /* Connected */
          <div className="w-full max-w-5xl px-6 animate-[fadeIn_0.8s_ease-out]">
            <div className="relative border border-blue-400/20 bg-[#07101f]/70 backdrop-blur-sm">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-blue-400/20 px-5 py-3 text-[10px] tracking-[0.3em]">
                <span className="text-blue-300">CHANNEL 01</span>

                <span className="flex items-center gap-2 text-blue-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                  ON AIR
                </span>
              </div>

              {/* Broadcast */}
              <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden">
                {/* Decorative grid */}
                <div className="pointer-events-none absolute inset-0 opacity-20">
                  <div className="h-full w-full bg-[linear-gradient(rgba(50,130,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(50,130,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>

                <div className="relative text-center">
                  <p className="mb-6 text-[10px] tracking-[0.5em] text-slate-500">
                    SOFTWARE ARCHIVE PROJECT
                  </p>

                  <h1 className="text-5xl font-bold tracking-[0.2em] md:text-7xl">
                    SAP_BYTES
                  </h1>

                  <p className="mt-6 text-xs tracking-[0.4em] text-blue-300">
                    BROADCAST CHANNEL 01
                  </p>
                </div>
              </div>

              {/* Bottom information */}
              <div className="grid grid-cols-3 border-t border-blue-400/20 text-[9px] tracking-[0.25em]">
                <div className="border-r border-blue-400/20 px-5 py-4">
                  <p className="text-slate-600">SIGNAL</p>
                  <p className="mt-1 text-blue-300">STABLE</p>
                </div>

                <div className="border-r border-blue-400/20 px-5 py-4">
                  <p className="text-slate-600">NODE</p>
                  <p className="mt-1 text-blue-300">NODE_01</p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-slate-600">STATUS</p>
                  <p className="mt-1 text-blue-300">ONLINE</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ARCHIVE ACCESS */}
      {access && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#02050c]/60 backdrop-blur-[2px]">
          <div className="w-[90%] max-w-md animate-[accessIn_0.35s_ease-out]">
            <div className="relative border border-blue-400/40 bg-[#07101f]/95 shadow-[0_0_40px_rgba(37,99,235,0.15)]">
              {/* Corner markers */}
              <div className="absolute -left-px -top-px h-4 w-4 border-l border-t border-blue-300" />
              <div className="absolute -right-px -top-px h-4 w-4 border-r border-t border-blue-300" />
              <div className="absolute -bottom-px -left-px h-4 w-4 border-b border-l border-blue-300" />
              <div className="absolute -bottom-px -right-px h-4 w-4 border-b border-r border-blue-300" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-blue-400/20 px-5 py-3">
                <span className="text-[10px] tracking-[0.35em] text-blue-300">
                  ARCHIVE ACCESS
                </span>

                <span className="text-[9px] tracking-[0.2em] text-slate-600">
                  AUTH_01
                </span>
              </div>

              {/* Content */}
              <div className="px-6 py-8">
                {/* Operator Profile */}
                <div className="mb-7 flex items-center gap-5">
                  {/* Portrait placeholder */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-blue-400/30 bg-[#050914]">
                    {/* Scan grid */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="h-full w-full bg-[linear-gradient(rgba(96,165,250,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.15)_1px,transparent_1px)] bg-[size:10px_10px]" />
                    </div>

                    {/* Portrait placeholder */}
                    <div className="relative flex h-full items-center justify-center">
                      <span className="text-[9px] tracking-[0.2em] text-blue-400/60">
                        IMG_01
                      </span>
                    </div>

                    {/* Scanline */}
                    <div className="absolute inset-x-0 top-0 h-px animate-[scan_2s_linear_infinite] bg-blue-400/60" />

                    {/* Corner markers */}
                    <div className="absolute left-0 top-0 h-3 w-3 border-l border-t border-blue-300" />
                    <div className="absolute right-0 top-0 h-3 w-3 border-r border-t border-blue-300" />
                    <div className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-blue-300" />
                    <div className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-blue-300" />
                  </div>

                  {/* Operator information */}
                  <div>
                    <p className="text-[8px] tracking-[0.35em] text-slate-500">
                      ARCHIVE OPERATOR
                    </p>

                    <h2 className="mt-2 text-lg font-semibold tracking-[0.18em] text-white">
                      MR. BYTES
                    </h2>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />

                      <span className="text-[8px] tracking-[0.25em] text-blue-300">
                        NODE_01 // ONLINE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="mb-6 h-px bg-blue-400/10" />

                {/* Access Request */}
                <p className="mb-5 text-[9px] tracking-[0.3em] text-slate-500">
                  ACCESS REQUEST
                </p>

                {/* User */}
                <div className="mb-4">
                  <div className="mb-2 flex justify-between text-[9px] tracking-[0.2em]">
                    <span className="text-slate-500">USER</span>

                    <span className="text-blue-300">GUEST</span>
                  </div>

                  <div className="flex h-9 items-center border border-blue-400/20 bg-black/20 px-3">
                    <span className="text-xs tracking-[0.2em] text-slate-300">
                      GUEST
                    </span>
                  </div>
                </div>

                {/* Access Level */}
                <div className="mb-4">
                  <div className="mb-2 flex justify-between text-[9px] tracking-[0.2em]">
                    <span className="text-slate-500">CLEARANCE</span>

                    <span className="text-blue-300">TEMPORARY</span>
                  </div>

                  <div className="flex h-9 items-center border border-blue-400/20 bg-black/20 px-3">
                    <span className="text-xs tracking-[0.2em] text-slate-300">
                      GUEST ACCESS
                    </span>
                  </div>
                </div>

                {/* Authentication */}
                <div className="mb-7">
                  <div className="mb-2 flex justify-between text-[9px] tracking-[0.2em]">
                    <span className="text-slate-500">PASSWORD</span>

                    <span className="text-blue-400">
                      {authStatus === "AUTHENTICATING" ? "•••" : "---"}
                    </span>
                  </div>

                  <div className="flex h-9 items-center border border-blue-400/20 bg-black/20 px-3">
                    <span className="text-sm tracking-[0.45em] text-blue-300">
                      {dots}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="border-t border-blue-400/10 pt-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        authStatus === "GUEST ACCESS GRANTED"
                          ? "animate-pulse bg-blue-300"
                          : "animate-pulse bg-blue-500"
                      }`}
                    />

                    <span
                      key={authStatus}
                      className="text-[9px] tracking-[0.25em] text-blue-300 animate-[fadeIn_0.25s_ease-out]"
                    >
                      {authStatus}
                    </span>
                  </div>

                  {/* Operator message */}
                  {authStatus === "GUEST ACCESS GRANTED" && (
                    <p className="mt-4 text-[8px] leading-relaxed tracking-[0.2em] text-slate-500 animate-[fadeIn_0.4s_ease-out]">
                      MR. BYTES HAS GRANTED
                      <br />
                      TEMPORARY ARCHIVE ACCESS.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-blue-400/20 px-5 py-3 text-[8px] tracking-[0.25em] text-slate-600">
                ARCHIVE NODE // GUEST PROTOCOL
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Transition */}
      {archiveReady && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#050914] animate-[archiveTransition_1.2s_ease-out]">
          {/* Grid */}
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[linear-gradient(rgba(50,130,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(50,130,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          {/* Scanline */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-blue-400/60 shadow-[0_0_20px_rgba(96,165,250,0.8)]" />

          <div className="relative text-center">
            <p className="mb-4 text-[9px] tracking-[0.5em] text-slate-500">
              MR. BYTES // ARCHIVE OPERATOR
            </p>

            <h2 className="text-2xl font-semibold tracking-[0.3em] text-blue-300 md:text-4xl">
              SIGNAL TRANSFER
            </h2>

            <p className="mt-5 text-[9px] tracking-[0.35em] text-slate-600">
              CHANNEL 01 // ARCHIVE FEED
            </p>

            <div className="mx-auto mt-7 flex items-center justify-center gap-1">
              <span className="h-1 w-8 animate-pulse bg-blue-500/40" />
              <span className="h-1 w-5 animate-pulse bg-blue-400/60 [animation-delay:100ms]" />
              <span className="h-1 w-10 animate-pulse bg-blue-300 [animation-delay:200ms]" />
              <span className="h-1 w-4 animate-pulse bg-blue-400/60 [animation-delay:300ms]" />
              <span className="h-1 w-7 animate-pulse bg-blue-500/40 [animation-delay:400ms]" />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-5 left-6 right-6 flex justify-between text-[10px] tracking-[0.25em] text-slate-600">
        <span>NODE_01</span>

        <span>SAP_BYTES // 2026</span>

        <span>00:00:04:17</span>
      </div>
    </main>
  );
}

export default SignalBoot;
