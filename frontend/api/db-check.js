import { prisma } from "../lib/prisma.js";

export default async function handler(req, res) {
  try {
    const projectsCount = await prisma.project.count();

    return res.status(200).json({
      success: true,
      database: "connected",
      projectsCount,
    });
  } catch (error) {
    console.error("Database check failed:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
}
