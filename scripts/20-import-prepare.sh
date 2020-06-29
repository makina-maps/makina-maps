#!/bin/bash

set -e

DC_OPTS="--rm -u $(id -u):$(id -g)"

export PROVIDER=${PROVIDER:-geofabrik}
export AREA=${1:-andorra}

# Remove existing OpenStreetMap extract
TARGET="${AREA##*/}-latest.osm.pbf"
find ./data -name "*.pbf" | grep -v "${TARGET}" | while read pbf; do
    mv "${pbf}" "${pbf}_"
done

if test -f "./data/${TARGET}"; then
    echo "${TARGET} already exist, skip download."
    exit
fi

# Remove OpenStreetMap diff
make init-dirs
docker-compose run ${DC_OPTS} openmaptiles-tools bash -c "rm -fr /import/??? /import/borders /import/expire_tiles"
mkdir -p data/expire_tiles

make download-${PROVIDER} area=${AREA}
