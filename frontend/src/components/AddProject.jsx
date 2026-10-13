import { useEffect, useState } from "react";
import { upload } from "@imagekit/javascript";

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
  images: [
    {
      imageUrl: "",
      caption: "",
      altText: "",
    },
  ],
};

function getYouTubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);
    let videoId = "";

    if (parsedUrl.hostname === "youtu.be") {
      videoId = parsedUrl.pathname.slice(1).split("/")[0];
    } else if (
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtube-nocookie.com",
        "www.youtube-nocookie.com",
      ].includes(parsedUrl.hostname)
    ) {
      if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v") || "";
      } else {
        const match = parsedUrl.pathname.match(
          /^\/(?:embed|shorts|live)\/([^/?]+)/,
        );
        videoId = match?.[1] || "";
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : "";
  } catch {
    return "";
  }
}

function AddProject() {
  const [project, setProject] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const previewVideoId = getYouTubeVideoId(project.videoUrl);

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

  function handleImageChange(index, field, value) {
    setProject((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [field]: value } : image,
      ),
    }));
  }

  function addImage() {
    setProject((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          imageUrl: "",
          caption: "",
          altText: "",
        },
      ],
    }));
  }

  function removeImage(index) {
    setProject((current) => {
      const images = current.images.filter(
        (_, imageIndex) => imageIndex !== index,
      );

      return {
        ...current,
        images,
      };
    });
  }

  async function handleFileUpload(fileList) {
    const files = Array.from(fileList || []);

    if (files.length === 0) return;

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));

    if (invalidFile) {
      setError("Please select image files only.");
      return;
    }

    const oversizedFile = files.find((file) => file.size > 10 * 1024 * 1024);

    if (oversizedFile) {
      setError("Each image must be 10 MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");

    let completedFiles = 0;

    try {
      for (const file of files) {
        const authResponse = await fetch("/api/imagekit-auth", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const authResult = await authResponse.json();

        if (!authResponse.ok || !authResult.success) {
          if (authResponse.status === 401) {
            window.location.replace("/admin");
            return;
          }

          throw new Error(
            authResult.message || "Failed to authenticate image upload.",
          );
        }

        const result = await upload({
          file,
          fileName: file.name,
          publicKey: authResult.publicKey,
          token: authResult.token,
          expire: authResult.expire,
          signature: authResult.signature,
          folder: "/sap-bytes/projects",
          useUniqueFileName: true,
          onProgress: (event) => {
            const fileProgress = event.total
              ? (event.loaded / event.total) * 100
              : 0;

            setUploadProgress(
              Math.round(
                ((completedFiles + fileProgress / 100) / files.length) * 100,
              ),
            );
          },
        });

        if (!result.url) {
          throw new Error("ImageKit did not return an image URL.");
        }

        setProject((current) => {
          const images = [...current.images];
          const emptyIndex = images.findIndex(
            (image) => !image.imageUrl.trim(),
          );

          const newImage = {
            imageUrl: result.url,
            caption: "",
            altText: file.name.replace(/\.[^.]+$/, ""),
          };

          if (emptyIndex !== -1) {
            images[emptyIndex] = newImage;
          } else {
            images.push(newImage);
          }

          return { ...current, images };
        });

        completedFiles += 1;
        setUploadProgress(Math.round((completedFiles / files.length) * 100));
      }
    } catch (err) {
      setError(err.message || "Failed to upload images.");
    } finally {
      setUploading(false);
    }
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
            {previewVideoId && (
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm text-slate-300">Video Preview</p>

                <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#080D18]">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${previewVideoId}`}
                    title="YouTube Video Preview"
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Check the video above before saving your project.
                </p>
              </div>
            )}

            {/**Image */}

            <div className="sm:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Project Image Gallery
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Add screenshots and choose one image as the cover.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addImage}
                  className="shrink-0 rounded-lg border border-cyan-500/40 px-3 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/10"
                >
                  + Add Image
                </button>
              </div>

              <div
                className="mb-4 rounded-xl border-2 border-dashed border-slate-600 bg-[#080D18] p-6 text-center transition hover:border-cyan-500"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFileUpload(event.dataTransfer.files);
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">🖼️</span>

                  <p className="text-sm font-medium text-white">
                    Drag and drop images here
                  </p>

                  <p className="text-xs text-slate-400">
                    Or select multiple images from your computer
                  </p>

                  <label className="mt-2 cursor-pointer rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                    Choose Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploading}
                      className="hidden"
                      onChange={(event) => {
                        handleFileUpload(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>

                  <p className="text-xs text-slate-500">
                    Maximum 10 MB per image.
                  </p>
                </div>
              </div>

              {uploading && (
                <div className="mb-4">
                  <div className="mb-2 flex justify-between text-xs text-slate-300">
                    <span>Uploading images...</span>
                    <span>{uploadProgress}%</span>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-slate-700"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={uploadProgress}
                  >
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {project.images.map((image, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-700 bg-[#080D18] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">
                        Image {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-sm text-red-400 transition hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>

                    <label className="block text-sm text-slate-300">
                      Image URL
                      <input
                        type="url"
                        value={image.imageUrl}
                        onChange={(event) =>
                          handleImageChange(
                            index,
                            "imageUrl",
                            event.target.value,
                          )
                        }
                        placeholder="https://example.com/screenshot.png"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
                      />
                    </label>

                    <label className="mt-3 block text-sm text-slate-300">
                      Caption
                      <input
                        type="text"
                        value={image.caption}
                        onChange={(event) =>
                          handleImageChange(
                            index,
                            "caption",
                            event.target.value,
                          )
                        }
                        placeholder="Example: Dashboard overview"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
                      />
                    </label>

                    <label className="mt-3 block text-sm text-slate-300">
                      Alt Text
                      <input
                        type="text"
                        value={image.altText}
                        onChange={(event) =>
                          handleImageChange(
                            index,
                            "altText",
                            event.target.value,
                          )
                        }
                        placeholder="Describe this screenshot"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
                      />
                    </label>

                    {image.imageUrl.trim() && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs text-slate-400">
                          Image Preview
                        </p>

                        <div className="overflow-hidden rounded-lg border border-slate-700 bg-[#0B1220]">
                          <img
                            src={image.imageUrl}
                            alt={image.altText || `Project image ${index + 1}`}
                            className="max-h-72 w-full object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                            onLoad={(event) => {
                              event.currentTarget.style.display = "block";
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                The cover selector will be added next. Images are previews only
                until we connect them to the save API.
              </p>
            </div>

            {/**end image */}

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
