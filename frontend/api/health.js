export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: "SAP_BYTES API is running",
    timestamp: new Date().toISOString(),
  });
}
