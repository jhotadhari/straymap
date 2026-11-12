# memtest — 30-minute memory test of com.jhotadhari.straymap

Host-side tooling (Python 3, stdlib only) to drive the app with a replayed GNSS
track while taking periodic Java heap dumps, then diff class histograms.

| File               | Purpose                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| `extract_track.py` | Parse a SpatiaLite LINESTRING blob from a DB copy → `track4.csv` (+ `--gpx`) |
| `replay.py`        | Feed the track as mock fixes into the device `gps` test provider             |
| `heapdumps.py`     | `am dumpheap -g` every 5 min + `dumpsys meminfo` + MemoryProbe logs + logcat |
| `analyze_hprof.py` | Streaming HPROF class histogram + growth diff (`--self-test` included)       |

All scripts support `--help`; `replay.py` / `heapdumps.py` support `--dry-run`
(print adb commands only) and `--adb-serial SERIAL`.

`track4.csv` / `track4.gpx` contain a real recorded ride (location data) and are
git-ignored — don't commit them.

## 0. Preparation (once)

```sh
cd scripts/memtest
# already done: track4.csv from track 4 (line 2115) of the DB copy
./extract_track.py --db /tmp/opencode/straymap2.db --line-id 2115 --track-id 4 --gpx
./analyze_hprof.py --self-test            # parser sanity check
adb shell df -h /data                     # need ~8 x heap size (≈1–2.5 GB) free in /data/local/tmp
```

The device must be the LineageOS **userdebug** build (`am dumpheap` on a
non-debuggable release app only works there). The mock fixes go to the
`gps` provider of `LocationManager`; the app must be using that provider
(no fused/Play-services provider).

## 1. Install the build under test

```sh
adb install -r path/to/app.apk           # in-place update, keeps data
```

(Debug builds must be signed with the release keystore — `. set-env stray --no-tty`
before `./gradlew :app:assembleDebug` — never uninstall to switch signatures.)

## 2. Prepare the app

1. Start straymap, wait until the map is shown.
2. Set up the dashboard widgets you want to test (e.g. center altitude, speed, …).
3. Start **terminal A** (step 3) first, so the app gets mock fixes, then
   start track **recording** and enable **GNSS center mode** (map follows the
   position).

## 3. Run (two terminals, from `scripts/memtest/`)

**Terminal A — GNSS replay** (35 min, 1 fix/s, 4 track points per fix ≈ 4× ride speed):

```sh
./replay.py
# options: --interval 1.0 --step 4 --start-idx 0 --duration-min 35 --accuracy 5
#          --at-end reverse|loop|stop   --no-setup   --keep-provider
```

On start it changes device state: `appops set com.android.shell
android:mock_location allow`, adds + enables the test provider `gps` (replaces
the real GPS for all apps). On exit — normal end, Ctrl-C, SIGTERM, SIGHUP —
it removes the test provider and restores the previous appops mode.
A status line is printed every 30 s.

**Terminal B — heap dumps** (start once recording is running):

```sh
./heapdumps.py
# options: --every-min 5 --total-min 35 --out /tmp/opencode/memtest/<run-timestamp>/ --pid-check 15
```

Dumps at t = 0, 5, …, 35 min (8 dumps). Each dump forces a GC and freezes the
app for a few seconds. Results go to `/tmp/opencode/memtest/<timestamp>/`:
`straymap-heap-NN-HHMMSS.hprof`, `meminfo-NN.txt`, `logs/` (MemoryProbe
`mem-*.csv`; probe-written `heap-nearlimit-*` / `heap-oom-*.hprof` are pulled
once), `run.log` (pid changes = crash/kill), `logcat-crash.txt`,
`logcat-events-straymap.txt`. Ctrl-C stops early but still does the final
collection.

## 4. During the run

Repeatedly, over the 30 minutes:

- turn the screen off for a few minutes and on again,
- switch to other apps (browser with several heavy tabs, camera, gallery, a
  game…) to push the system into memory pressure, then return to straymap,
- check that recording keeps going and the map keeps following.

Watch terminal B for `PID CHANGE` (process died / restarted).

## 5. Analyze

```sh
D=/tmp/opencode/memtest/<timestamp>
./analyze_hprof.py $D/straymap-heap-*.hprof --top 40 --heap app
# just first vs last:  ./analyze_hprof.py $D/straymap-heap-00-*.hprof $D/straymap-heap-07-*.hprof
# all heaps:           --heap all
```

Prints per-heap totals per dump and the top classes by shallow-byte growth
between the first and last dump given, with count/bytes for every dump.
Sizes are shallow estimates (see `--help` for header assumptions).
Also look at `logs/mem-*.csv` (Java used/max, native, PSS over time) and
`run.log`. For retained-size / path-to-GC-root analysis open the hprof in
Android Studio's profiler (File → Open) — `analyze_hprof.py` only does shallow
histograms.

## 6. Cleanup on the device (manual)

`heapdumps.py` never deletes device files; at the end it prints the exact
command, e.g.:

```sh
adb shell rm /data/local/tmp/straymap-heap-00-123000.hprof /data/local/tmp/straymap-heap-01-123500.hprof ...
```

If the MemoryProbe wrote its own dumps, also (command printed too):

```sh
adb shell rm /storage/emulated/0/Android/media/com.jhotadhari.straymap/logs/heap-*.hprof
```

If `replay.py` was killed hard (SIGKILL) and could not clean up:

```sh
adb shell cmd location providers remove-test-provider gps
adb shell appops set com.android.shell android:mock_location default
```
