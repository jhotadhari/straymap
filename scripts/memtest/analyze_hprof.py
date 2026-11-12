#!/usr/bin/env python3
"""Streaming class histogram + diff for Android (ART) HPROF heap dumps.

Usage:
  analyze_hprof.py dump00.hprof dump07.hprof [...] [--top 40] [--heap app]
  analyze_hprof.py --self-test

Parses "JAVA PROFILE 1.0.x" files including the Android sub-records
(HEAP_DUMP_INFO 0xFE, ROOT_INTERNED_STRING 0x89, ROOT_FINALIZING 0x8A,
ROOT_DEBUGGER 0x8B, ROOT_REFERENCE_CLEANUP 0x8C, ROOT_VM_INTERNAL 0x8D,
ROOT_JNI_MONITOR 0x8E, UNREACHABLE 0x90, PRIMITIVE_ARRAY_NODATA 0xC3).
The file is streamed record by record in bounded chunks; object payloads are
skipped (seek), only per-(heap, class) counters are kept, so memory use is
independent of the dump size (apart from the string table).

Histogram per heap ("app", "image", "zygote", "default" when no
HEAP_DUMP_INFO): instance count and SHALLOW bytes per class name.
  * instances        -> class name (LOAD_CLASS + STRING)
  * primitive arrays -> "byte[]", "short[]", "char[]", ...
  * object arrays    -> array class name, e.g. "java.lang.String[]"
  * class objects    -> "java.lang.Class" (static field bytes + header)

Shallow size estimate (no alignment/padding; real sizes are up to 7 B larger):
  instance      = dumped field data length + OBJ_HEADER
  array         = elements * element size  + ARRAY_HEADER
  class object  = static values            + OBJ_HEADER
Defaults are auto-detected: on ART, java.lang.Object declares the instance
fields `shadow$_klass_` + `shadow$_monitor_`, so the 8-byte object header is
already part of each instance's dumped data -> OBJ_HEADER 0, ARRAY_HEADER 12
(8 header + 4 length). For other dumps OBJ_HEADER 12 / ARRAY_HEADER 16
(typical 64-bit HotSpot, compressed oops) are used. Override with
--obj-header / --array-header. Growth comparisons between dumps are
unaffected by the choice for a given class.
"""
import argparse
import io
import os
import struct
import sys
import time

# basic types: tag -> (name, size; 0 = id size)
BASIC = {2: ('object', 0), 4: ('boolean', 1), 5: ('char', 2), 6: ('float', 4), 7: ('double', 8),
         8: ('byte', 1), 9: ('short', 2), 10: ('int', 4), 11: ('long', 8)}

# top-level record tags
T_STRING, T_LOAD_CLASS, T_HEAP_DUMP, T_HEAP_DUMP_SEGMENT, T_HEAP_DUMP_END = 0x01, 0x02, 0x0C, 0x1C, 0x2C

# heap dump sub-records: tag -> fixed body layout as (n_ids, n_extra_bytes) for simple roots
ROOTS = {
    0xFF: (1, 0),  # ROOT_UNKNOWN
    0x01: (2, 0),  # ROOT_JNI_GLOBAL: obj, jni global ref
    0x02: (1, 8),  # ROOT_JNI_LOCAL: obj, thread serial, frame
    0x03: (1, 8),  # ROOT_JAVA_FRAME
    0x04: (1, 4),  # ROOT_NATIVE_STACK
    0x05: (1, 0),  # ROOT_STICKY_CLASS
    0x06: (1, 4),  # ROOT_THREAD_BLOCK
    0x07: (1, 0),  # ROOT_MONITOR_USED
    0x08: (1, 8),  # ROOT_THREAD_OBJECT
    0x89: (1, 0),  # ROOT_INTERNED_STRING (android)
    0x8A: (1, 0),  # ROOT_FINALIZING
    0x8B: (1, 0),  # ROOT_DEBUGGER
    0x8C: (1, 0),  # ROOT_REFERENCE_CLEANUP
    0x8D: (1, 0),  # ROOT_VM_INTERNAL
    0x8E: (1, 8),  # ROOT_JNI_MONITOR
    0x90: (1, 0),  # UNREACHABLE
}
S_CLASS_DUMP, S_INSTANCE, S_OBJ_ARRAY, S_PRIM_ARRAY, S_PRIM_ARRAY_NODATA, S_HEAP_DUMP_INFO = \
    0x20, 0x21, 0x22, 0x23, 0xC3, 0xFE

