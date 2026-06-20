// Returns Bobola's live Google rating + review count.
// Needs a Google Places API key set as the env var GOOGLE_PLACES_API_KEY
// (Vercel: Project Settings -> Environment Variables). Until then it returns
// nulls and the site keeps showing its static fallback number.
//
// Optional: set GOOGLE_PLACE_ID to pin the exact place (most reliable).
// Otherwise it resolves the place from the name + address.
export default async function handler(req, res) {
  const KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!KEY) {
    return res.status(200).json({ rating: null, total: null, note: "not configured" });
  }

  try {
    let rating = null;
    let total = null;
    const PLACE_ID = process.env.GOOGLE_PLACE_ID;

    if (PLACE_ID) {
      const url =
        "https://maps.googleapis.com/maps/api/place/details/json" +
        `?place_id=${encodeURIComponent(PLACE_ID)}` +
        "&fields=rating,user_ratings_total,name" +
        `&key=${KEY}`;
      const r = await fetch(url);
      const j = await r.json();
      if (j.result) {
        rating = j.result.rating ?? null;
        total = j.result.user_ratings_total ?? null;
      }
    } else {
      const q = encodeURIComponent("Bobola's Restaurant, 9 Simon Street, Nashua, NH");
      const url =
        "https://maps.googleapis.com/maps/api/place/findplacefromtext/json" +
        `?input=${q}&inputtype=textquery` +
        "&fields=rating,user_ratings_total,name" +
        `&key=${KEY}`;
      const r = await fetch(url);
      const j = await r.json();
      const c = j.candidates && j.candidates[0];
      if (c) {
        rating = c.rating ?? null;
        total = c.user_ratings_total ?? null;
      }
    }

    // Cache at the edge for 6h, serve stale up to 24h while refreshing.
    res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
    return res.status(200).json({ rating, total });
  } catch (err) {
    console.error("google-rating error:", err);
    return res.status(200).json({ rating: null, total: null });
  }
}
