package com.jhotadhari.straymap

import android.app.Activity
import android.app.Application
import android.content.ComponentCallbacks2
import android.content.res.Configuration
import android.os.Bundle
import android.os.Debug
import android.os.Process
import android.os.SystemClock
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import kotlin.system.exitProcess

/**
 * Field memory diagnostics for release builds.
 *
 * Appends one CSV row every 30 s (plus one per lifecycle / trim / dump
 * event) to `<externalMediaDir>/logs/mem-YYYYMMDD.csv`, takes a single
 * heap dump per process when the Java heap reaches 85 % of its limit,
 * and dumps (if not done yet) when an OutOfMemoryError reaches the
 * default uncaught exception handler.
 *
 * Every entry point swallows Throwable — the probe must never crash the app.
 */
object MemoryProbe {

    private const val TICK_SEC = 30L
    private const val DUMP_THRESHOLD = 0.85
    // Released in the OOM handler so the oom row + heap dump have some headroom.
    private const val RESERVE_BYTES = 512 * 1024
    private const val HEADER = "time,uptimeSec,pid,event,visible,recording," +
        "javaUsedMB,javaMaxMB,javaPct,nativeAllocMB," +
        "pssTotalMB,pssJavaMB,pssNativeMB,pssGraphicsMB,threads\n"