CHUNK = 8 << 20
MIN_AVAIL = 128  # every fixed-size sub-record header fits into this


class HprofError(Exception):
    pass


class HeapStats:
    """Aggregated result of one dump."""

    def __init__(self):
        self.path = None
        self.id_size = None
        self.version = None
        self.strings = {}            # string id -> bytes
        self.class_name_id = {}      # class object id -> string id
        # heap name -> {key: [count, data_bytes]}; key = class id (instances / obj arrays),
        # ('prim', type) for primitive arrays, ('class',) for class objects
        self.inst = {}
        self.objarr = {}
        self.prim = {}
        self.art = False             # java.lang.Object has shadow$_klass_
        self.n_records = 0
        self.n_objects = 0
        self.truncated = None
        self.seconds = 0.0

    def name(self, cid):
        sid = self.class_name_id.get(cid)
        if sid is None:
            return '<unknown class 0x%x>' % cid
        s = self.strings.get(sid)
        return s.decode('utf-8', 'replace') if s is not None else '<unknown name 0x%x>' % sid

    def histogram(self, obj_header, array_header):
        """-> {heap: {class_name: (count, shallow_bytes)}}"""
        out = {}
        heaps = set(self.inst) | set(self.objarr) | set(self.prim)
        for h in heaps:
            d = {}

            def add(name, c, b):
                old = d.get(name)
                d[name] = (c, b) if old is None else (old[0] + c, old[1] + b)

            for cid, (c, b) in self.inst.get(h, {}).items():
                if cid == 'class':
                    add('java.lang.Class', c, b + c * obj_header)
                else:
                    add(self.name(cid), c, b + c * obj_header)
            for cid, (c, b) in self.objarr.get(h, {}).items():
                add(self.name(cid), c, b + c * array_header)
            for t, (c, b) in self.prim.get(h, {}).items():
                add(BASIC.get(t, ('type%d' % t, 0))[0] + '[]', c, b + c * array_header)
            out[h] = d
        return out


def parse_hprof(f, progress=False, chunk=CHUNK):
    st = HeapStats()
    t_start = time.monotonic()
    # ---- header
    hdr = b''
    while True:
        c = f.read(1)
        if not c:
            raise HprofError('EOF in header')
        if c == b'\0':
            break
        hdr += c
        if len(hdr) > 64:
            raise HprofError('not an HPROF file (no header terminator)')
    st.version = hdr.decode('ascii', 'replace')
    if not st.version.startswith('JAVA PROFILE'):
        raise HprofError('not an HPROF file: %r' % st.version)
    b = f.read(12)
    if len(b) != 12:
        raise HprofError('EOF in header')
    idsz, = struct.unpack('>I', b[:4])
    if idsz not in (4, 8):
        raise HprofError('unsupported identifier size %d' % idsz)
    st.id_size = idsz
    idf = '>I' if idsz == 4 else '>Q'
    rec_hdr = struct.Struct('>BII')
    unpack_id = struct.Struct(idf).unpack_from
    load_class = struct.Struct('>I' + idf[1] + 'I' + idf[1]).unpack_from

    total = None
    if progress:
        try:
            total = os.fstat(f.fileno()).st_size
        except (AttributeError, OSError, io.UnsupportedOperation):
            total = None
    next_progress = 0.0

    while True:
        h = f.read(9)
        if not h:
            break
        if len(h) < 9:
            st.truncated = 'truncated record header'
            break
        tag, _t, length = rec_hdr.unpack(h)
        st.n_records += 1
        if tag == T_STRING:
            body = f.read(length)
            if len(body) < length:
                st.truncated = 'truncated STRING record'
                break
            st.strings[unpack_id(body, 0)[0]] = body[idsz:]
        elif tag == T_LOAD_CLASS:
            body = f.read(length)
            if len(body) < length:
                st.truncated = 'truncated LOAD_CLASS record'
                break
            _serial, cobj, _stack, name_id = load_class(body, 0)
            st.class_name_id[cobj] = name_id
        elif tag in (T_HEAP_DUMP, T_HEAP_DUMP_SEGMENT):
            err = _parse_heap_dump(f, length, st, chunk)
            if err:
                st.truncated = err
                break
        else:
            f.seek(length, 1)
        if total and progress:
            pos = f.tell()
            if pos / total >= next_progress:
                print('  %s: %3.0f%%  (%d objects)' % (os.path.basename(getattr(f, 'name', '?')),
                                                        100.0 * pos / total, st.n_objects),
                      file=sys.stderr, flush=True)
                next_progress += 0.1
    st.seconds = time.monotonic() - t_start
    return st


