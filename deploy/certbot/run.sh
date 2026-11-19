#!/bin/sh
set -u

trap exit TERM

staging=""
if [ "${CERTBOT_STAGING:-0}" = "1" ]; then
  staging="--staging"
fi

while :; do
  if [ -d "/etc/letsencrypt/live/${TEMPO_DOMAIN}" ]; then
    certbot renew --webroot -w /var/www/certbot --quiet
    wait_seconds=43200
  elif certbot certonly --webroot -w /var/www/certbot -d "${TEMPO_DOMAIN}" \
      --email "${ACME_EMAIL}" --agree-tos --no-eff-email --non-interactive $staging; then
    wait_seconds=43200
  else
    wait_seconds=3600
  fi
  sleep "$wait_seconds" &
  wait $!
done
