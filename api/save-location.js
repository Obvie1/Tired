export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { latitude, longitude, state } = req.body;

  console.log("📍 New Location Received:", latitude, longitude, state);

  return res.status(200).json({ success: true });
      }
