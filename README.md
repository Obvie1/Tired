Obvie World - Vercel-ready project
-----------------------------------

Contents:
- index.html        (main page with hacker styling)
- style.css         (optional overrides)
- main.js           (client geolocation + reverse geocode + POST to API)
- api/submit-location.js  (Vercel serverless function that logs incoming payloads)

How to deploy on Vercel:
1. Put this project in a GitHub/GitLab repo (or zip and drag to Vercel).
2. Login to Vercel and import the repo. Vercel will detect the `api/` folder as serverless functions.
3. Deploy. Visit the site URL.
4. Open the page, click "Find my state to continue", allow location when prompted.
5. Check function logs in Vercel dashboard to see received payloads.

Notes:
- Geolocation requires HTTPS (Vercel provides it by default).
- For production storage, replace api/submit-location.js to insert rows into Supabase/Airtable/Postgres — don't store secrets in client-side code.
- Nominatim (OpenStreetMap) reverse geocoding is free for light/demo use; consider paid providers for heavy traffic.

