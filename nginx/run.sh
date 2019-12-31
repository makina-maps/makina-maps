#!/bin/bash

set -e

# Run nginx
nginx -g "daemon off;" &

# Wait for kartotherian to be ready
sleep 5

# Run expire tiles service
./expire.sh
