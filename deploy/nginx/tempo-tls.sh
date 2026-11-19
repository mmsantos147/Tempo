#!/bin/sh
set -eu

live="/etc/letsencrypt/live/${TEMPO_DOMAIN}"
tls=/etc/nginx/tls
mkdir -p "$tls"

if [ -f "$live/fullchain.pem" ] && [ -f "$live/privkey.pem" ]; then
  ln -sf "$live/fullchain.pem" "$tls/fullchain.pem"
  ln -sf "$live/privkey.pem" "$tls/privkey.pem"
  exit 0
fi

if [ ! -e "$tls/fullchain.pem" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 30 -subj "/CN=${TEMPO_DOMAIN}" \
    -keyout "$tls/privkey.pem" -out "$tls/fullchain.pem" >/dev/null 2>&1
fi
exit 1