def _parse_heap_dump(f, length, st, chunk):
    """Parse one HEAP_DUMP / HEAP_DUMP_SEGMENT body of `length` bytes. Returns error str or None."""
    idsz = st.id_size
    I = 'I' if idsz == 4 else 'Q'
    s_id = struct.Struct('>' + I).unpack_from
    # INSTANCE_DUMP: id obj, u4 stack, id class, u4 len
    s_inst = struct.Struct('>%sI%sI' % (I, I)).unpack_from
    # OBJ_ARRAY: id, u4 stack, u4 n, id class
    s_oarr = struct.Struct('>%sII%s' % (I, I)).unpack_from
    # PRIM_ARRAY(_NODATA): id, u4 stack, u4 n, u1 type
    s_parr = struct.Struct('>%sIIB' % I).unpack_from
    # HEAP_DUMP_INFO: u4 heap id, id name
    s_info = struct.Struct('>I%s' % I).unpack_from
    # CLASS_DUMP fixed: id cls, u4 stack, id super, loader, signers, protdomain, res1, res2, u4 inst size
    s_cls = struct.Struct('>%sI%sI' % (I, I * 6)).unpack_from
    s_u2 = struct.Struct('>H').unpack_from
    cls_fixed = idsz * 7 + 4 + 4
    root_sizes = {t: n * idsz + extra for t, (n, extra) in ROOTS.items()}
    elem_size = {t: (sz or idsz) for t, (_n, sz) in BASIC.items()}

    left = length          # bytes of this record not yet read from the file
    buf = b''
    p = 0
    nbuf = 0

    def refill(buf, p, need):
        nonlocal left
        rest = buf[p:]
        take = min(max(chunk, need - len(rest)), left)
        data = f.read(take)
        if len(data) < take:
            raise EOFError
        left -= take
        return rest + data

    heap = st.__dict__.setdefault('_cur_heap', 'default')
    inst = st.inst.setdefault(heap, {})
    objarr = st.objarr.setdefault(heap, {})
    prim = st.prim.setdefault(heap, {})
    n_obj = 0
    try:
        while True:
            if nbuf - p < MIN_AVAIL and left:
                buf = refill(buf, p, MIN_AVAIL)
                p, nbuf = 0, len(buf)
            if p >= nbuf:
                break
            tag = buf[p]
            p += 1
            if tag == S_INSTANCE:
                _o, _s, cid, ln = s_inst(buf, p)
                p += idsz * 2 + 8
                a = inst.get(cid)
                if a is None:
                    inst[cid] = [1, ln]
                else:
                    a[0] += 1
                    a[1] += ln
                n_obj += 1
                # skip payload
                if ln <= nbuf - p:
                    p += ln
                else:
                    skip = ln - (nbuf - p)
                    if skip > left:
                        raise EOFError
                    f.seek(skip, 1)
                    left -= skip
                    buf, p, nbuf = b'', 0, 0
            elif tag == S_PRIM_ARRAY or tag == S_PRIM_ARRAY_NODATA:
                _o, _s, n, t = s_parr(buf, p)
                p += idsz + 9
                es = elem_size.get(t)
                if es is None:
                    raise HprofError('bad primitive array type %d' % t)
                ln = n * es
                a = prim.get(t)
                if a is None:
                    prim[t] = [1, ln]
                else:
                    a[0] += 1
                    a[1] += ln
                n_obj += 1
                if tag == S_PRIM_ARRAY:
                    if ln <= nbuf - p:
                        p += ln
                    else:
                        skip = ln - (nbuf - p)
                        if skip > left:
                            raise EOFError
                        f.seek(skip, 1)
                        left -= skip
                        buf, p, nbuf = b'', 0, 0
            elif tag == S_OBJ_ARRAY:
                _o, _s, n, cid = s_oarr(buf, p)
                p += idsz * 2 + 8
                ln = n * idsz
                a = objarr.get(cid)
                if a is None:
                    objarr[cid] = [1, ln]
                else:
                    a[0] += 1
                    a[1] += ln
                n_obj += 1
                if ln <= nbuf - p:
                    p += ln
                else:
                    skip = ln - (nbuf - p)
                    if skip > left:
                        raise EOFError
                    f.seek(skip, 1)
                    left -= skip
                    buf, p, nbuf = b'', 0, 0
            elif tag in root_sizes:
                p += root_sizes[tag]
            elif tag == S_HEAP_DUMP_INFO:
                hid, name_sid = s_info(buf, p)
                p += 4 + idsz
                nm = st.strings.get(name_sid)
                heap = nm.decode('utf-8', 'replace') if nm is not None else 'heap-%d' % hid
                st._cur_heap = heap
                inst = st.inst.setdefault(heap, {})
                objarr = st.objarr.setdefault(heap, {})
                prim = st.prim.setdefault(heap, {})
            elif tag == S_CLASS_DUMP:
                fields = s_cls(buf, p)
                super_id = fields[2]
                p += cls_fixed
                static_bytes = 0
                # constant pool: u2 n, [u2 idx, u1 type, value]
                for section in (0, 1, 2):
                    if nbuf - p < 2:
                        buf = refill(buf, p, MIN_AVAIL)
                        p, nbuf = 0, len(buf)
                    cnt, = s_u2(buf, p)
                    p += 2
                    for _ in range(cnt):
                        if nbuf - p < 32 and left:
                            buf = refill(buf, p, 32)
                            p, nbuf = 0, len(buf)
                        if section == 0:      # const pool
                            t = buf[p + 2]
                            p += 3 + elem_size[t]
                        elif section == 1:    # statics: id name, u1 type, value
                            t = buf[p + idsz]
                            sz = elem_size[t]
                            p += idsz + 1 + sz
                            static_bytes += sz
                        else:                 # instance fields: id name, u1 type
                            if super_id == 0:
                                fname = st.strings.get(s_id(buf, p)[0])
                                if fname == b'shadow$_klass_':
                                    st.art = True
                            p += idsz + 1
                    if p > nbuf:
                        raise EOFError
                a = inst.get('class')
                if a is None:
                    inst['class'] = [1, static_bytes]
                else:
                    a[0] += 1
                    a[1] += static_bytes
                n_obj += 1
            else:
                raise HprofError('unknown heap dump sub-record tag 0x%02x (%d bytes left in record)'
                                 % (tag, nbuf - p + left))
        if p != nbuf:
            raise HprofError('heap dump record overrun by %d bytes' % (p - nbuf))
    except (EOFError, struct.error, IndexError, KeyError) as e:
        st.n_objects += n_obj
        return 'truncated/corrupt heap dump (%s: %s)' % (type(e).__name__, e)
    except HprofError as e:
        st.n_objects += n_obj
        # resync on the next top-level record
        if left:
            f.seek(left, 1)
        print('WARNING: %s; rest of this record skipped' % e, file=sys.stderr)
        return None
    st.n_objects += n_obj
    return None


