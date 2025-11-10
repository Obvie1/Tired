// api/submit-location.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('Received location payload:', payload);

    // Simple acceptance response
    return res.status(200).json({ ok: true, received: payload });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
