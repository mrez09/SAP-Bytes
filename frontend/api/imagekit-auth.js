import ImageKit from "@imagekit/nodejs";
import { verifyAdmin } from "../lib/admin-auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return res.status(500).json({
      success: false,
      message: "ImageKit configuration is missing.",
    });
  }

  try {
    const imageKit = new ImageKit({ privateKey });
    const authParams = imageKit.helper.getAuthenticationParameters();

    return res.status(200).json({
      success: true,
      ...authParams,
      publicKey,
    });
  } catch (error) {
    console.error("Failed to generate ImageKit auth:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to prepare image upload.",
    });
  }
}
