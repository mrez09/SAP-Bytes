export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `sap_bytes_admin=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`,
  );

  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
}
