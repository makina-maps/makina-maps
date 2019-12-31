#!/bin/bash

set -e

# Run nginx
nginx -g "daemon off;" &

# Wait for nginx ready
sleep 1

# Run expire tiles service
./expire.sh
