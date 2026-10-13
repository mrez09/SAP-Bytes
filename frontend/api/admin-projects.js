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
      images,
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

    // Gallery
    let validImages = [];

    if (Array.isArray(images)) {
      for (const image of images) {
        if (
          !image ||
          typeof image !== "object" ||
          typeof image.imageUrl !== "string" ||
          !image.imageUrl.trim()
        ) {
          return res.status(400).json({
            success: false,
            message: "Each image must have a valid image URL.",
          });
        }

        let parsedUrl;

        try {
          parsedUrl = new URL(image.imageUrl.trim());
        } catch {
          return res.status(400).json({
            success: false,
            message: "Invalid image URL.",
          });
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          return res.status(400).json({
            success: false,
            message: "Image URL must use HTTP or HTTPS.",
          });
        }

        if (
          (image.caption !== undefined && typeof image.caption !== "string") ||
          (image.altText !== undefined && typeof image.altText !== "string") ||
          (image.isCover !== undefined && typeof image.isCover !== "boolean")
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid image metadata.",
          });
        }

        validImages.push({
          imageUrl: parsedUrl.href,
          caption: image.caption?.trim() || null,
          altText: image.altText?.trim() || null,
          isCover: image.isCover === true,
        });
      }
    }

    if (validImages.filter((image) => image.isCover).length > 1) {
      return res.status(400).json({
        success: false,
        message: "Only one image can be selected as cover.",
      });
    }

    if (validImages.length > 0 && !validImages.some((image) => image.isCover)) {
      validImages[0].isCover = true;
    }

    //Prisma

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
          images:
            validImages.length > 0
              ? {
                  create: validImages.map((image, index) => ({
                    imageUrl: image.imageUrl,
                    altText:
                      image.altText || `${name.trim()} screenshot ${index + 1}`,
                    caption: image.caption,
                    sortOrder: index,
                    isCover: image.isCover,
                  })),
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

    const videoId =
      typeof videoUrl === "string" && videoUrl.trim()
        ? getYouTubeVideoId(videoUrl)
        : null;

    if (
      videoUrl !== undefined &&
      (typeof videoUrl !== "string" || (videoUrl.trim() && !videoId))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube video URL.",
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

      if (videoUrl !== undefined) {
        await prisma.projectVideo.updateMany({
          where: {
            projectId: id,
            isFeatured: true,
          },
          data: {
            isFeatured: false,
          },
        });

        if (videoId) {
          await prisma.projectVideo.upsert({
            where: {
              projectId_videoId: {
                projectId: id,
                videoId,
              },
            },
            update: {
              title: name.trim(),
              description: subtitle.trim() || null,
              sortOrder: 0,
              isFeatured: true,
            },
            create: {
              projectId: id,
              videoId,
              title: name.trim(),
              description: subtitle.trim() || null,
              sortOrder: 0,
              isFeatured: true,
            },
          });
        }
      }

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
