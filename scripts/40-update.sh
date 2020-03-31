#!/bin/bash

set -e

# Run the updater.
# It loops over pending updates, then wait for new update.
make update-osm
