#!/usr/bin/env python3
"""Periodic Java heap dumps + memory logs of com.jhotadhari.straymap.

Every --every-min minutes (first one at t=0) until --total-min:
  * `am dumpheap -g <pkg> /data/local/tmp/straymap-heap-<NN>-<HHMMSS>.hprof`
    (-g = force GC first), wait until the file size is stable for 3 polls
    1 s apart (timeout 120 s), then `adb pull` it into --out
  * `dumpsys meminfo <pkg>`               -> <out>/meminfo-<NN>.txt
  * MemoryProbe logs dir (mem-*.csv every time; heap-*.hprof written by the
    probe itself are pulled only once / when their size changed)  -> <out>/logs/
Between dumps the app pid is polled (pidof); pid changes / disappearance are
written to <out>/run.log (a restart means crash or kill).
At the end (also on Ctrl-C): logs again, `logcat -d -b crash` and the
straymap-related am_kill/am_proc_died/... lines of `logcat -d -b events`.

Device files are NEVER deleted by this script. At the end it prints the list of
files it created under /data/local/tmp and the `adb shell rm ...` command you
may run yourself.

Device-side effects: creates the hprof files in /data/local/tmp (~heap size
each, e.g. 8 x 100-300 MB -> check free space: `adb shell df -h /data`) and
forces a GC in the app before each dump (the app freezes for a few seconds).
"""
import argparse
import os
import re
import shlex
import shutil
import signal
import subprocess
import sys
import time
from datetime import datetime

PKG = 'com.jhotadhari.straymap'
DEVICE_DIR = '/data/local/tmp'
LOGS_DIR = '/storage/emulated/0/Android/media/%s/logs' % PKG
EVENTS_RE = re.compile(r'am_kill|am_proc_died|am_proc_start|wm_destroy_activity|am_crash|am_low_memory')


class Terminate(Exception):
    pass


class Runner:
    def __init__(self, args):
        self.adb = ['adb'] + (['-s', args.adb_serial] if args.adb_serial else [])
        self.dry = args.dry_run
        self.out = args.out
        self.log_f = None
        self.dry_counter = 0

    # ---- logging -------------------------------------------------------
    def open_log(self):
        os.makedirs(self.out, exist_ok=True)
        self.log_f = open(os.path.join(self.out, 'run.log'), 'a', encoding='utf-8')

    def log(self, msg):
        line = '%s %s' % (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), msg)
        print(('[DRY] ' if self.dry else '') + line, flush=True)
        if self.log_f:
            self.log_f.write(line + '\n')
            self.log_f.flush()

    # ---- adb -----------------------------------------------------------
    def adb_run(self, argv, timeout=60, capture=True, dry_result=''):
        """Run adb <argv>; returns (rc, stdout_text). In dry-run only prints."""
        if self.dry:
            print('DRY  %s' % ' '.join(shlex.quote(a) for a in self.adb + argv), flush=True)
            return 0, dry_result
        try:
            r = subprocess.run(self.adb + argv, stdout=subprocess.PIPE if capture else None,
                               stderr=subprocess.STDOUT if capture else None, timeout=timeout)
        except subprocess.TimeoutExpired:
            return -1, 'timeout after %ss' % timeout
        out = r.stdout.decode('utf-8', 'replace') if capture and r.stdout is not None else ''
        return r.returncode, out

    def shell(self, cmd, timeout=60, dry_result=''):
        return self.adb_run(['shell', cmd], timeout=timeout, dry_result=dry_result)

    def pidof(self):
        if self.dry:
            self.adb_run(['shell', 'pidof %s' % PKG])
            return '12345'
        rc, out = self.shell('pidof %s' % PKG, timeout=20)
        out = out.strip()
        return out if rc == 0 and out else None

    def remote_size(self, path):
        if self.dry:
            self.dry_counter += 1
            self.shell('stat -c %%s %s' % shlex.quote(path))
            return 1000
        rc, out = self.shell('stat -c %%s %s' % shlex.quote(path), timeout=20)
        try:
            return int(out.strip()) if rc == 0 else None
        except ValueError:
            return None


def wait_stable(r, path, timeout=120.0, polls=3):
    """Wait until remote file size is >0 and unchanged for `polls` consecutive 1 s polls."""
    t0 = time.monotonic()
    last, same = None, 0
    while time.monotonic() - t0 < timeout:
        size = r.remote_size(path)
        if size is not None and size > 0 and size == last:
            same += 1
            if same >= polls - 1:  # 3 consecutive equal readings
                return size
        else:
            same = 0
        last = size
        if r.dry and same >= polls - 1:
            return size
        time.sleep(0 if r.dry else 1.0)
    return None


