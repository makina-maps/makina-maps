#!/bin/bash

set -e

export AREA=${1:-europe/andorra}
EXTRACT="http://download.geofabrik.de/${AREA}-latest.osm.pbf"
EXTRACT_UPDATE="http://download.geofabrik.de/${AREA}-updates/"

# Remove existing OpenStreetMap extract
TARGET="${AREA##*/}-latest.osm.pbf"
find ./data -name *.pbf | grep -v "${TARGET}" | while read pbf; do
    mv "${pbf}" "${pbf}_"
done

# Download OpenStreetMap extract
wget -nc "${EXTRACT}" -P data/

# Setup the configuration for data updater
echo "{\"replication_url\": \"${EXTRACT_UPDATE}\", \"replication_interval\": \"24h\"}" > data/imposm-config.json
