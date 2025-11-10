// main.js
// Client-side geolocation + reverse-geocode + send to backend
// Expects elements with IDs: findStateBtn, terminal, status

(function () {
  // Config
  const BACKEND_ENDPOINT = '/api/submit-location'; // change to full URL if hosted separately (e.g., https://yourapp.onrender.com/submit-location)
  const REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse'; // public OSM reverse geocode
  const REVERSE_GEOCODE_PARAMS = { format: 'jsonv2', zoom: 8, addressdetails: 1 }; // zoom ~8 gives state-level in many countries

  // DOM references
  const btn = document.getElementById('findStateBtn');
  const terminal = document.getElementById('terminal');
  const status = document.getElementById('status');

  // Helpers
  function logTerminal(...parts) {
    const time = new Date().toLocaleTimeString();
    terminal.innerText += `\n[${time}] ${parts.join(' ')}`;
    terminal.scrollTop = terminal.scrollHeight;
  }
  function setStatus(text) {
    status.innerText = text;
  }
  function friendlyError(msg) {
    setStatus('Error');
    logTerminal('✖', msg);
  }

  // Build the reverse geocode URL with query string
  function buildReverseUrl(lat, lon) {
    const params = new URLSearchParams(REVERSE_GEOCODE_PARAMS);
    params.set('lat', String(lat));
    params.set('lon', String(lon));
    // include a small "useragent" param? Nominatim prefers a valid Referer/User-Agent header, but browsers will send referer automatically.
    return `${REVERSE_GEOCODE_URL}?${params.toString()}`;
  }

  // Reverse geocode using OSM Nominatim (no API key — demo usage; mind rate limits)
  async function reverseGeocode(lat, lon) {
    const url = buildReverseUrl(lat, lon);
    logTerminal('⤴ Reverse geocoding...', `(lat: ${lat.toFixed(5)}, lon: ${lon.toFixed(5)})`);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          // Nominatim prefers requests to include Contact info or a valid Referer; browsers usually supply referer.
          'Accept': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error(`Reverse geocode failed: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      // Try common fields for state/region in the response address block
      const addr = json.address || {};
      const state = addr.state || addr.region || addr.county || addr.state_district || addr.province || addr.village || json.display_name || 'Unknown';
      logTerminal('✔ Reverse geocode result:', state);
      return { raw: json, state };
    } catch (err) {
      logTerminal('✖ Reverse geocode error:', err.message || err);
      return { raw: null, state: 'Unknown' };
    }
  }

  // Send location info to backend
  async function sendToBackend(payload) {
    logTerminal('⤴ Sending location to backend...');
    try {
      const res = await fetch(BACKEND_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${res.statusText} ${text}`);
      }
      const data = await res.json().catch(() => ({}));
      logTerminal('✔ Backend response received.');
      return { ok: true, data };
    } catch (err) {
      logTerminal('✖ Backend error:', err.message || err);
      return { ok: false, err };
    }
  }

  // Main flow: get position, reverse-geocode, POST to backend
  async function handleFindState() {
    if (!navigator.geolocation) {
      friendlyError('Geolocation not supported by this browser.');
      return;
    }

    setStatus('Requesting permission…');
    logTerminal('🔒 Requesting location permission from user...');

    // A single-shot getCurrentPosition; if you need continuous updates, use watchPosition.
    navigator.geolocation.getCurrentPosition(async function (pos) {
      try {
        setStatus('Location acquired');
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        logTerminal('📍 Coordinates:', `lat=${lat.toFixed(6)}`, `lon=${lon.toFixed(6)}`);

        setStatus('Resolving state…');
        const { state, raw } = await reverseGeocode(lat, lon);

        // Build payload to backend
        const payload = {
          latitude: lat,
          longitude: lon,
          state: String(state),
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        };

        setStatus('Sending to server…');
        const result = await sendToBackend(payload);
        if (result.ok) {
          setStatus('Done — state found');
          logTerminal('✅ Sent to backend:', JSON.stringify(payload));
          // display friendly confirmation in the UI
          const friendly = `Your state: ${payload.state}`;
          // update visible status element
          setStatus(friendly);
          // Optionally show a notice in the page
          logTerminal('🎉', friendly);
        } else {
          setStatus('Failed to send');
          logTerminal('⚠ Failed to send payload to backend.');
        }
      } catch (e) {
        friendlyError('Unexpected error while processing location.');
        console.error(e);
      }
    }, function (err) {
      // Error callback for geolocation
      console.error('Geolocation error', err);
      if (err.code === err.PERMISSION_DENIED) {
        friendlyError('Permission denied. Please allow location to continue.');
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        friendlyError('Position unavailable.');
      } else if (err.code === err.TIMEOUT) {
        friendlyError('Location request timed out.');
      } else {
        friendlyError('Geolocation error occurred.');
      }
    }, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60 * 1000
    });
  }

  // Bind button
  if (!btn) {
    console.error('Find State button not found (#findStateBtn).');
  } else {
    btn.addEventListener('click', function () {
      // Clear terminal first line and keep history
      logTerminal('\n--- User triggered Find My State ---');
      setStatus('Starting…');
      handleFindState();
    });
  }

  // init status
  setStatus('Idle');

  // EXPORTS (for debugging in console)
  window.OBVIE = window.OBVIE || {};
  window.OBVIE.findState = handleFindState;
  window.OBVIE.config = { BACKEND_ENDPOINT, REVERSE_GEOCODE_URL };
})();
