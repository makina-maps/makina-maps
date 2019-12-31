#!/bin/bash

set -e

# Run the updater.
# It loops over pending updates, then wait for new update.
docker-compose run --rm -e CONFIG_JSON=/import/imposm-config.json -e TILES_DIR=/import/expire_tiles update-osm
