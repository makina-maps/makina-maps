#!/bin/bash

set -e

# curl -X GET -I http://127.0.0.1/openmaptiles_v3/14/8166/5900.pbf > /dev/null
# curl -X EXPIRE http://127.0.0.1/openmaptiles_v3/14/8166/5900.pbf

SOURCES=`curl http://127.0.0.1/sources.json | jq -r .[].name`

{
# Expire pending tiles
find /data/expire_tiles/???????? -name *.tiles & \
# Watch to expire new tiles
inotifywait --monitor --recursive --event moved_to --format '%w%f' /data/expire_tiles/
} | while read tiles; do
    cat "${tiles}" | while read tile; do
        >&2 echo "${tile}"
        echo "${SOURCES}" | while read source; do
            echo "--output /dev/null http://127.0.0.1/${source}/${tile}*"
        done
    done | xargs -n 66 curl -X EXPIRE --silent
    rm "${tiles}"
done