# ---------------------------------------------------------------- reporting

def fmt_bytes(n):
    sign = '-' if n < 0 else ''
    n = abs(n)
    for unit in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or unit == 'GB':
            return ('%s%d %s' % (sign, n, unit)) if unit == 'B' else ('%s%.1f %s' % (sign, n, unit))
        n /= 1024.0


def select_heap(hist, heap):
    if heap == 'all':
        d = {}
        for hd in hist.values():
            for k, (c, b) in hd.items():
                o = d.get(k, (0, 0))
                d[k] = (o[0] + c, o[1] + b)
        return d
    return hist.get(heap, {})


def report(stats, top, heap, obj_header, array_header, out=sys.stdout):
    hists = []
    for st in stats:
        oh = obj_header if obj_header is not None else (0 if st.art else 12)
        ah = array_header if array_header is not None else (12 if st.art else 16)
        hists.append(st.histogram(oh, ah))
        print('%s: %s, id size %d, %d records, %d objects, %.1f s%s, header est. obj %d / array %d%s'
              % (os.path.basename(st.path or '?'), st.version, st.id_size, st.n_records, st.n_objects,
                 st.seconds, ', ART' if st.art else '', oh, ah,
                 ('\n  WARNING: %s — partial results' % st.truncated) if st.truncated else ''), file=out)
    print(file=out)
    # per-heap totals
    heaps = sorted(set(h for hi in hists for h, d in hi.items() if d))
    print('Per-heap totals (count / shallow bytes):', file=out)
    for h in heaps:
        cells = []
        for hi in hists:
            d = hi.get(h, {})
            cells.append('%9d / %10s' % (sum(c for c, _ in d.values()), fmt_bytes(sum(b for _, b in d.values()))))
        print('  %-8s %s' % (h, ' | '.join(cells)), file=out)
    print(file=out)
    sel = [select_heap(hi, heap) for hi in hists]
    if not any(sel):
        print('heap %r not found; available: %s (use --heap all)' % (heap, ', '.join(heaps)), file=out)
        return []
    first, last = sel[0], sel[-1]
    names = set(first) | set(last)
    rows = []
    for n in names:
        c0, b0 = first.get(n, (0, 0))
        c1, b1 = last.get(n, (0, 0))
        rows.append((b1 - b0, c1 - c0, n))
    rows.sort(key=lambda r: (-r[0], r[2]))
    title = 'Top %d classes by shallow-byte growth, heap=%s, %s -> %s' % (
        top, heap, os.path.basename(stats[0].path or '?'), os.path.basename(stats[-1].path or '?'))
    print(title, file=out)
    print('=' * len(title), file=out)
    hdr = '%-60s %11s %9s' % ('class', 'd bytes', 'd count')
    for i in range(len(sel)):
        hdr += ' | %9s %10s' % ('cnt#%d' % i, 'bytes#%d' % i)
    print(hdr, file=out)
    for db, dc, n in rows[:top]:
        line = '%-60s %11s %+9d' % (n if len(n) <= 60 else '...' + n[-57:], fmt_bytes(db), dc)
        for s in sel:
            c, b = s.get(n, (0, 0))
            line += ' | %9d %10s' % (c, fmt_bytes(b))
        print(line, file=out)
    tot0 = sum(b for _, b in first.values())
    tot1 = sum(b for _, b in last.values())
    print('\nTotal %s heap shallow: %s -> %s (%s)' % (heap, fmt_bytes(tot0), fmt_bytes(tot1),
                                                     fmt_bytes(tot1 - tot0)), file=out)
    return rows


