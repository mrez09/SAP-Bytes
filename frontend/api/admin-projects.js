import { prisma } from "../lib/prisma.js";
import { verifyAdmin } from "../lib/admin-auth.js";

function getYouTubeVideoId(value) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else {
        const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
        videoId = match?.[1] || "";
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!["GET", "POST", "PUT", "DELETE"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  if (req.method === "DELETE") {
    const id = typeof req.query?.id === "string" ? req.query.id : "";

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    try {
      const project = await prisma.project.delete({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: "Project deleted successfully",
        data: {
          id: project.id,
          name: project.name,
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      console.error("Failed to delete project:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete project",
      });
    }
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (req.method === "POST") {
    const {
      name,
      channel,
      category,
      type,
      status,
      subtitle,
      overview,
      features,
      tech,
      videoUrl,
    } = req.body ?? {};

    const requiredFields = {
      name,
      channel,
      category,
      type,
      status,
      subtitle,
      overview,
    };

    const missingField = Object.entries(requiredFields).find(
      ([, value]) => typeof value !== "string" || !value.trim(),
    );

    if (missingField) {
      return res.status(400).json({
        success: false,
        message: `Field "${missingField[0]}" is required`,
      });
    }

    if (
      (features !== undefined &&
        (!Array.isArray(features) ||
          !features.every((item) => typeof item === "string"))) ||
      (tech !== undefined &&
        (!Array.isArray(tech) ||
          !tech.every((item) => typeof item === "string")))
    ) {
      return res.status(400).json({
        success: false,
        message: "Features and tech must be arrays of strings",
      });
    }

    const id = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Project name must contain letters or numbers",
      });
    }

    const videoId = videoUrl?.trim() ? getYouTubeVideoId(videoUrl) : null;

    if (videoUrl?.trim() && !videoId) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube video URL.",
      });
    }

    try {
      const project = await prisma.project.create({
        data: {
          id,
          name: name.trim(),
          channel: channel.trim(),
          category: category.trim(),
          type: type.trim(),
          status: status.trim(),
          subtitle: subtitle.trim(),
          overview: overview.trim(),
          features: features ?? [],
          tech: tech ?? [],
          videos: videoId
            ? {
                create: [
                  {
                    videoId,
                    title: name.trim(),
                    description: subtitle.trim() || null,
                    sortOrder: 0,
                    isFeatured: true,
                  },
                ],
              }
            : undefined,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: project,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "Project ID, name, or channel already exists",
        });
      }

      console.error("Failed to create project:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create project",
      });
    }
  }

  if (req.method === "PUT") {
    const id = typeof req.query?.id === "string" ? req.query.id : "";

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const {
      name,
      channel,
      category,
      type,
      status,
      subtitle,
      overview,
      features,
      tech,
    } = req.body ?? {};

    const requiredFields = {
      name,
      channel,
      category,
      type,
      status,
      subtitle,
      overview,
    };

    const missingField = Object.entries(requiredFields).find(
      ([, value]) => typeof value !== "string" || !value.trim(),
    );

    if (missingField) {
      return res.status(400).json({
        success: false,
        message: `Field "${missingField[0]}" is required`,
      });
    }

    if (
      (features !== undefined &&
        (!Array.isArray(features) ||
          !features.every((item) => typeof item === "string"))) ||
      (tech !== undefined &&
        (!Array.isArray(tech) ||
          !tech.every((item) => typeof item === "string")))
    ) {
      return res.status(400).json({
        success: false,
        message: "Features and tech must be arrays of strings",
      });
    }

    try {
      const project = await prisma.project.update({
        where: { id },
        data: {
          name: name.trim(),
          channel: channel.trim(),
          category: category.trim(),
          type: type.trim(),
          status: status.trim(),
          subtitle: subtitle.trim(),
          overview: overview.trim(),
          features: features ?? [],
          tech: tech ?? [],
        },
      });

      return res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: project,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "Project name or channel already exists",
        });
      }

      console.error("Failed to update project:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update project",
      });
    }
  }

  try {
    const projects = await prisma.project.findMany({
      include: {
        images: true,
        videos: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Failed to fetch admin projects:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin projects",
    });
  }
}