    private val started = AtomicBoolean(false)
    private val dumpTaken = AtomicBoolean(false)
    private val startedActivities = AtomicInteger(0)
    private val lock = Any()
    // SimpleDateFormat (not java.time, minSdk 24) — only used under `lock`.
    private val timeFmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
    private val dayFmt = SimpleDateFormat("yyyyMMdd", Locale.US)
    private val stampFmt = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US)
    private val csvUnsafe = Regex("[,\"\r\n]")
    private val pid = Process.myPid()
    private var startElapsed = 0L

    @Volatile private var logsDir: String? = null
    @Volatile private var reserve: ByteArray? = null
    @Volatile private var executor: ScheduledExecutorService? = null

    fun start(app: Application) {
        if (!started.compareAndSet(false, true)) return
        try {
            startElapsed = SystemClock.elapsedRealtime()
            @Suppress("DEPRECATION")
            val base: File = app.externalMediaDirs.firstOrNull()
                ?: app.getExternalFilesDir(null)
                ?: return
            val dir = File(base, "logs").apply { mkdirs() }
            logsDir = dir.absolutePath
            reserve = ByteArray(RESERVE_BYTES)
            installOomHandler()
            executor = Executors.newSingleThreadScheduledExecutor { r ->
                Thread(r, "StraymapMemProbe").apply { isDaemon = true }
            }.also {
                it.scheduleWithFixedDelay({ tick() }, TICK_SEC, TICK_SEC, TimeUnit.SECONDS)
            }
            registerCallbacks(app)
            post("start")
        } catch (e: Throwable) {
        }
    }

    // Runs on the probe thread. Must not throw: a throwing task would cancel
    // all further scheduled ticks.
    private fun tick() {
        try {
            writeRow("tick", withPss = true)
            if (!dumpTaken.get() && javaFraction() >= DUMP_THRESHOLD) {
                // used = total - free still counts uncollected garbage — with
                // heavy allocation churn that alone can cross the threshold.
                // Collect first and only dump if the live set is really there.
                Runtime.getRuntime().gc()
                if (javaFraction() >= DUMP_THRESHOLD) dumpHeap("nearlimit", withPss = true)
            }
        } catch (e: Throwable) {
        }
    }

    private fun javaFraction(): Double {
        val rt = Runtime.getRuntime()
        return (rt.totalMemory() - rt.freeMemory()).toDouble() / rt.maxMemory()
    }

    /** At most one heap dump per process (near-limit or OOM, whichever comes first). */
    private fun dumpHeap(kind: String, withPss: Boolean) {
        val dir = logsDir ?: return
        if (!dumpTaken.compareAndSet(false, true)) return
        try {
            val stamp = synchronized(lock) { stampFmt.format(Date()) }
            val name = "heap-$kind-$stamp-pid$pid.hprof"
            writeRow("dump-start:$name", withPss = false)
            val t0 = SystemClock.elapsedRealtime()
            Debug.dumpHprofData("$dir/$name")
            writeRow("dump-done:$name:${SystemClock.elapsedRealtime() - t0}", withPss)
        } catch (e: Throwable) {
            writeRow("dump-failed:${e.javaClass.simpleName} ${e.message}", withPss = false)
        }
    }

    private fun installOomHandler() {
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            try {
                if (isOom(throwable)) {
                    reserve = null
                    writeRow("oom", withPss = false)
                    dumpHeap("oom", withPss = false)
                }
            } catch (e: Throwable) {
            }
            if (previous != null) {
                previous.uncaughtException(thread, throwable)
            } else {
                Process.killProcess(Process.myPid())
                exitProcess(10)
            }
        }
    }

    private fun isOom(t: Throwable): Boolean {
        var cur: Throwable? = t
        var depth = 0
        while (cur != null && depth++ < 32) {
            if (cur is OutOfMemoryError) return true
            cur = cur.cause
        }
        return false
    }

    private fun registerCallbacks(app: Application) {
        app.registerActivityLifecycleCallbacks(object : Application.ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = post("act-created")
            override fun onActivityStarted(activity: Activity) {
                startedActivities.incrementAndGet()
                post("act-started")
            }
            override fun onActivityStopped(activity: Activity) {
                startedActivities.decrementAndGet()
                post("act-stopped")
            }
            override fun onActivityDestroyed(activity: Activity) = post("act-destroyed")
            override fun onActivityResumed(activity: Activity) {}
            override fun onActivityPaused(activity: Activity) {}
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
        })
        app.registerComponentCallbacks(object : ComponentCallbacks2 {
            override fun onTrimMemory(level: Int) = post("trim-$level")
            @Deprecated("Deprecated in Java")
            override fun onLowMemory() = post("lowmem")
            override fun onConfigurationChanged(newConfig: Configuration) {}
        })
    }

    /** Sample + write off the calling (usually main) thread. */
    private fun post(event: String) {
        try {
            executor?.execute { writeRow(event, withPss = true) }
        } catch (e: Throwable) {
        }
    }

    private fun writeRow(event: String, withPss: Boolean) {
        val dir = logsDir ?: return
        try {
            val rt = Runtime.getRuntime()
            val used = rt.totalMemory() - rt.freeMemory()
            val max = rt.maxMemory()
            val pss = if (withPss) samplePss() else ",,,"
            val visible = if (startedActivities.get() > 0) 1 else 0
            val recording = try {
                if (BackgroundTaskService.tasks.values.any { it.needsLocation }) 1 else 0
            } catch (e: Throwable) {
                0
            }
            val threads = try { File("/proc/self/task").list()?.size?.toString() ?: "" } catch (e: Throwable) { "" }
            val uptimeSec = (SystemClock.elapsedRealtime() - startElapsed) / 1000
            val tail = "$uptimeSec,$pid,${event.replace(csvUnsafe, ";")},$visible,$recording," +
                "${mb(used)},${mb(max)},${fmt(used * 100.0 / max)},${mb(Debug.getNativeHeapAllocatedSize())}," +
                "$pss,$threads\n"
            synchronized(lock) {
                val now = Date()
                val file = File(dir, "mem-${dayFmt.format(now)}.csv")
                val isNew = !file.exists() || file.length() == 0L
                FileOutputStream(file, true).use { out ->
                    if (isNew) out.write(HEADER.toByteArray())
                    out.write("${timeFmt.format(now)},$tail".toByteArray())
                }
            }
        } catch (e: Throwable) {
        }
    }

    /** "pssTotalMB,pssJavaMB,pssNativeMB,pssGraphicsMB" — empty fields on failure. */
    private fun samplePss(): String = try {
        val mi = Debug.MemoryInfo()
        Debug.getMemoryInfo(mi)
        fun stat(key: String) = mi.getMemoryStat(key)?.trim()?.toLongOrNull()?.let { fmt(it / 1024.0) } ?: ""
        listOf(
            fmt(mi.totalPss / 1024.0),
            stat("summary.java-heap"),
            stat("summary.native-heap"),
            stat("summary.graphics"),
        ).joinToString(",")
    } catch (e: Throwable) {
        ",,,"
    }

    private fun mb(bytes: Long) = fmt(bytes / 1048576.0)

    private fun fmt(v: Double) = String.format(Locale.US, "%.1f", v)
}
