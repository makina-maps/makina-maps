#!/bin/bash

set -e

# curl -X GET -I http://127.0.0.1/openmaptiles_v3/14/8166/5900.pbf > /dev/null
# curl -X EXPIRE http://127.0.0.1/openmaptiles_v3/14/8166/5900.pbf

SOURCES_JSON=http://kartotherian:6533/sources.json

attempt_counter=0
max_attempts=20

until $(curl --output /dev/null --silent --head --fail "${SOURCES_JSON}"); do
    if [ ${attempt_counter} -eq ${max_attempts} ];then
      echo "Max attempts reached"
      exit 1
    fi

    printf '.'
    attempt_counter=$(($attempt_counter+1))
    sleep 1
done

SOURCES=`curl "${SOURCES_JSON}" | jq -r .[].name`

echo "EXPIRE SOURCE:" $SOURCES

{
# Expire pending tiles
find /data/expire_tiles/???????? -name *.tiles & \
# Watch to expire new tiles
inotifywait --monitor --recursive --event moved_to --format '%w%f' /data/expire_tiles/
} | while read tiles; do
    cat "${tiles}" | while read tile; do
        >&2 echo "${tile}"
        echo "${SOURCES}" | while read source; do
            echo "--output /dev/null http://127.0.0.1:81/${source}/${tile}*"
        done
    done | xargs -n 66 curl -X EXPIRE --silent
    rm "${tiles}"
done