# ---------------------------------------------------------------- self test

class _W:
    """Tiny HPROF writer for the self test."""

    def __init__(self, idsz):
        self.idsz = idsz
        self.idf = '>I' if idsz == 4 else '>Q'
        self.out = io.BytesIO()
        self.out.write(b'JAVA PROFILE 1.0.3\0' + struct.pack('>IQ', idsz, 0))
        self.seg = None

    def id(self, v):
        return struct.pack(self.idf, v)

    def rec(self, tag, body):
        self.out.write(struct.pack('>BII', tag, 0, len(body)) + body)

    def string(self, sid, s):
        self.rec(T_STRING, self.id(sid) + s.encode())

    def load_class(self, serial, cid, name_sid):
        self.rec(T_LOAD_CLASS, struct.pack('>I', serial) + self.id(cid) + struct.pack('>I', 0) + self.id(name_sid))

    def begin(self):
        self.seg = io.BytesIO()

    def end(self):
        self.rec(T_HEAP_DUMP_SEGMENT, self.seg.getvalue())
        self.seg = None

    def sub(self, b):
        self.seg.write(b)

    def heap_info(self, hid, name_sid):
        self.sub(bytes([S_HEAP_DUMP_INFO]) + struct.pack('>I', hid) + self.id(name_sid))

    def class_dump(self, cid, super_id, inst_fields, statics=(), cpool=0):
        b = bytes([S_CLASS_DUMP]) + self.id(cid) + struct.pack('>I', 0) + self.id(super_id) + self.id(0) * 5
        b += struct.pack('>I', 0)
        b += struct.pack('>H', cpool) + b''.join(struct.pack('>HB', i, 10) + struct.pack('>i', i)
                                                  for i in range(cpool))
        b += struct.pack('>H', len(statics))
        for sid, t, val in statics:
            b += self.id(sid) + bytes([t]) + val
        b += struct.pack('>H', len(inst_fields))
        for sid, t in inst_fields:
            b += self.id(sid) + bytes([t])
        self.sub(b)

    def instance(self, oid, cid, ln):
        self.sub(bytes([S_INSTANCE]) + self.id(oid) + struct.pack('>I', 0) + self.id(cid)
                 + struct.pack('>I', ln) + b'\xab' * ln)

    def prim_array(self, oid, t, n, nodata=False):
        es = BASIC[t][1] or self.idsz
        self.sub(bytes([S_PRIM_ARRAY_NODATA if nodata else S_PRIM_ARRAY]) + self.id(oid)
                 + struct.pack('>IIB', 0, n, t) + (b'' if nodata else b'\0' * (n * es)))

    def obj_array(self, oid, cid, n):
        self.sub(bytes([S_OBJ_ARRAY]) + self.id(oid) + struct.pack('>II', 0, n) + self.id(cid) + self.id(0) * n)

    def roots(self):
        for tag, (nids, extra) in ROOTS.items():
            self.sub(bytes([tag]) + self.id(0x99) * nids + b'\0' * extra)


