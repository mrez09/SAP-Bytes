import { useEffect, useRef, useState } from "react";

function YouTubeArchivePlayer({ videoId, projectName }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const playerWrapperRef = useRef(null);
  const intervalRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const getSavedProgress = (videoId) => {
    const saved = localStorage.getItem(`sap-bytes-progress-${videoId}`);

    return saved ? Number(saved) : 0;
  };

  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;

    const createPlayer = () => {
      if (cancelled || !containerRef.current || !window.YT?.Player) {
        return;
      }

      playerRef.current?.destroy();

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          rel: 0,
          playsinline: 1,
          disablekb: 1,
          origin: window.location.origin,
        },

        events: {
          onReady: (event) => {
            playerRef.current = event.target;

            const savedProgress = getSavedProgress(videoId);

            if (savedProgress > 0) {
              event.target.seekTo(savedProgress, true);
            }

            setReady(true);
            setDuration(event.target.getDuration());
          },

          onStateChange: (event) => {
            if (cancelled) return;

            if (event.data === window.YT.PlayerState.PLAYING) {
              setPlaying(true);
            }

            if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              setPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const checkApi = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(checkApi);
          createPlayer();
        }
      }, 100);

      return () => {
        cancelled = true;
        clearInterval(checkApi);
      };
    }

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);

      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    if (!ready) return;

    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;

      const current = playerRef.current.getCurrentTime();
      const total = playerRef.current.getDuration();

      setCurrentTime(current);
      setDuration(total);

      if (current > 0) {
        localStorage.setItem(`sap-bytes-progress-${videoId}`, String(current));
      }
    }, 500);

    return () => {
      clearInterval(intervalRef.current);

      if (playerRef.current) {
        const current = playerRef.current.getCurrentTime();

        if (current > 0) {
          localStorage.setItem(
            `sap-bytes-progress-${videoId}`,
            String(current),
          );
        }
      }
    };
  }, [ready, videoId]);

  const handleSeek = (event) => {
    if (!playerRef.current || !ready || !duration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newTime = percentage * duration;

    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (event) => {
    const newVolume = Number(event.target.value);

    if (!playerRef.current || !ready) return;

    playerRef.current.setVolume(newVolume);
    setVolume(newVolume);
  };

  const toggleMute = () => {
    if (!playerRef.current || !ready) return;

    if (muted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  };

  const toggleFullscreen = async () => {
    if (!playerWrapperRef.current) return;

    if (!document.fullscreenElement) {
      await playerWrapperRef.current.requestFullscreen({
        navigationUI: "hide",
      });
    } else {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!ready) return;

      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLButtonElement
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();

        const newTime = Math.max(0, playerRef.current.getCurrentTime() - 5);

        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();

        const newTime = Math.min(
          duration,
          playerRef.current.getCurrentTime() + 5,
        );

        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      }

      if (event.key.toLowerCase() === "m") {
        toggleMute();
      }

      if (
        event.key.toLowerCase() === "f" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        event.stopPropagation();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ready, duration, playing, muted, volume]);

  const handleRestart = () => {
    if (!playerRef.current || !ready) return;

    playerRef.current.seekTo(0, true);
    playerRef.current.playVideo();
    setCurrentTime(0);
    setPlaying(true);
  };

  const togglePlay = () => {
    if (!playerRef.current || !ready) return;

    if (playing) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const formatTime = (time) => {
    const totalSeconds = Math.floor(time || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  /** Control Visible No bug */
  useEffect(() => {
    let hideTimer;

    const showControls = () => {
      setControlsVisible(true);

      clearTimeout(hideTimer);

      if (playing) {
        hideTimer = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
    };

    window.addEventListener("mousemove", showControls);
    window.addEventListener("keydown", showControls);

    return () => {
      clearTimeout(hideTimer);
      window.removeEventListener("mousemove", showControls);
      window.removeEventListener("keydown", showControls);
    };
  }, [playing]);

  return (
    <div
      ref={playerWrapperRef}
      className="absolute inset-0 flex flex-col bg-[var(--sap-bg)]"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={`pointer-events-none absolute left-4 top-4 z-10 transition-all duration-300 ${
            controlsVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-1 opacity-60"
          }`}
        >
          <div className="flex items-center gap-2 border border-[var(--sap-border)]/60 bg-[var(--sap-bg)]/70 px-3 py-2 backdrop-blur-sm">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                playing
                  ? "animate-pulse bg-[var(--sap-blue-bright)] shadow-[0_0_8px_rgba(114,183,255,0.8)]"
                  : "bg-[var(--sap-muted)]"
              }`}
            />

            <span className="text-[8px] tracking-[0.25em] text-[var(--sap-muted)]">
              ARCHIVE PLAYBACK
            </span>
          </div>
        </div>
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--sap-bg)]">
            <div className="text-center">
              <div className="mx-auto h-px w-32 overflow-hidden bg-[var(--sap-border)]">
                <div className="h-full w-1/3 animate-pulse bg-[var(--sap-blue-bright)]" />
              </div>

              <p className="mt-5 text-[8px] tracking-[0.4em] text-[var(--sap-muted)]">
                CONNECTING ARCHIVE SOURCE
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 border border-[var(--sap-border)]/40" />
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-20 border-t border-[var(--sap-border)]/60 bg-[var(--sap-panel)]/95 px-4 py-3 backdrop-blur-sm transition-all duration-300 ${
          controlsVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  playing
                    ? "animate-pulse bg-[var(--sap-blue-bright)] shadow-[0_0_8px_rgba(114,183,255,0.8)]"
                    : "bg-[var(--sap-muted)]"
                }`}
              />

              <p className="truncate text-[8px] tracking-[0.3em] text-[var(--sap-muted)]">
                {playing
                  ? "ARCHIVE PLAYBACK // ACTIVE"
                  : "ARCHIVE PLAYBACK // PAUSED"}
              </p>
            </div>

            <p className="mt-1 truncate text-[9px] tracking-[0.2em] text-[var(--sap-blue-bright)]">
              {projectName} // YOUTUBE SOURCE
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleRestart}
              disabled={!ready}
              className="border border-[var(--sap-border)] px-3 py-2 text-[8px] tracking-[0.2em] text-[var(--sap-muted)] transition duration-200 hover:border-[var(--sap-blue-bright)] hover:bg-[var(--sap-blue)]/10 hover:text-[var(--sap-blue-bright)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              RESTART
            </button>

            <button
              type="button"
              onClick={togglePlay}
              disabled={!ready}
              className="border border-[var(--sap-border)] px-4 py-2 text-[8px] tracking-[0.25em] text-[var(--sap-blue-bright)] transition duration-200 hover:border-[var(--sap-blue-bright)] hover:bg-[var(--sap-blue)]/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {playing ? "PAUSE" : "PLAY"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              disabled={!ready}
              className="border border-[var(--sap-border)] px-3 py-2 text-[8px] tracking-[0.2em] text-[var(--sap-muted)] transition duration-200 hover:border-[var(--sap-blue-bright)] hover:bg-[var(--sap-blue)]/10 hover:text-[var(--sap-blue-bright)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {muted ? "UNMUTE" : "MUTE"}
            </button>
            <span className="text-[8px] tracking-[0.15em] text-[var(--sap-muted)]">
              VOL
            </span>

            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!ready}
              className="h-1 w-20 cursor-pointer accent-[var(--sap-blue-bright)] disabled:cursor-not-allowed disabled:opacity-40"
            />

            <span className="w-7 text-right font-mono text-[8px] text-[var(--sap-muted)]">
              {volume}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            disabled={!ready}
            className="border border-[var(--sap-border)] px-3 py-2 text-[8px] tracking-[0.2em] text-[var(--sap-muted)] transition duration-200 hover:border-[var(--sap-blue-bright)] hover:bg-[var(--sap-blue)]/10 hover:text-[var(--sap-blue-bright)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            FULLSCREEN
          </button>
        </div>

        <div className="group relative h-3 cursor-pointer" onClick={handleSeek}>
          {/* Track */}
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--sap-border)]/70" />

          {/* Progress */}
          <div
            className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-[var(--sap-blue-bright)] shadow-[0_0_8px_rgba(114,183,255,0.45)] transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />

          {/* Hover area */}
          <div className="absolute inset-0" />

          {/* Position marker */}
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-[var(--sap-blue-bright)] bg-[var(--sap-panel)] shadow-[0_0_10px_rgba(114,183,255,0.7)] opacity-0 transition-all duration-200 group-hover:h-3 group-hover:w-3 group-hover:opacity-100"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        <div className="flex items-center gap-2 font-mono text-[8px] tracking-[0.15em]">
          <span className="text-[var(--sap-blue-bright)]">
            {formatTime(currentTime)}
          </span>

          <span className="text-[var(--sap-muted)]">/</span>

          <span className="text-[var(--sap-muted)]">
            {formatTime(duration)}
          </span>
        </div>

        <span className="font-mono text-[8px] tracking-[0.15em] text-[var(--sap-muted)]">
          ARCHIVE TIME
        </span>
      </div>
    </div>
  );
}

export default YouTubeArchivePlayer;
