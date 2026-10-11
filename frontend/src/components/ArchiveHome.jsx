import { useEffect, useRef, useState } from "react";
import YouTubeArchivePlayer from "./YouTubeArchivePlayer";
import bytesImage from "../assets/bytes.png";

function ArchiveHome() {
  const [broadcastTime, setBroadcastTime] = useState(0);
  const [selectedProject, setSelectedProject] = useState("VICA");
  const [switchingProject, setSwitchingProject] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [detailProject, setDetailProject] = useState(null);
  const featuredArchiveRef = useRef(null);
  const [pinnedProjects, setPinnedProjects] = useState(() => {
    const saved = localStorage.getItem("sap-bytes-pinned-projects");

    return saved ? JSON.parse(saved) : [];
  });
  const [viewMode, setViewMode] = useState("grid");

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [commandIndex, setCommandIndex] = useState(0);

  const commandItems = [
    { label: "VICA", action: "VICA" },
    { label: "PEEKPANEL", action: "PEEKPANEL" },
    { label: "KIVA", action: "KIVA" },
    { label: "SWITCH GRID VIEW", action: "GRID" },
    { label: "SWITCH SIGNAL VIEW", action: "SIGNAL" },
  ];

  const filteredCommands = commandItems.filter((command) =>
    command.label.toLowerCase().includes(commandSearch.trim().toLowerCase()),
  );

  useEffect(() => {
    localStorage.setItem(
      "sap-bytes-pinned-projects",
      JSON.stringify(pinnedProjects),
    );
  }, [pinnedProjects]);

  const projects = [
    {
      id: "01",
      name: "VICA",
      type: "LOCAL VOICE STUDIO",
      status: "ONLINE",
      videoId: "N1y9ilJzp7s",
      subtitle: "LOCAL VOICE SYNTHESIS STUDIO",
      overview:
        "VICA is a local voice studio for Indonesian text-to-speech and voice cloning, built to explore AI-powered voice generation on a personal computer.",
      description: "Local Indonesian voice synthesis and cloning studio.",

      features: [
        "Voice cloning",
        "Text-to-speech",
        "Voice library",
        "Audio generation",
        "Playback controls",
      ],

      tech: ["React", "FastAPI", "F5-TTS", "FFmpeg"],
    },
    {
      id: "02",
      name: "PEEKPANEL",
      type: "UTILITY SYSTEM",
      status: "ONLINE",
      videoId: "2ynnUYg5On0",
      subtitle: "INTERACTIVE OVERLAY UTILITY",
      overview:
        "PeekPanel is a utility system for organizing game walkthroughs and live coding overlays, with a Go backend and PostgreSQL database.",
      description:
        "Overlay archive system for live coding and game walkthroughs.",
      features: [
        "Product catalog",
        "Order request",
        "Inventory management",
        "Admin order status",
        "MOQ validation",
      ],
      tech: ["Go", "React", "GORM", "PostgreSQL", "Neon"],
    },
    {
      id: "03",
      name: "KIVA",
      type: "VISUAL EXPERIMENT",
      status: "ON HOLD",
      videoId: "JE8hZ3BznXU",
      subtitle: "LOCAL AI IMAGE EXPERIMENT",
      overview:
        "KIVA is a local AI image generation project built to explore diffusion models, prompt experimentation, and image generation workflows.",
      description: "Local image generation and visual experimentation project.",
      features: [
        "Local image generation",
        "Prompt experimentation",
        "Diffusion model testing",
        "Image workflow exploration",
      ],

      tech: ["Python", "Diffusers", "Stable Diffusion", "Hugging Face"],
    },
  ];

  const activeProject = projects.find(
    (project) => project.name === selectedProject,
  );

  const filteredProjects = projects.filter((project) => {
    const search = projectSearch.toLowerCase().trim();

    if (!search) return true;

    return (
      project.name.toLowerCase().includes(search) ||
      project.type.toLowerCase().includes(search) ||
      project.status.toLowerCase().includes(search)
    );
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aPinned = pinnedProjects.includes(a.name);
    const bPinned = pinnedProjects.includes(b.name);

    return Number(bPinned) - Number(aPinned);
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDetailProject(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBroadcastTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = String(Math.floor(broadcastTime / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((broadcastTime % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(broadcastTime % 60).padStart(2, "0");

  //Palette
  useEffect(() => {
    const handleCommandPaletteKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
        return;
      }

      if (!commandPaletteOpen) return;

      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
        setCommandSearch("");
        setCommandIndex(0);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCommandIndex((index) =>
          Math.min(index + 1, filteredCommands.length - 1),
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCommandIndex((index) => Math.max(index - 1, 0));
        return;
      }

      if (event.key === "Enter" && filteredCommands.length > 0) {
        event.preventDefault();
        const command = filteredCommands[commandIndex];

        if (!command) return;

        if (["VICA", "PEEKPANEL", "KIVA"].includes(command.action)) {
          setSelectedProject(command.action);
          featuredArchiveRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } else {
          setViewMode(command.action.toLowerCase());
        }

        setCommandPaletteOpen(false);
        setCommandSearch("");
        setCommandIndex(0);
      }
    };

    window.addEventListener("keydown", handleCommandPaletteKey);

    return () => {
      window.removeEventListener("keydown", handleCommandPaletteKey);
    };
  }, [commandPaletteOpen, commandSearch, commandIndex, filteredCommands]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--sap-bg)] text-white">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="h-full w-full bg-[linear-gradient(rgba(50,130,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(50,130,255,0.08)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-[scan_4s_linear_infinite] bg-[var(--sap-blue)]/50 shadow-[0_0_12px_rgba(96,165,250,0.8)]" />

      {/* Main interface */}
      <div className="relative min-h-screen">
        {/* Header */}
        <header className="border-b border-[var(--sap-border)]/60 bg-[var(--sap-bg)]/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-6 md:px-10">
            {/* Brand */}
            <div className="flex items-center gap-5">
              <div>
                <p className="text-sm font-bold tracking-[0.25em]">SAP_BYTES</p>

                <p className="mt-1 text-[8px] tracking-[0.3em] text-[var(--sap-muted)]">
                  SOFTWARE ARCHIVE PROJECT
                </p>
              </div>

              <div className="hidden h-7 w-px bg-[var(--sap-blue)]/20 md:block" />

              <span className="hidden text-[9px] tracking-[0.3em] text-[var(--sap-blue-bright)] md:block">
                CHANNEL {activeProject.id}
              </span>
            </div>

            {/* Broadcast status */}
            <div className="flex items-center gap-5">
              <div className="hidden text-right sm:block">
                <p className="text-[8px] tracking-[0.25em] text-[var(--sap-muted)]">
                  ARCHIVE STATUS
                </p>

                <p className="mt-1 text-[9px] tracking-[0.2em] text-[var(--sap-blue-bright)]">
                  ONLINE
                </p>
              </div>

              <div className="flex items-center gap-2 border border-blue-400/20 px-3 py-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--sap-blue)]" />

                <span className="text-[9px] tracking-[0.25em] text-[var(--sap-blue-bright)]">
                  ON AIR
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Broadcast content */}
        <section className="mx-auto max-w-7xl px-6 py-8 md:px-10">
          {/* Top information */}
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[var(--sap-border)]/40 pb-5 md:flex-row md:items-end">
            <div>
              <p className="text-[9px] tracking-[0.4em] text-blue-400">
                ARCHIVE FEED
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-[0.12em] md:text-5xl">
                CHANNEL {activeProject.id}
              </h1>

              <p className="mt-3 max-w-xl text-xs leading-relaxed tracking-[0.12em] text-slate-500">
                A live archive of software, experiments, projects and bytes
                collected from the SAP network.
              </p>
            </div>

            {/* Timecode */}
            <div className="font-mono text-right">
              <p className="text-[8px] tracking-[0.25em] text-[var(--sap-muted)]">
                BROADCAST TIME
              </p>

              <p className="mt-1 text-sm tracking-[0.2em] text-[var(--sap-blue-bright)]">
                00:{hours}:{minutes}:{seconds}
              </p>
            </div>
          </div>

          {/* Main broadcast panel */}
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Feed */}
            <div className="relative flex min-h-[420px] items-center justify-center">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12),transparent_55%)]" />
              </div>

              <div
                ref={featuredArchiveRef}
                className="relative w-full max-w-5xl"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] tracking-[0.4em] text-[var(--sap-muted)]">
                      FEATURED ARCHIVE
                    </p>

                    <p
                      className={`text-[8px] tracking-[0.3em] transition-all duration-300 ${
                        switchingProject
                          ? "translate-x-2 opacity-0"
                          : "translate-x-0 opacity-100"
                      } text-[var(--sap-muted)]`}
                    >
                      ARCHIVE_{activeProject.id} // VIDEO SHOWCASE
                    </p>
                  </div>

                  <div className="border border-blue-400/20 px-3 py-2">
                    <p
                      className={`... transition-all duration-300 ${
                        switchingProject
                          ? "translate-x-2 opacity-0"
                          : "translate-x-0 opacity-100"
                      }`}
                    >
                      SOURCE // YOUTUBE
                    </p>
                  </div>
                </div>

                {/** abc Archive Feed */}

                <div className="mt-3 flex items-center justify-between border-y border-[var(--sap-border)]/60 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--sap-blue-bright)] shadow-[0_0_8px_rgba(114,183,255,0.7)]" />

                    <span className="font-mono text-[7px] tracking-[0.3em] text-[var(--sap-blue-bright)]">
                      ARCHIVE FEED
                    </span>

                    <span className="font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)]">
                      // ACTIVE
                    </span>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)]">
                    <span>CH.{activeProject.id}</span>

                    <span className="hidden sm:inline">SIGNAL: STABLE</span>
                  </div>
                </div>

                {/**End Archive */}

                <div className="relative aspect-video overflow-hidden border border-blue-400/20 bg-[var(--sap-bg)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_60%)]" />

                  <div className="absolute inset-0">
                    {activeProject?.videoId ? (
                      <div className="h-full w-full">
                        <YouTubeArchivePlayer
                          key={activeProject.videoId}
                          videoId={activeProject.videoId}
                          projectName={activeProject.name}
                        />
                        {switchingProject && (
                          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--sap-bg)]/95 backdrop-blur-sm">
                            <div className="text-center">
                              <div className="mx-auto mb-5 h-px w-40 overflow-hidden bg-[var(--sap-border)]">
                                <div
                                  className="h-full w-1/3 bg-[var(--sap-blue-bright)]"
                                  style={{
                                    animation:
                                      "signalSweep 0.9s linear infinite",
                                  }}
                                />
                              </div>

                              <p className="text-[8px] tracking-[0.4em] text-[var(--sap-blue-bright)]">
                                SOURCE SWITCHING
                              </p>

                              <p className="mt-2 font-mono text-[8px] tracking-[0.2em] text-[var(--sap-muted)]">
                                ARCHIVE CHANNEL // RECONNECTING
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[var(--sap-border)] bg-[var(--sap-blue)]/5">
                            <span className="ml-1 text-xl text-[var(--sap-blue-bright)]">
                              ▶
                            </span>
                          </div>

                          <p className="mt-6 text-[8px] tracking-[0.45em] text-[var(--sap-muted)]">
                            VIDEO SOURCE READY
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--sap-blue)]/10" />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--sap-blue)]/10" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 border-t border-blue-400/10 bg-[var(--sap-bg)]/85 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] tracking-[0.25em] text-[var(--sap-muted)]">
                        YOUTUBE SOURCE
                      </span>

                      <span className="font-mono text-[8px] tracking-[0.2em] text-blue-400/70">
                        00:00
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-3 border border-blue-400/20 bg-[var(--sap-bg)] transition-all duration-300 ${
                    switchingProject
                      ? "translate-y-1 opacity-0"
                      : "translate-y-0 opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] tracking-[0.25em] text-[var(--sap-text)]">
                        {activeProject.name}
                      </p>

                      <p className="mt-1 font-mono text-[7px] tracking-[0.25em] text-[var(--sap-blue-bright)]">
                        {activeProject.subtitle}
                      </p>
                    </div>

                    <span className="shrink-0 font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)]">
                      CH.{activeProject.id}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-col justify-between gap-4 border-t border-blue-400/10 pt-4 md:flex-row md:items-end">
                  <div>
                    <p className="text-[8px] tracking-[0.35em] text-[var(--sap-muted)]">
                      CURRENT ARCHIVE
                    </p>

                    <h2 className="mt-2 text-xl font-semibold tracking-[0.15em]">
                      {selectedProject}
                    </h2>

                    <p className="mt-2 text-[8px] tracking-[0.25em] text-[var(--sap-muted)]">
                      {
                        projects.find(
                          (project) => project.name === selectedProject,
                        )?.type
                      }
                      {" // PROJECT_"}
                      {
                        projects.find(
                          (project) => project.name === selectedProject,
                        )?.id
                      }
                    </p>
                  </div>

                  <button className="border border-blue-400/20 px-4 py-3 text-[8px] tracking-[0.3em] text-[var(--sap-blue-bright)] transition duration-300 hover:border-blue-400/50 hover:bg-blue-500/5">
                    PLAY ARCHIVE →
                  </button>
                </div>
              </div>
            </div>

            {/* Operator panel */}
            <aside className="border border-blue-400/20 bg-[var(--sap-panel)]/70">
              <div className="border-b border-blue-400/20 px-5 py-4">
                <p className="text-[8px] tracking-[0.35em] text-[var(--sap-muted)]">
                  ARCHIVE OPERATOR
                </p>

                <p className="mt-2 text-sm tracking-[0.2em] text-[var(--sap-blue-bright)]">
                  MR. BYTES
                </p>
              </div>

              <div className="p-5">
                {/* Portrait image */}
                <div className="relative mx-auto aspect-square max-w-[180px] overflow-hidden border border-blue-400/20 bg-[var(--sap-bg)]">
                  <img
                    src={bytesImage}
                    alt="SAP Bytes"
                    className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
                  />

                  <div className="pointer-events-none absolute inset-0 opacity-30">
                    <div className="h-full w-full bg-[linear-gradient(rgba(96,165,250,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.15)_1px,transparent_1px)] bg-[size:12px_12px]" />
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-[scan_2s_linear_infinite] bg-[var(--sap-blue)]/50" />
                </div>

                {/* Status */}
                <div className="mt-5 space-y-4">
                  <div className="flex justify-between border-b border-blue-400/10 pb-3">
                    <span className="text-[8px] tracking-[0.2em] text-[var(--sap-muted)]">
                      NODE
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--sap-blue-bright)] shadow-[0_0_8px_rgba(114,183,255,0.8)]" />

                      <span className="font-mono text-[8px] tracking-[0.25em] text-[var(--sap-blue-bright)]">
                        NODE_01
                      </span>

                      <span className="h-px w-6 bg-[var(--sap-border)]" />

                      <span className="font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)]">
                        LINKED
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-blue-400/10 pb-3">
                    <span className="text-[8px] tracking-[0.2em] text-[var(--sap-muted)]">
                      STATUS
                    </span>

                    <span className="text-[8px] tracking-[0.2em] text-[var(--sap-blue-bright)]">
                      ONLINE
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[8px] tracking-[0.2em] text-[var(--sap-muted)]">
                      ACCESS
                    </span>

                    <span className="text-[8px] tracking-[0.2em] text-[var(--sap-blue-bright)]">
                      GUEST
                    </span>
                  </div>
                </div>

                {/**Telementary */}
                <div className="mt-5 space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[7px] tracking-[0.25em] text-[var(--sap-muted)]">
                        SIGNAL
                      </span>

                      <span className="font-mono text-[7px] text-[var(--sap-blue-bright)]">
                        98%
                      </span>
                    </div>

                    <div className="h-1 bg-[var(--sap-border)]/40">
                      <div className="h-full w-[98%] bg-[var(--sap-blue-bright)]" />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[7px] tracking-[0.25em] text-[var(--sap-muted)]">
                        ARCHIVE LINK
                      </span>

                      <span className="font-mono text-[7px] text-[var(--sap-blue-bright)]">
                        STABLE
                      </span>
                    </div>

                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <span
                          key={item}
                          className="h-1 flex-1 bg-[var(--sap-blue-bright)]"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/**End Telementary */}
              </div>
            </aside>
          </div>

          <div className="relative mt-5">
            <input
              type="text"
              value={projectSearch}
              onChange={(event) => setProjectSearch(event.target.value)}
              placeholder="SEARCH ARCHIVE..."
              className="w-full border border-[var(--sap-border)]/70 bg-[var(--sap-panel)]/60 px-4 py-3 font-mono text-[8px] tracking-[0.2em] text-[var(--sap-text)] outline-none transition-all duration-300 placeholder:text-[var(--sap-muted)]/60 focus:border-[var(--sap-blue-bright)]/60 focus:bg-[var(--sap-panel-hover)]"
            />

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)]">
              FIND
            </span>
          </div>

          {/* Project feed */}
          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] tracking-[0.35em] text-[var(--sap-blue-bright)]">
                  PROJECT FEED
                </p>

                <p className="mt-1 font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)]">
                  ARCHIVE DIRECTORY
                </p>
              </div>

              <div className="flex border border-[var(--sap-border)]/60">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 font-mono text-[7px] tracking-[0.2em] transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-[var(--sap-blue-bright)]/10 text-[var(--sap-blue-bright)]"
                      : "text-[var(--sap-muted)] hover:text-[var(--sap-text)]"
                  }`}
                >
                  GRID
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("signal")}
                  className={`border-l border-[var(--sap-border)]/60 px-3 py-2 font-mono text-[7px] tracking-[0.2em] transition-all duration-300 ${
                    viewMode === "signal"
                      ? "bg-[var(--sap-blue-bright)]/10 text-[var(--sap-blue-bright)]"
                      : "text-[var(--sap-muted)] hover:text-[var(--sap-text)]"
                  }`}
                >
                  SIGNAL
                </button>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-3">
                {filteredProjects.length === 0 ? (
                  <div className="col-span-full flex min-h-32 items-center justify-center border border-[var(--sap-border)]/50 bg-[var(--sap-panel)]/40">
                    <div className="text-center">
                      <p className="font-mono text-[9px] tracking-[0.35em] text-[var(--sap-blue-bright)]">
                        NO ARCHIVE FOUND
                      </p>

                      <p className="mt-2 font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)]">
                        SEARCH QUERY // NO MATCH
                      </p>
                    </div>
                  </div>
                ) : (
                  sortedProjects.map((project) => (
                    <div
                      key={project.id} //button
                      onClick={() => {
                        if (project.name === selectedProject) return;

                        setSwitchingProject(true);

                        setTimeout(() => {
                          setSelectedProject(project.name);
                          featuredArchiveRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                          setSwitchingProject(false);

                          featuredArchiveRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }, 450);
                      }}
                      className={`group relative w-full overflow-hidden border p-5 text-left transition duration-300 ${
                        selectedProject === project.name
                          ? "border-[var(--sap-blue-bright)]/50 bg-[var(--sap-panel-hover)] shadow-[0_0_20px_rgba(79,142,219,0.08)]"
                          : "border-[var(--sap-border)]/50 bg-[var(--sap-panel)]/60 hover:border-blue-400/40 hover:bg-[var(--sap-panel-hover)]"
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            setPinnedProjects((current) =>
                              current.includes(project.name)
                                ? current.filter(
                                    (name) => name !== project.name,
                                  )
                                : [...current, project.name],
                            );
                          }}
                          className="absolute right-4 top-20 z-10 font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)] transition-all duration-300 hover:text-[var(--sap-blue-bright)]"
                        >
                          {pinnedProjects.includes(project.name)
                            ? "★ PINNED"
                            : "☆ PIN"}
                        </button>

                        <div
                          className={`pointer-events-none absolute right-0 top-0 h-8 w-8 border-r border-t transition-all duration-300 ${
                            selectedProject === project.name
                              ? "border-[var(--sap-blue-bright)] opacity-100"
                              : "border-[var(--sap-border)] opacity-40"
                          }`}
                        />

                        <div
                          className={`pointer-events-none absolute bottom-0 left-0 h-8 w-8 border-b border-l transition-all duration-300 ${
                            selectedProject === project.name
                              ? "border-[var(--sap-blue-bright)] opacity-100"
                              : "border-[var(--sap-border)] opacity-40"
                          }`}
                        />

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[9px] tracking-[0.25em] text-[var(--sap-blue-bright)]">
                            CH. {project.id}
                          </span>

                          <span className="h-px w-8 bg-[var(--sap-border)]" />
                        </div>

                        <span className="font-mono text-[8px] tracking-[0.2em] text-[var(--sap-muted)]">
                          ARCHIVE
                        </span>
                      </div>

                      {/**Pin */}

                      <div className="flex items-start justify-between">
                        <span className="text-[8px] tracking-[0.25em] text-[var(--sap-muted)]">
                          PROJECT_{project.id}
                        </span>

                        <span className="text-[8px] tracking-[0.2em] text-blue-400/70">
                          {project.status}
                        </span>
                      </div>

                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            selectedProject === project.name
                              ? "animate-pulse bg-[var(--sap-blue-bright)] shadow-[0_0_8px_rgba(114,183,255,0.8)]"
                              : "bg-[var(--sap-muted)]/50"
                          }`}
                        />

                        <span
                          className={`text-[7px] tracking-[0.3em] ${
                            selectedProject === project.name
                              ? "text-[var(--sap-blue-bright)]"
                              : "text-[var(--sap-muted)]"
                          }`}
                        >
                          {selectedProject === project.name
                            ? "SELECTED"
                            : "STANDBY"}
                        </span>
                      </div>

                      <p className="mt-2 text-[8px] tracking-[0.25em] text-[var(--sap-muted)]">
                        {project.type}
                      </p>

                      <div className="mt-8 flex items-center justify-between border-t border-blue-400/10 pt-4">
                        <span className="text-[8px] tracking-[0.2em] text-[var(--sap-muted)]">
                          ACCESS FILE
                        </span>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDetailProject(project);
                          }}
                          className="font-mono text-[7px] tracking-[0.2em] text-[var(--sap-blue-bright)] transition-all duration-300 hover:tracking-[0.3em] hover:text-[var(--sap-text)]"
                        >
                          DETAILS →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="border border-[var(--sap-border)]/60 bg-[var(--sap-panel)]/40">
                {sortedProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      if (project.name === selectedProject) return;

                      setSwitchingProject(true);

                      setTimeout(() => {
                        setSelectedProject(project.name);
                        featuredArchiveRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                        setSwitchingProject(false);

                        featuredArchiveRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }, 450);
                    }}
                    className={`group relative flex w-full items-center gap-4 border-b border-[var(--sap-border)]/40 px-4 py-4 text-left transition-all duration-300 last:border-b-0 ${
                      selectedProject === project.name
                        ? "bg-[var(--sap-panel-hover)]"
                        : "hover:bg-[var(--sap-panel-hover)]/50"
                    }`}
                  >
                    {/* CHANNEL */}
                    <div className="w-16 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[8px] tracking-[0.2em] text-[var(--sap-blue-bright)]">
                          CH.{project.id}
                        </span>

                        {pinnedProjects.includes(project.name) && (
                          <span className="font-mono text-[7px] text-[var(--sap-blue-bright)]">
                            ★
                          </span>
                        )}
                      </div>
                    </div>

                    {/* STATUS */}
                    <div className="w-20 shrink-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            selectedProject === project.name
                              ? "animate-pulse bg-[var(--sap-blue-bright)] shadow-[0_0_8px_rgba(114,183,255,0.8)]"
                              : "bg-[var(--sap-muted)]/50"
                          }`}
                        />

                        <span className="font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)]">
                          {selectedProject === project.name
                            ? "LIVE"
                            : "STANDBY"}
                        </span>
                      </div>
                    </div>

                    {/* PROJECT */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[10px] tracking-[0.2em] text-[var(--sap-text)]">
                        {project.name}
                      </p>

                      <p className="mt-1 truncate font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)]">
                        {project.type}
                      </p>
                    </div>

                    {/* ARCHIVE STATUS */}
                    <div className="hidden w-24 shrink-0 text-right sm:block">
                      <span className="font-mono text-[7px] tracking-[0.2em] text-[var(--sap-blue-bright)]/80">
                        {project.status}
                      </span>
                    </div>

                    {/* ACCESS */}
                    <div className="w-16 shrink-0 text-right">
                      <span className="font-mono text-[7px] tracking-[0.2em] text-[var(--sap-muted)] transition-colors group-hover:text-[var(--sap-blue-bright)]">
                        OPEN →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/**Detail */}
            {detailProject && (
              <div className="fixed inset-0 z-50 flex justify-end">
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setDetailProject(null)}
                />

                <div className="sap-scrollbar relative h-full w-full max-w-md overflow-y-auto overscroll-contain border-l border-[var(--sap-border)] bg-[var(--sap-panel)] p-6 shadow-[-20px_0_60px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between border-b border-[var(--sap-border)]/60 pb-4">
                    <div>
                      <p className="font-mono text-[7px] tracking-[0.3em] text-[var(--sap-muted)]">
                        ARCHIVE DETAILS
                      </p>

                      <h2 className="mt-2 font-mono text-lg tracking-[0.2em] text-[var(--sap-text)]">
                        {detailProject.name}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailProject(null)}
                      className="font-mono text-[10px] text-[var(--sap-muted)] transition-colors hover:text-[var(--sap-blue-bright)]"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mt-8">
                    <p className="font-mono text-[8px] tracking-[0.25em] text-[var(--sap-blue-bright)]">
                      {detailProject.type}
                    </p>

                    <div className="mt-6">
                      <p className="font-mono text-[7px] tracking-[0.3em] text-[var(--sap-blue-bright)]">
                        OVERVIEW
                      </p>

                      <p className="mt-3 text-[9px] leading-6 tracking-[0.05em] text-[var(--sap-muted)]">
                        {detailProject.overview}
                      </p>
                    </div>

                    <div className="mt-7 border-t border-[var(--sap-border)]/40 pt-5">
                      <p className="font-mono text-[7px] tracking-[0.3em] text-[var(--sap-blue-bright)]">
                        FEATURES
                      </p>

                      <div className="mt-4 space-y-2">
                        {detailProject.features.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-3"
                          >
                            <span className="h-px w-3 bg-[var(--sap-blue-bright)]/60" />

                            <span className="font-mono text-[8px] tracking-[0.08em] text-[var(--sap-muted)]">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-7 border-t border-[var(--sap-border)]/40 pt-5">
                        <p className="font-mono text-[7px] tracking-[0.3em] text-[var(--sap-blue-bright)]">
                          TECHNOLOGY bro
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {detailProject.tech.map((technology) => (
                            <span
                              key={technology}
                              className="border border-[var(--sap-border)]/60 bg-[var(--sap-bg)]/40 px-3 py-2 font-mono text-[7px] tracking-[0.12em] text-[var(--sap-muted)]"
                            >
                              {technology}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-[var(--sap-border)]/40 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[7px] tracking-[0.25em] text-[var(--sap-muted)]">
                        STATUS
                      </span>

                      <span className="font-mono text-[8px] tracking-[0.2em] text-[var(--sap-blue-bright)]">
                        {detailProject.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-mono text-[7px] tracking-[0.25em] text-[var(--sap-muted)]">
                        CHANNEL
                      </span>

                      <span className="font-mono text-[8px] tracking-[0.2em] text-[var(--sap-text)]">
                        CH.{detailProject.id}
                      </span>
                    </div>
                    <div className="mt-7 border-t border-[var(--sap-border)]/60 pt-5">
                      <p className="font-mono text-[8px] tracking-[0.25em] text-[var(--sap-blue-bright)]">
                        ARCHIVE NOTE
                      </p>

                      <p className="mt-3 font-mono text-[9px] leading-5 tracking-[0.08em] text-[var(--sap-muted)]">
                        Designed as part of the SAP_Bytes software archive.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDetailProject(null);

                        if (detailProject.name !== selectedProject) {
                          setSwitchingProject(true);

                          setTimeout(() => {
                            setSelectedProject(detailProject.name);
                            featuredArchiveRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                            setSwitchingProject(false);

                            featuredArchiveRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }, 450);
                        } else {
                          featuredArchiveRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }}
                      className="mt-8 w-full border border-[var(--sap-blue-bright)]/40 bg-[var(--sap-blue-bright)]/5 px-4 py-3 text-left font-mono text-[8px] tracking-[0.25em] text-[var(--sap-blue-bright)] transition-all duration-300 hover:border-[var(--sap-blue-bright)] hover:bg-[var(--sap-blue-bright)]/10"
                    >
                      OPEN ARCHIVE →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </section>

        {/* Ticker */}
        <div className="fixed bottom-0 left-0 right-0 z-20 overflow-hidden border-t border-blue-400/20 bg-[var(--sap-bg)]/90 backdrop-blur-sm">
          <div className="flex h-9 items-center whitespace-nowrap">
            <div className="shrink-0 border-r border-blue-400/20 px-5 text-[8px] tracking-[0.3em] text-[var(--sap-blue-bright)]">
              SAP_BYTES
            </div>

            <div className="animate-[ticker_25s_linear_infinite] px-5 text-[8px] tracking-[0.25em] text-[var(--sap-muted)]">
              SYSTEM ONLINE　///　ARCHIVE FEED ACTIVE　///　VICA
              ONLINE　///　PEEKPANEL ONLINE　///　KIVA EXPERIMENTAL　///　MR.
              BYTES ONLINE　///　CHANNEL 01 ON AIR　///
            </div>
          </div>
        </div>

        {/**Palete */}
        {commandPaletteOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm">
            <div
              className="w-full max-w-xl overflow-hidden border border-[var(--sap-border)] bg-[var(--sap-panel)] shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--sap-border)]/60 px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.25em] text-[var(--sap-blue-bright)]">
                    SAP_BYTES COMMAND
                  </p>
                  <p className="mt-1 font-mono text-[8px] tracking-[0.15em] text-[var(--sap-muted)]">
                    ARCHIVE OPERATOR // COMMAND INTERFACE
                  </p>
                </div>

                <button
                  onClick={() => setCommandPaletteOpen(false)}
                  className="border border-[var(--sap-border)] px-2 py-1 font-mono text-[9px] text-[var(--sap-muted)] transition hover:border-[var(--sap-blue-bright)] hover:text-[var(--sap-text)]"
                >
                  ESC
                </button>
              </div>

              <div className="p-5">
                <input
                  type="text"
                  value={commandSearch}
                  onChange={(event) => setCommandSearch(event.target.value)}
                  placeholder="Search commands or projects..."
                  autoComplete="off"
                  className="mt-3 w-full border border-[var(--sap-border)] bg-[var(--sap-bg)] px-3 py-3 font-mono text-[10px] tracking-[0.1em] text-[var(--sap-text)] outline-none placeholder:text-[var(--sap-muted)] focus:border-[var(--sap-blue-bright)]"
                />

                <div className="mt-4 flex items-center justify-between">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-[var(--sap-muted)]">
                    AVAILABLE COMMANDS
                  </p>

                  <p className="font-mono text-[9px] tracking-[0.15em] text-[var(--sap-blue-bright)]">
                    {String(filteredCommands.length).padStart(2, "0")} FOUND
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {filteredCommands.map((command) => (
                    <button
                      key={command.action}
                      onClick={() => {
                        if (
                          ["VICA", "PEEKPANEL", "KIVA"].includes(command.action)
                        ) {
                          setSelectedProject(command.action);
                        } else {
                          setViewMode(command.action.toLowerCase());
                        }

                        setCommandPaletteOpen(false);
                        setCommandSearch("");
                      }}
                      className={`block w-full border px-3 py-3 text-left font-mono text-[10px] tracking-[0.12em] transition ${
                        filteredCommands.findIndex(
                          (item) => item.action === command.action,
                        ) === commandIndex
                          ? "border-[var(--sap-blue-bright)] bg-[var(--sap-panel-hover)] text-[var(--sap-blue-bright)]"
                          : "border-[var(--sap-border)]/50 text-[var(--sap-text)] hover:border-[var(--sap-blue-bright)] hover:bg-[var(--sap-panel-hover)]"
                      }`}
                    >
                      <span className="mr-3 text-[var(--sap-blue-bright)]">
                        &gt;
                      </span>
                      {command.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--sap-border)]/60 px-4 py-3">
                <p className="font-mono text-[8px] tracking-[0.15em] text-[var(--sap-muted)]">
                  SELECT COMMAND // SYSTEM STANDBY
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ArchiveHome;
