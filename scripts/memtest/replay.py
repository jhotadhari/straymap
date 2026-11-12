#!/usr/bin/env python3
"""Replay a recorded track as mock GNSS fixes into the device `gps` provider.

Uses the Android 13 shell location test-provider commands over ONE persistent
`adb shell` process (commands are written to its stdin, one per line).

DEVICE STATE CHANGED (unless --no-setup):
  * appops: com.android.shell android:mock_location -> allow
  * a test provider named `gps` is added + enabled; it REPLACES the real GPS
    provider for every app until it is removed.
REVERTED ON EXIT (finally / SIGINT / SIGTERM / SIGHUP, unless --keep-provider):
  * `cmd location providers remove-test-provider gps`
  * appops mock_location restored to the mode found at start
    (usually `default`).

Each fix uses the CURRENT wall-clock epoch ms as --time (not the recorded
timestamp) so the app's min-time filter sees real time.

Examples:
  ./replay.py                                  # 35 min, 1 fix/s, 4 points/fix
  ./replay.py --dry-run --duration-min 0.1 --interval 0.2 --status-every 1
"""
import argparse
import csv
import os
import shlex
import signal
import subprocess
import sys
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
PROVIDER = 'gps'
SHELL_PKG = 'com.android.shell'


class Terminate(Exception):
    pass