def _build_dump(idsz, n_foo, big_len):
    w = _W(idsz)
    names = {1: 'java.lang.Object', 2: 'com.example.Foo', 3: 'java.lang.String[]', 4: 'shadow$_klass_',
             5: 'shadow$_monitor_', 6: 'app', 7: 'zygote', 8: 'value', 9: 'CONST', 10: 'com.example.Big'}
    w.string(1, names[1])
    for sid, s in names.items():
        if sid != 1:
            w.string(sid, s)
    w.load_class(1, 0x100, 1)
    w.load_class(2, 0x200, 2)
    w.load_class(3, 0x300, 3)
    w.load_class(4, 0x400, 10)
    w.rec(0x05, b'\0' * 8)  # unrelated top-level record (STACK TRACE-ish) -> skipped
    # segment 1: zygote heap
    w.begin()
    w.heap_info(ord('Z'), 7)
    w.roots()
    w.class_dump(0x100, 0, [(4, 2), (5, 10)])
    w.class_dump(0x200, 0x100, [(8, 10)], statics=[(9, 11, b'\0' * 8)], cpool=2)
    w.instance(0x1000, 0x200, 12)
    w.end()
    # segment 2: app heap
    w.begin()
    w.heap_info(ord('A'), 6)
    for i in range(n_foo):
        w.instance(0x2000 + i, 0x200, 12)
    w.prim_array(0x3000, 8, 100)               # byte[100]
    w.prim_array(0x3001, 9, 50)                # short[50]
    w.prim_array(0x3002, 5, 7, nodata=True)    # char[7] no data
    w.obj_array(0x3003, 0x300, 3)              # String[3]
    w.instance(0x3004, 0x400, big_len)         # bigger than parse chunk -> seek path
    w.roots()
    w.end()
    w.rec(T_HEAP_DUMP_END, b'')
    return w.out.getvalue()


