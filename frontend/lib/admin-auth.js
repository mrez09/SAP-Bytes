import { createHmac, timingSafeEqual } from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), "frontend/.env.local"),
});

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

export function verifyAdmin(req) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return false;
  }

  const cookieHeader = req.headers.cookie || "";

  const tokenCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("sap_bytes_admin="));

  if (!tokenCookie) {
    return false;
  }

  const token = tokenCookie.slice("sap_bytes_admin=".length);
  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [encodedPayload, signature] = parts;

  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );

    if (
      payload.sub !== "admin" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