def pull_logs(r, state):
    """Pull MemoryProbe logs: CSVs every time, other (big) files only when new/changed."""
    dest = os.path.join(r.out, 'logs')
    os.makedirs(dest, exist_ok=True)
    rc, out = r.shell('ls -l %s/ 2>/dev/null' % LOGS_DIR, timeout=30,
                      dry_result='-rw-rw---- 1 u0_a1 media_rw 1234 2026-11-12 10:00 mem-20261112.csv\n')
    if rc != 0 or not out.strip():
        r.log('logs: %s missing or empty (ignored)' % LOGS_DIR)
        return
    pulled, skipped = [], []
    for line in out.splitlines():
        parts = line.split()
        if len(parts) < 8 or not parts[0].startswith('-'):
            continue
        name = parts[-1]
        try:
            size = int(parts[4])
        except ValueError:
            size = None
        is_csv = name.endswith('.csv') or name.endswith('.txt')
        if not is_csv and state.get(name) == size and os.path.exists(os.path.join(dest, name)):
            skipped.append(name)
            continue
        rc2, o2 = r.adb_run(['pull', '%s/%s' % (LOGS_DIR, name), os.path.join(dest, name)], timeout=600)
        if rc2 == 0:
            state[name] = size
            pulled.append(name)
            if name.endswith('.hprof'):
                r.log('logs: NOTE app-written heap dump %s (%s bytes) pulled — the probe wrote it because '
                      'the heap neared its limit or OOMed' % (name, size))
        else:
            r.log('logs: pull %s failed: %s' % (name, o2.strip()))
    r.log('logs: pulled %d file(s)%s' % (len(pulled), (', unchanged skipped: %s' % ', '.join(skipped))
                                         if skipped else ''))


def save_meminfo(r, nn):
    rc, out = r.shell('dumpsys meminfo %s' % PKG, timeout=60, dry_result='  TOTAL PSS:   123456 ...\n')
    path = os.path.join(r.out, 'meminfo-%s.txt' % nn)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(out)
    summary = [l.strip() for l in out.splitlines()
               if re.match(r'\s*(Java Heap|Native Heap|Graphics|TOTAL PSS|TOTAL)\b', l)]
    r.log('meminfo-%s: %s' % (nn, ' | '.join(re.sub(r'\s+', ' ', s) for s in summary[:5]) or '(rc=%s)' % rc))


def do_dump(r, nn, device_files):
    stamp = datetime.now().strftime('%H%M%S')
    remote = '%s/straymap-heap-%s-%s.hprof' % (DEVICE_DIR, nn, stamp)
    pid = r.pidof()
    if not pid:
        r.log('dump %s: app not running, skipping heap dump' % nn)
        return
    t0 = time.monotonic()
    rc, out = r.shell('am dumpheap -g %s %s' % (PKG, remote), timeout=300)
    if out.strip():
        r.log('dump %s: am dumpheap says: %s' % (nn, out.strip().replace('\n', ' / ')))
    if rc != 0:
        r.log('dump %s: am dumpheap failed rc=%s' % (nn, rc))
    device_files.append(remote)  # list it even if incomplete, so the rm hint covers it
    size = wait_stable(r, remote)
    if size is None:
        r.log('dump %s: %s did not become stable within 120 s — skipping pull' % (nn, remote))
        return
    r.log('dump %s: %s complete, %.1f MB, %.1f s (pid %s)' % (nn, remote, size / 1e6, time.monotonic() - t0, pid))
    local = os.path.join(r.out, os.path.basename(remote))
    t1 = time.monotonic()
    rc, out = r.adb_run(['pull', remote, local], timeout=900)
    if rc != 0:
        r.log('dump %s: pull failed: %s' % (nn, out.strip()))
        return
    lsize = None if r.dry else os.path.getsize(local)
    r.log('dump %s: pulled -> %s (%s bytes, %.1f s)%s' % (
        nn, local, lsize, time.monotonic() - t1,
        '' if r.dry or lsize == size else '  WARNING size mismatch vs device %s' % size))


