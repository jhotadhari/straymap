package com.jhotadhari.straymap

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

class BackgroundTaskService : Service() {

    companion object {
        // A single foreground service notification is shared by all features
        // (import, track recording, etc.) via the task registry. No ID range
        // needed — one service, one notification ID.
        const val CHANNEL_ID = "background_task_channel"
        const val NOTIFICATION_ID = 420

        @JvmField
        val tasks = ConcurrentHashMap<Int, TaskInfo>()
        @JvmField
        val nextTaskId = AtomicInteger(0)
    }

    data class TaskInfo(
        val label: String,
        val maxProgress: Int,
        var progress: Int,
        var detail: String,
        val needsLocation: Boolean
    )

    /**
     * Partial wake lock held while tasks are registered.  Without it the
     * CPU sleeps once the display turns off (Doze) and the JS import
     * loop stalls — a foreground service alone only keeps the PROCESS
     * alive, it does not keep the CPU awake.
     */
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onDestroy() {
        tasks.clear()
        releaseWakeLock()
        // Explicitly remove the notification — stopService() from
        // unregisterTask does not always drop it on every OEM skin.
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    private fun acquireWakeLock() {
        if (wakeLock == null) {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "straymap:backgroundTask"
            ).apply {
                setReferenceCounted(false)
                acquire()
            }
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
            wakeLock = null
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Always call rebuildNotification — it handles tasks.isEmpty() by
        // stopping the service, and on the happy path always calls
        // startForeground() to satisfy the foreground service contract.
        rebuildNotification()
        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Background tasks",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when a long-running task is active (import, track recording)"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun rebuildNotification() {
        if (tasks.isEmpty()) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return
        }

        // Cap displayed tasks to prevent notification text overflow.
        // More than 2 active tasks shows a summary count instead.
        val lines: String = if (tasks.size <= 2) {
            tasks.values.joinToString(", ") { task ->
                if (task.maxProgress > 0) "${task.label} (${task.progress}/${task.maxProgress})"
                else task.label
            }
        } else {
            "${tasks.size} background tasks"
        }

        val detail = tasks.values.find { it.detail.isNotEmpty() }?.detail ?: ""

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // The app's cat-on-bike logo — same artwork as the launcher icon
        // (res/drawable/cat_cycle.xml). Rendered as a flat alpha
        // silhouette by the system.
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Straymap")
            .setContentText(lines)
            .setSmallIcon(R.drawable.cat_cycle)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setSubText(detail)

        // Progress bar only for tasks that report progress (imports).
        // Track recording reports no progress — showing an indeterminate
        // spinner for it just adds visual noise. Only the first
        // progress-tracked task is reflected; callers should serialise
        // imports.
        val progressTask = tasks.values.find { it.maxProgress > 0 }
        if (progressTask != null) {
            builder.setProgress(progressTask.maxProgress, progressTask.progress, false)
        }

        // Foreground service type follows the task registry: a location
        // task (track recording) keeps receiving GNSS fixes while the app
        // is backgrounded — on Android 14+ a location FGS type is the only
        // way to get location updates without ACCESS_BACKGROUND_LOCATION.
        // Re-calling startForeground with the updated type upgrades/
        // downgrades the running service when the flag flips.
        val fgsType = if (tasks.values.any { it.needsLocation }) {
            ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE or
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        } else {
            ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
        }
        ServiceCompat.startForeground(this, NOTIFICATION_ID, builder.build(), fgsType)
    }
}
