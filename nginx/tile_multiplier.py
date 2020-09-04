#!/usr/bin/env python

import sys

min_zoom, max_zoom = [int(z) for z in sys.argv[1:3]]
tile_set = set()

def print_once(x, y, z):
    tile = '{}/{}/{}'.format(z, x, y)
    num_tiles = len(tile_set)
    tile_set.add(tile)
    if num_tiles < len(tile_set):
        print tile

for line in sys.stdin:
    z, x, y = [int(i) for i in line.split('/')]
    print_once(z, x, y)

    xx, yy = x, y
    for zz in range(z - 1, min_zoom - 1, -1):
        xx, yy = xx // 2, yy // 2
        print_once(zz, xx, yy)

    xx, yy = x, y
    s = 1
    for zz in range(z + 1, max_zoom + 1):
        xx, yy = xx * 2, yy * 2
        s *= 2
        for sx in range(0, s):
            for sy in range(0, s):
                print_once(zz, xx+sx, yy+sy)
