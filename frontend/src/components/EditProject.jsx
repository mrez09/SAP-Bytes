import { useEffect, useState } from "react";
import { upload } from "@imagekit/javascript";

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

function EditProject() {
  const [project, setProject] = useState(null);

  const previewVideoId = getYouTubeVideoId(project?.videoUrl ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pathParts = window.location.pathname.split("/");
  const projectId = decodeURIComponent(pathParts[pathParts.length - 1]);

  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [newImageAltText, setNewImageAltText] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
        console.log("Project ID:", projectId);
        console.log("Found project:", found);

        if (!found) {
          throw new Error("Project not found");
        }

        if (!cancelled) {
          //old
          //const mainVideo =
          //found.videos?.find((video) => video.isFeatured) ??
          //found.videos?.[0];
          const mainVideo = found.videos?.find((video) => video.isFeatured);

          setProject({
            ...found,
            features: (found.features ?? []).join(", "),
            tech: (found.tech ?? []).join(", "),
            videoUrl: mainVideo?.videoId
              ? `https://www.youtube.com/watch?v=${mainVideo.videoId}`
              : "",
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
            videoUrl: project.videoUrl,
            images: project.images ?? [],
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

  //Select Cover
  function handleSetCover(imageId) {
    setProject((prev) => ({
      ...prev,
      images: (prev.images ?? []).map((image) => ({
        ...image,
        isCover: image.id === imageId,
      })),
    }));
  }

  function handleRemoveImage(imageId) {
    setProject((prev) => ({
      ...prev,
      images: (prev.images ?? []).filter((image) => image.id !== imageId),
    }));
  }

  async function handleFileUpload(fileList) {
    const files = Array.from(fileList || []);

    if (files.length === 0) return;

    const currentImageCount = (project.images ?? []).length;

    if (currentImageCount + files.length > 20) {
      setError("Maximum 20 images per project.");
      return;
    }

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

        setProject((prev) => {
          const images = prev.images ?? [];

          return {
            ...prev,
            images: [
              ...images,
              {
                id: `new-${Date.now()}-${completedFiles}`,
                imageUrl: result.url,
                caption: "",
                altText: file.name.replace(/\.[^.]+$/, ""),
                sortOrder: images.length,
                isCover: images.length === 0,
              },
            ],
          };
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

  function handleAddImage() {
    const imageUrl = newImageUrl.trim();

    if (!imageUrl) {
      setError("Please enter an image URL.");
      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      setError("Please enter a valid image URL.");
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      setError("Image URL must use HTTP or HTTPS.");
      return;
    }

    const currentImages = project.images ?? [];

    if (currentImages.length >= 20) {
      setError("Maximum 20 images per project.");
      return;
    }

    setProject((prev) => ({
      ...prev,
      images: [
        ...(prev.images ?? []),
        {
          id: `new-${Date.now()}`,
          imageUrl: parsedUrl.href,
          caption: newImageCaption.trim(),
          altText: newImageAltText.trim(),
          sortOrder: currentImages.length,
          isCover: currentImages.length === 0,
        },
      ],
    }));

    setNewImageUrl("");
    setNewImageCaption("");
    setNewImageAltText("");
    setError("");
  }

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

            <label className="block text-sm text-slate-300 sm:col-span-2">
              YouTube Video URL
              <input
                name="videoUrl"
                type="url"
                value={project?.videoUrl ?? ""}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-2 w-full rounded-lg border border-slate-700 bg-[#080D18] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
              />
              <span className="mt-2 block text-xs text-slate-500">
                Optional. Update the main YouTube video for this project.
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
                  Check the video above before saving your changes.
                </p>
              </div>
            )}

            {/* Project Image Gallery */}
            <div className="sm:col-span-2 mt-4 border-t border-slate-800 pt-6">
              {/* ImageKit Upload Area */}
              <div className="mb-6 rounded-xl border border-dashed border-cyan-500/40 bg-[#080D18] p-5">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">
                    Upload Images to ImageKit
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    Drag and drop images here, or select files from your
                    computer.
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Maximum 10 MB per image · Up to 20 images per project
                  </p>

                  <label className="mt-4 inline-flex cursor-pointer items-center rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500">
                    {uploading ? "Uploading..." : "Choose Images"}

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
                </div>

                <div
                  className="mt-5 rounded-lg border border-slate-800 p-5 text-center text-xs text-slate-400 transition hover:border-cyan-500/50"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!uploading) {
                      handleFileUpload(event.dataTransfer.files);
                    }
                  }}
                >
                  Drop image files here
                </div>

                {uploading && (
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-xs text-slate-400">
                      <span>Uploading images...</span>
                      <span>{uploadProgress}%</span>
                    </div>

                    <div
                      className="h-2 overflow-hidden rounded-full bg-slate-800"
                      role="progressbar"
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Add New Project Image */}
              <div className="mb-6 rounded-xl border border-slate-700 bg-[#080D18] p-4">
                <h3 className="text-sm font-semibold text-white">
                  Add New Image
                </h3>

                <div className="mt-4 space-y-4">
                  <label className="block text-sm text-slate-300">
                    Image URL
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(event) => {
                        setNewImageUrl(event.target.value);
                        setError("");
                      }}
                      placeholder="https://ik.imagekit.io/..."
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0D1524] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="block text-sm text-slate-300">
                    Caption
                    <input
                      type="text"
                      value={newImageCaption}
                      onChange={(event) =>
                        setNewImageCaption(event.target.value)
                      }
                      placeholder="e.g. Dashboard screenshot"
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0D1524] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="block text-sm text-slate-300">
                    Alt Text
                    <input
                      type="text"
                      value={newImageAltText}
                      onChange={(event) =>
                        setNewImageAltText(event.target.value)
                      }
                      placeholder="Describe the image"
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0D1524] px-3 py-3 text-white outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  {newImageUrl.trim() && (
                    <div>
                      <p className="mb-2 text-xs text-slate-400">
                        Image Preview
                      </p>

                      <img
                        src={newImageUrl.trim()}
                        alt={newImageAltText || "New project image preview"}
                        className="aspect-video w-full rounded-lg border border-slate-700 bg-[#0D1524] object-contain"
                        onError={(event) => {
                          event.currentTarget.style.visibility = "hidden";
                        }}
                        onLoad={(event) => {
                          event.currentTarget.style.visibility = "visible";
                        }}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    + Add Image
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Project Image Gallery
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Manage project screenshots and cover image.
                  </p>
                </div>

                <span className="text-xs text-cyan-400">
                  {(project.images ?? []).length} images
                </span>
              </div>

              {(project.images ?? []).length > 0 ? (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[...project.images]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((image) => (
                      <div
                        key={image.id ?? image.imageUrl}
                        className={`overflow-hidden rounded-xl border bg-[#080D18] ${
                          image.isCover ? "border-cyan-500" : "border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                          <span className="text-xs text-slate-400">
                            {image.isCover ? "Cover Image" : "Gallery Image"}
                          </span>

                          {image.isCover && (
                            <span className="rounded bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-400">
                              COVER
                            </span>
                          )}
                        </div>

                        <img
                          src={image.imageUrl}
                          alt={image.altText || project.name || "Project image"}
                          loading="lazy"
                          className="aspect-video w-full bg-[#080D18] object-contain"
                        />

                        <div className="space-y-3 p-3">
                          <label className="block text-xs text-slate-400">
                            Caption
                            <input
                              type="text"
                              value={image.caption ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;

                                setProject((prev) => ({
                                  ...prev,
                                  images: (prev.images ?? []).map((item) =>
                                    item.id === image.id
                                      ? { ...item, caption: value }
                                      : item,
                                  ),
                                }));
                              }}
                              placeholder="e.g. Dashboard screenshot"
                              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0D1524] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                            />
                          </label>

                          <label className="block text-xs text-slate-400">
                            Alt Text
                            <input
                              type="text"
                              value={image.altText ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;

                                setProject((prev) => ({
                                  ...prev,
                                  images: (prev.images ?? []).map((item) =>
                                    item.id === image.id
                                      ? { ...item, altText: value }
                                      : item,
                                  ),
                                }));
                              }}
                              placeholder="Describe the image"
                              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0D1524] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                            />
                          </label>

                          <div className="flex flex-wrap gap-2">
                            {!image.isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetCover(image.id)}
                                className="rounded-lg border border-cyan-500/50 px-3 py-2 text-xs text-cyan-400 transition hover:bg-cyan-500/10"
                              >
                                Set as Cover
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(image.id)}
                              className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                            >
                              Remove Image
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-dashed border-slate-700 p-6 text-center">
                  <p className="text-sm text-slate-400">
                    No project images yet.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    You can add images in the next step.
                  </p>
                </div>
              )}
            </div>
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
