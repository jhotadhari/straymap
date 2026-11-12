#!/usr/bin/env python3
"""Extract a line geometry from a straymap SQLite DB copy into CSV (and GPX).

The `lines.geometry` column holds a SpatiaLite internal BLOB geometry. The host
has no spatialite extension, so the blob is parsed by hand:

    byte 0       0x00 START
    byte 1       endian: 0x01 little, 0x00 big
    int32        SRID
    4 x double   MBR minx, miny, maxx, maxy
    byte         0x7C MBR_END
    int32        class type: 2 LINESTRING, 1002 Z, 2002 M, 3002 ZM
    int32        numPoints
    numPoints x  (x=lng, y=lat [, z] [, m]) doubles
    byte         0xFE END

Optionally joins timestamps from `track_points` (by point_index) for --track-id.

Read-only: the DB is opened with mode=ro.
"""
import argparse
import os
import sqlite3
import struct
import sys
from datetime import datetime, timezone
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))

# class type -> (dims, has_z, has_m, name)
LINESTRING_TYPES = {
    2: (2, False, False, 'LINESTRING'),
    1002: (3, True, False, 'LINESTRING Z'),
    2002: (3, False, True, 'LINESTRING M'),
    3002: (4, True, True, 'LINESTRING ZM'),
}


class GeometryError(ValueError):
    pass


def parse_spatialite_linestring(blob):
    """Return dict(srid, mbr, type, points=[(lng, lat, z|None, m|None)])."""
    if blob is None or len(blob) < 48:
        raise GeometryError('blob too short (%s bytes)' % (None if blob is None else len(blob)))
    blob = bytes(blob)
    if blob[0] != 0x00:
        raise GeometryError('bad START byte 0x%02x' % blob[0])
    if blob[1] == 0x01:
        e = '<'
    elif blob[1] == 0x00:
        e = '>'
    else:
        raise GeometryError('bad endian byte 0x%02x' % blob[1])
    srid, = struct.unpack_from(e + 'i', blob, 2)
    mbr = struct.unpack_from(e + '4d', blob, 6)
    if blob[38] != 0x7C:
        raise GeometryError('bad MBR_END byte 0x%02x' % blob[38])
    gtype, = struct.unpack_from(e + 'i', blob, 39)
    if gtype not in LINESTRING_TYPES:
        raise GeometryError('unsupported geometry class type %d (only linestrings: %s)'
                            % (gtype, sorted(LINESTRING_TYPES)))
    dims, has_z, has_m, name = LINESTRING_TYPES[gtype]
    n, = struct.unpack_from(e + 'i', blob, 43)
    off = 47
    expected = off + n * dims * 8 + 1
    if len(blob) != expected:
        raise GeometryError('size mismatch: blob %d bytes, expected %d for %d %s points'
                            % (len(blob), expected, n, name))
    if blob[-1] != 0xFE:
        raise GeometryError('bad END byte 0x%02x' % blob[-1])
    flat = struct.unpack_from(e + '%dd' % (n * dims), blob, off)
    points = []
    for i in range(n):
        c = flat[i * dims:(i + 1) * dims]
        lng, lat = c[0], c[1]
        z = c[2] if has_z else None
        m = c[3] if (has_z and has_m) else (c[2] if has_m else None)
        points.append((lng, lat, z, m))
    return {'srid': srid, 'mbr': mbr, 'type': gtype, 'type_name': name, 'points': points}


def fmt_ts(ms):
    if ms is None:
        return ''
    return datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'


def write_gpx(path, rows, name):
    with open(path, 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<gpx version="1.1" creator="straymap-memtest extract_track.py" '
                'xmlns="http://www.topografix.com/GPX/1/1">\n')
        f.write('  <trk><name>%s</name><trkseg>\n' % escape(name))
        for idx, lat, lng, alt, ts in rows:
            f.write('    <trkpt lat="%.8f" lon="%.8f">' % (lat, lng))
            if alt is not None:
                f.write('<ele>%.2f</ele>' % alt)
            if ts is not None:
                f.write('<time>%s</time>' % fmt_ts(ts))
            f.write('</trkpt>\n')
        f.write('  </trkseg></trk>\n</gpx>\n')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--db', default='/tmp/opencode/straymap2.db')
    ap.add_argument('--line-id', type=int, default=2115)
    ap.add_argument('--track-id', type=int, default=None,
                    help='join timestamps from track_points by point_index')
    ap.add_argument('--out', default=os.path.join(HERE, 'track4.csv'))
    ap.add_argument('--gpx', action='store_true', help='also write a GPX 1.1 file next to the CSV')
    args = ap.parse_args()

    con = sqlite3.connect('file:%s?mode=ro' % args.db, uri=True)
    row = con.execute('SELECT geometry FROM lines WHERE id = ?', (args.line_id,)).fetchone()
    if row is None:
        sys.exit('line id %d not found' % args.line_id)
    g = parse_spatialite_linestring(row[0])
    pts = g['points']

    ts_by_idx = {}
    if args.track_id is not None:
        tline = con.execute('SELECT line_id FROM tracks WHERE id = ?', (args.track_id,)).fetchone()
        if tline is None:
            print('WARNING: track id %d not found, no timestamps' % args.track_id, file=sys.stderr)
        else:
            if tline[0] != args.line_id:
                print('WARNING: track %d has line_id %s, not %d' % (args.track_id, tline[0], args.line_id),
                      file=sys.stderr)
            for pi, ts in con.execute(
                    'SELECT point_index, timestamp FROM track_points WHERE track_id = ? ORDER BY point_index',
                    (args.track_id,)):
                ts_by_idx[pi] = ts
            if len(ts_by_idx) != len(pts):
                print('WARNING: %d track_points vs %d geometry points' % (len(ts_by_idx), len(pts)),
                      file=sys.stderr)
    con.close()

    rows = [(i, p[1], p[0], p[2], ts_by_idx.get(i)) for i, p in enumerate(pts)]
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        f.write('idx,lat,lng,alt,timestamp_ms\n')
        for idx, lat, lng, alt, ts in rows:
            f.write('%d,%.8f,%.8f,%s,%s\n' % (idx, lat, lng, '' if alt is None else '%.2f' % alt,
                                              '' if ts is None else ts))

    minx, miny, maxx, maxy = g['mbr']
    lngs = [p[0] for p in pts]
    lats = [p[1] for p in pts]
    print('geometry : %s, SRID %d, %d points' % (g['type_name'], g['srid'], len(pts)))
    print('MBR blob : lng %.6f..%.6f  lat %.6f..%.6f' % (minx, maxx, miny, maxy))
    print('bbox calc: lng %.6f..%.6f  lat %.6f..%.6f' % (min(lngs), max(lngs), min(lats), max(lats)))
    for label, r in (('first', rows[0]), ('last ', rows[-1])):
        print('%s    : idx %d lat %.6f lng %.6f alt %s ts %s %s'
              % (label, r[0], r[1], r[2], r[3], r[4], fmt_ts(r[4])))
    print('timestamps joined: %d' % sum(1 for r in rows if r[4] is not None))
    print('wrote %s' % args.out)
    if args.gpx:
        gpx = os.path.splitext(args.out)[0] + '.gpx'
        write_gpx(gpx, rows, 'line %d' % args.line_id)
        print('wrote %s' % gpx)


if __name__ == '__main__':
    main()