def final_collect(r, logs_state):
    pull_logs(r, logs_state)
    rc, out = r.adb_run(['logcat', '-d', '-b', 'crash'], timeout=60)
    with open(os.path.join(r.out, 'logcat-crash.txt'), 'w', encoding='utf-8') as f:
        f.write(out)
    straymap_crash = sum(1 for l in out.splitlines() if 'straymap' in l)
    rc, out = r.adb_run(['logcat', '-d', '-b', 'events'], timeout=60)
    ev = [l for l in out.splitlines() if EVENTS_RE.search(l) and 'straymap' in l]
    with open(os.path.join(r.out, 'logcat-events-straymap.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(ev) + ('\n' if ev else ''))
    r.log('logcat: crash buffer lines mentioning straymap: %d; straymap process events: %d'
          % (straymap_crash, len(ev)))
    for l in ev[-15:]:
        r.log('  event: %s' % l.strip())


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--every-min', type=float, default=5.0)
    ap.add_argument('--total-min', type=float, default=35.0)
    ap.add_argument('--out', default=None, help='default /tmp/opencode/memtest/<run-timestamp>/')
    ap.add_argument('--pid-check', type=float, default=15.0, metavar='SEC',
                    help='poll pidof every SEC seconds between dumps (0 = only at dumps; default 15)')
    ap.add_argument('--dry-run', action='store_true', help='print adb commands instead of running them')
    ap.add_argument('--adb-serial', default=None)
    args = ap.parse_args()
    if args.out is None:
        args.out = os.path.join('/tmp/opencode/memtest', datetime.now().strftime('%Y%m%d-%H%M%S'))

    r = Runner(args)
    r.open_log()

    def on_signal(signum, _frame):
        raise Terminate(signal.Signals(signum).name)

    signal.signal(signal.SIGTERM, on_signal)
    if hasattr(signal, 'SIGHUP'):
        signal.signal(signal.SIGHUP, on_signal)

    n_dumps = int(args.total_min // args.every_min) + 1 if args.every_min > 0 else 1
    r.log('start: %s, %d dumps every %.1f min over %.1f min -> %s'
          % (PKG, n_dumps, args.every_min, args.total_min, os.path.abspath(args.out)))
    r.log('device effects: hprof files in %s (not deleted), forced GC per dump' % DEVICE_DIR)

    device_files = []
    logs_state = {}
    last_pid = r.pidof()
    r.log('pid at start: %s' % last_pid)
    if not last_pid:
        r.log('WARNING: app is not running')

    def check_pid(where):
        nonlocal last_pid
        pid = r.pidof()
        if pid != last_pid:
            r.log('PID CHANGE (%s): %s -> %s  %s' % (where, last_pid, pid,
                  'app died (crash/kill)' if not pid else
                  ('app (re)started' if not last_pid else 'PROCESS RESTARTED (crash or kill)')))
            last_pid = pid

    t0 = time.monotonic()
    reason = 'done'
    try:
        for k in range(n_dumps):
            target = t0 + k * args.every_min * 60.0
            # wait for the slot, polling the pid
            while True:
                now = time.monotonic()
                if now >= target or r.dry:
                    break
                time.sleep(min(args.pid_check if args.pid_check > 0 else 1e9, target - now))
                if args.pid_check > 0:
                    check_pid('poll')
            lateness = time.monotonic() - target
            nn = '%02d' % k
            r.log('--- dump %s at t=%.1f min%s' % (nn, (time.monotonic() - t0) / 60.0,
                                                  ' (%.0f s late, previous dump was slow)' % lateness
                                                  if lateness > 30 else ''))
            check_pid('dump %s' % nn)
            save_meminfo(r, nn)
            do_dump(r, nn, device_files)
            pull_logs(r, logs_state)
    except KeyboardInterrupt:
        reason = 'SIGINT'
    except Terminate as e:
        reason = str(e)
    finally:
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        r.log('stopping (%s) after %.1f min — final collection' % (reason, (time.monotonic() - t0) / 60.0))
        try:
            check_pid('end')
            final_collect(r, logs_state)
        except Exception as e:  # never lose the cleanup hint
            r.log('final collection error: %r' % e)
        r.log('local results: %s' % os.path.abspath(args.out))
        if device_files:
            r.log('device files created (NOT deleted):')
            for p in device_files:
                r.log('  %s' % p)
            r.log('to delete them yourself, run:')
            r.log('  adb%s shell rm %s' % ((' -s %s' % args.adb_serial) if args.adb_serial else '',
                                         ' '.join(device_files)))
        app_hprofs = [n for n in logs_state if n.endswith('.hprof')]
        if app_hprofs:
            r.log('app-written heap dumps in %s (also not deleted):' % LOGS_DIR)
            r.log('  adb shell rm %s' % ' '.join('%s/%s' % (LOGS_DIR, n) for n in app_hprofs))
        if r.log_f:
            r.log_f.close()


if __name__ == '__main__':
    main()
