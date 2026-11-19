#!/bin/sh
set -eu

if tempo-tls; then
  state=issued
else
  state=temporary
  echo "tempo-tls: using a temporary self-signed certificate until certbot issues the real one"
fi

(
  while :; do
    if [ "$state" = issued ]; then sleep 21600; else sleep 60; fi
    if tempo-tls; then
      state=issued
      nginx -s reload || true
    fi
  done
) &