def load_track(path):
    pts = []
    with open(path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            pts.append((int(row['idx']), float(row['lat']), float(row['lng'])))
    if not pts:
        sys.exit('no points in %s' % path)
    return pts


class AdbShell:
    """One persistent `adb shell` whose stdin receives command lines."""

    def __init__(self, adb_base, dry_run):
        self.adb_base = adb_base
        self.dry_run = dry_run
        self.proc = None
        self.restarts = 0
        self.err_lines = 0
        self.last_err = None

    def _drain(self, proc):
        # Keep stdout (merged stderr) drained so the pipe never blocks;
        # the location commands print nothing on success, so anything that
        # arrives is likely an error -> count it and show the first few.
        for raw in iter(proc.stdout.readline, b''):
            line = raw.decode('utf-8', 'replace').rstrip()
            if not line:
                continue
            self.err_lines += 1
            self.last_err = line
            if self.err_lines <= 10:
                print('[adb shell] %s' % line, file=sys.stderr, flush=True)
            elif self.err_lines == 11:
                print('[adb shell] (further output suppressed, counted in status)', file=sys.stderr, flush=True)

    def start(self):
        if self.dry_run:
            return
        self.proc = subprocess.Popen(self.adb_base + ['shell'], stdin=subprocess.PIPE,
                                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=0,
                                     start_new_session=True)  # terminal Ctrl-C only hits us
        threading.Thread(target=self._drain, args=(self.proc,), daemon=True).start()

    def alive(self):
        return self.dry_run or (self.proc is not None and self.proc.poll() is None)

    def send(self, cmd):
        if self.dry_run:
            print('DRY  adb shell> %s' % cmd)
            return
        for attempt in (1, 2):
            if not self.alive():
                rc = None if self.proc is None else self.proc.returncode
                print('[replay] adb shell died (rc=%s), restarting...' % rc, file=sys.stderr, flush=True)
                self.restarts += 1
                time.sleep(1.0)
                self.start()
            try:
                self.proc.stdin.write((cmd + '\n').encode())
                self.proc.stdin.flush()
                return
            except (BrokenPipeError, OSError) as e:
                print('[replay] write failed (%s)' % e, file=sys.stderr, flush=True)
                try:
                    self.proc.kill()
                except OSError:
                    pass
                self.proc.wait()
        print('[replay] could not send command, skipping this fix', file=sys.stderr, flush=True)

    def close(self):
        if self.dry_run or self.proc is None:
            return
        try:
            self.proc.stdin.write(b'exit\n')
            self.proc.stdin.flush()
            self.proc.stdin.close()
            self.proc.wait(timeout=5)
        except Exception:
            self.proc.kill()


def run_once(adb_base, cmd, dry_run, check=False):
    """Run one `adb shell <cmd>` synchronously (used for setup / teardown)."""
    if dry_run:
        print('DRY  adb shell %s' % cmd)
        return 0, ''
    r = subprocess.run(adb_base + ['shell', cmd], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=30)
    out = r.stdout.decode('utf-8', 'replace').strip()
    if check and r.returncode != 0:
        raise RuntimeError('adb shell %s failed (%d): %s' % (cmd, r.returncode, out))
    return r.returncode, out


def get_mock_location_mode(adb_base, dry_run):
    if dry_run:
        return 'default'
    _, out = run_once(adb_base, 'appops get %s android:mock_location' % SHELL_PKG, False)
    # e.g. "MOCK_LOCATION: allow; time=+1m2s ago" or "No operations."
    for line in out.splitlines():
        if line.strip().upper().startswith('MOCK_LOCATION:'):
            return line.split(':', 1)[1].split(';', 1)[0].strip()
    if 'No operations' in out:
        return 'default'
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--csv', default=os.path.join(HERE, 'track4.csv'))
    ap.add_argument('--interval', type=float, default=1.0, help='seconds between fixes (default 1.0)')
    ap.add_argument('--step', type=int, default=4, help='track points advanced per fix (default 4)')
    ap.add_argument('--start-idx', type=int, default=0)
    ap.add_argument('--duration-min', type=float, default=35.0)
    ap.add_argument('--accuracy', type=float, default=5.0)
    ap.add_argument('--at-end', choices=('reverse', 'loop', 'stop'), default='reverse',
                    help='what to do at the track end: reverse direction (default, no jump), '
                         'loop back to idx 0 (position jump) or stop')
    ap.add_argument('--status-every', type=float, default=30.0, help='status line interval in s')
    ap.add_argument('--no-setup', action='store_true', help='skip appops + add/enable test provider')
    ap.add_argument('--keep-provider', action='store_true', help='do NOT remove the test provider on exit')
    ap.add_argument('--dry-run', action='store_true', help='print commands instead of running adb')
    ap.add_argument('--adb-serial', default=None)
    args = ap.parse_args()

    if args.step < 1:
        sys.exit('--step must be >= 1')
    pts = load_track(args.csv)
    n = len(pts)
    if not 0 <= args.start_idx < n:
        sys.exit('--start-idx must be in 0..%d' % (n - 1))

    adb_base = ['adb'] + (['-s', args.adb_serial] if args.adb_serial else [])
    tag = '[replay]%s' % (' [DRY-RUN]' if args.dry_run else '')

    print('%s track %s: %d points; start idx %d, step %d, interval %.2fs, duration %.1f min, accuracy %.1fm'
          % (tag, args.csv, n, args.start_idx, args.step, args.interval, args.duration_min, args.accuracy))
    print('%s DEVICE STATE CHANGES:' % tag)
    if args.no_setup:
        print('%s   --no-setup: assumes test provider "%s" already exists and is enabled' % (tag, PROVIDER))
    else:
        print('%s   * appops %s android:mock_location -> allow' % (tag, SHELL_PKG))
        print('%s   * add + enable test provider "%s" (replaces the real GPS for ALL apps)' % (tag, PROVIDER))
    if args.keep_provider:
        print('%s   --keep-provider: provider is NOT removed on exit. Remove manually with:' % tag)
        print('%s     adb shell cmd location providers remove-test-provider %s' % (tag, PROVIDER))
    else:
        print('%s REVERTED ON EXIT (also on Ctrl-C / SIGTERM): remove test provider "%s"%s'
              % (tag, PROVIDER, '' if args.no_setup else ', restore appops mock_location mode'))
    sys.stdout.flush()

    def on_signal(signum, _frame):
        raise Terminate(signal.Signals(signum).name)

    signal.signal(signal.SIGTERM, on_signal)
    if hasattr(signal, 'SIGHUP'):
        signal.signal(signal.SIGHUP, on_signal)

    shell = AdbShell(adb_base, args.dry_run)
    orig_mode = None
    provider_added = False
    sent = 0
    idx = args.start_idx
    direction = 1
    t0 = time.monotonic()
    reason = 'duration reached'
    try:
        if not args.no_setup:
            orig_mode = get_mock_location_mode(adb_base, args.dry_run)
            print('%s appops mock_location mode before: %s' % (tag, orig_mode))
            run_once(adb_base, 'appops set %s android:mock_location allow' % SHELL_PKG, args.dry_run, check=True)
            provider_added = True  # set before add so a partial add is still cleaned up
            run_once(adb_base, 'cmd location providers add-test-provider %s --requiresSatellite '
                               '--supportsAltitude --supportsSpeed --supportsBearing' % PROVIDER,
                     args.dry_run, check=True)
            run_once(adb_base, 'cmd location providers set-test-provider-enabled %s true' % PROVIDER,
                     args.dry_run, check=True)
        shell.start()

        end = t0 + args.duration_min * 60.0
        next_status = t0
        next_fix = t0
        while True:
            now = time.monotonic()
            if now >= end:
                break
            _, lat, lng = pts[idx]
            shell.send('cmd location providers set-test-provider-location %s --location %.7f,%.7f '
                       '--accuracy %s --time %d' % (PROVIDER, lat, lng, args.accuracy, int(time.time() * 1000)))
            sent += 1
            if now >= next_status:
                el = now - t0
                print('%s %02d:%02d elapsed  fixes %d  idx %d/%d  lat %.6f lng %.6f%s%s'
                      % (tag, int(el // 60), int(el % 60), sent, idx, n - 1, lat, lng,
                         '' if direction > 0 else '  (reversed)',
                         ('  adb-output-lines %d restarts %d' % (shell.err_lines, shell.restarts))
                         if (shell.err_lines or shell.restarts) else ''), flush=True)
                next_status += args.status_every
            # advance
            nxt = idx + direction * args.step
            if nxt >= n or nxt < 0:
                if args.at_end == 'stop':
                    reason = 'end of track'
                    break
                if args.at_end == 'loop':
                    nxt = 0 if direction > 0 else n - 1
                else:
                    direction = -direction
                    nxt = max(0, min(n - 1, idx + direction * args.step))
                    print('%s end of track reached, reversing direction' % tag, flush=True)
            idx = nxt
            # absolute schedule -> no drift
            next_fix += args.interval
            delay = next_fix - time.monotonic()
            if delay > 0:
                time.sleep(delay)
            else:
                next_fix = time.monotonic()
    except KeyboardInterrupt:
        reason = 'SIGINT'
    except Terminate as e:
        reason = str(e)
    finally:
        # ignore further signals while cleaning up
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        shell.close()
        el = time.monotonic() - t0
        print('%s stopping (%s) after %.1f s, %d fixes sent, last idx %d' % (tag, reason, el, sent, idx))
        if not args.keep_provider:
            if provider_added or args.no_setup:
                rc, out = run_once(adb_base, 'cmd location providers remove-test-provider %s' % PROVIDER,
                                   args.dry_run)
                print('%s removed test provider %s (rc=%s)%s' % (tag, PROVIDER, rc, (': ' + out) if out else ''))
            if orig_mode is not None and orig_mode != 'allow':
                rc, out = run_once(adb_base, 'appops set %s android:mock_location %s'
                                   % (SHELL_PKG, shlex.quote(orig_mode)), args.dry_run)
                print('%s restored appops mock_location -> %s (rc=%s)%s'
                      % (tag, orig_mode, rc, (': ' + out) if out else ''))
            elif orig_mode is None and not args.no_setup:
                print('%s NOTE: could not read the original mock_location mode; it stays "allow". Reset with:\n'
                      '%s   adb shell appops set %s android:mock_location default' % (tag, tag, SHELL_PKG))
        else:
            print('%s test provider kept. Remove later: adb shell cmd location providers remove-test-provider %s'
                  % (tag, PROVIDER))


if __name__ == '__main__':
    main()
