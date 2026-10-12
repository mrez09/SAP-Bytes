import { createHmac, timingSafeEqual } from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), "frontend/.env.local"),
});

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

function signToken(payload, secret) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );

  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function safeCompare(a, b) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;
  console.log("ADMIN_PASSWORD loaded:", Boolean(adminPassword));
  console.log("JWT_SECRET loaded:", Boolean(jwtSecret));

  if (!adminPassword || !jwtSecret) {
    return res.status(500).json({
      success: false,
      message: "Admin authentication is not configured",
    });
  }

  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!safeCompare(password, adminPassword)) {
    return res.status(401).json({
      success: false,
      message: "Invalid password",
    });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 8 * 60 * 60;

  const token = signToken(
    {
      sub: "admin",
      exp: expiresAt,
    },
    jwtSecret,
  );

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `sap_bytes_admin=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${secure}`,
  );

  return res.status(200).json({
    success: true,
    message: "Admin login successful",
    expiresAt,
  });
}