def self_test():
    ok = True

    def check(cond, msg):
        nonlocal ok
        print('  [%s] %s' % ('ok' if cond else 'FAIL', msg))
        ok = ok and cond

    for idsz in (4, 8):
        for chunk in (CHUNK, 200):  # small chunk exercises refill + seek paths
            print('id size %d, chunk %d:' % (idsz, chunk))
            sts = []
            for n_foo, big in ((3, 5000), (10, 7000)):
                f = io.BytesIO(_build_dump(idsz, n_foo, big))
                st = parse_hprof(f, chunk=chunk)
                st.path = 'synthetic-%d.hprof' % n_foo
                sts.append(st)
                check(st.truncated is None, 'not truncated (%s)' % st.truncated)
                check(st.art, 'ART detected via shadow$_klass_')
                h = st.histogram(0, 12)
                app = h.get('app', {})
                zyg = h.get('zygote', {})
                check(app.get('com.example.Foo') == (n_foo, n_foo * 12), 'Foo app %s' % (app.get('com.example.Foo'),))
                check(zyg.get('com.example.Foo') == (1, 12), 'Foo zygote %s' % (zyg.get('com.example.Foo'),))
                check(app.get('byte[]') == (1, 112), 'byte[] %s' % (app.get('byte[]'),))
                check(app.get('short[]') == (1, 112), 'short[] %s' % (app.get('short[]'),))
                check(app.get('char[]') == (1, 26), 'char[] nodata %s' % (app.get('char[]'),))
                check(app.get('java.lang.String[]') == (1, 3 * idsz + 12), 'String[] %s'
                      % (app.get('java.lang.String[]'),))
                check(app.get('com.example.Big') == (1, big), 'Big %s' % (app.get('com.example.Big'),))
                check(zyg.get('java.lang.Class') == (2, 8), 'Class objects %s' % (zyg.get('java.lang.Class'),))
                check(st.n_objects == 1 + 2 + n_foo + 5, 'object count %d' % st.n_objects)
            buf = io.StringIO()
            rows = report(sts, 5, 'app', None, None, out=buf)
            check(rows and rows[0][2] == 'com.example.Big' and rows[0][0] == 2000, 'diff top = Big +2000')
            foo = [r for r in rows if r[2] == 'com.example.Foo']
            check(foo and foo[0][0] == 84 and foo[0][1] == 7, 'diff Foo +7 / +84 B')
    # truncated file -> partial results, no exception
    data = _build_dump(4, 3, 5000)
    st = parse_hprof(io.BytesIO(data[:-300]))
    check(st.truncated is not None, 'truncated file reported: %s' % st.truncated)
    print('\nexample report:')
    sts = []
    for n in (3, 10):
        s = parse_hprof(io.BytesIO(_build_dump(4, n, 5000 if n == 3 else 7000)))
        s.path = 'synthetic-%d.hprof' % n
        sts.append(s)
    report(sts, 10, 'app', None, None)
    print('\nSELF-TEST %s' % ('PASSED' if ok else 'FAILED'))
    return ok


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('dumps', nargs='*', help='hprof files, oldest first')
    ap.add_argument('--top', type=int, default=40)
    ap.add_argument('--heap', default='app', help='app | image | zygote | default | all (default app)')
    ap.add_argument('--obj-header', type=int, default=None, help='bytes added per instance (default auto)')
    ap.add_argument('--array-header', type=int, default=None, help='bytes added per array (default auto)')
    ap.add_argument('--self-test', action='store_true')
    ap.add_argument('-q', '--quiet', action='store_true', help='no progress output')
    args = ap.parse_args()
    if args.self_test:
        sys.exit(0 if self_test() else 1)
    if not args.dumps:
        ap.error('give at least one hprof file (or --self-test)')
    stats = []
    for p in args.dumps:
        if not args.quiet:
            print('parsing %s (%.1f MB)...' % (p, os.path.getsize(p) / 1e6), file=sys.stderr, flush=True)
        with open(p, 'rb', buffering=1 << 20) as f:
            st = parse_hprof(f, progress=not args.quiet)
        st.path = p
        keep = set(st.class_name_id.values())  # only class names are needed for the report
        st.strings = {k: v for k, v in st.strings.items() if k in keep}
        stats.append(st)
    report(stats, args.top, args.heap, args.obj_header, args.array_header)


if __name__ == '__main__':
    main()
