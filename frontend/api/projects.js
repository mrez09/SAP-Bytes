import { prisma } from "../lib/prisma.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
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

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
}
