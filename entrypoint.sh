#!/bin/sh
cat > /srv/__config.js << EOF
window.__SOLAR_CONFIG = {
  VENUS_URL: "${PUBLIC_VENUS_URL:-http://localhost:8000}",
  NEPTUNE_URL: "${PUBLIC_NEPTUNE_URL:-http://localhost:8001}",
  MARS_URL: "${PUBLIC_MARS_URL:-http://localhost:8002}",
  MOON_URL: "${PUBLIC_MOON_URL:-http://localhost:8003}",
  SATURN_URL: "${PUBLIC_SATURN_URL:-http://localhost:8006}",
  SUN_URL: "${PUBLIC_SUN_URL:-http://localhost:8007}",
  PLUTO_URL: "${PUBLIC_PLUTO_URL:-http://localhost:8008}",
  THEMIS_URL: "${PUBLIC_THEMIS_URL:-http://localhost:8009}",
  MERCURY_URL: "${PUBLIC_MERCURY_URL:-http://localhost:8005}"
};
EOF
exec nginx -g 'daemon off;'
