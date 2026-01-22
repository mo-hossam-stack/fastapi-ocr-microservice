#!/bin/sh
set -e

# Replace environment variables in the template
envsubst '${API_PROXY_TARGET}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starting Nginx with proxy target: $API_PROXY_TARGET"

exec nginx -g 'daemon off;'
