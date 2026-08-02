package com.jhotadhari.straymap

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

class BackgroundTaskService : Service() {

    companion object {
        // A single foreground service notification is shared by all features
        // (import, track recording, etc.) via the task registry. No ID range
        // needed — one service, one notification ID.
        const val CHANNEL_ID = "background_task_channel"
        const val NOTIFICATION_ID = 420

        val tasks = ConcurrentHashMap<Int, TaskInfo>()
        val nextTaskId = AtomicInteger(0)

        data class TaskInfo(
            val label: String,
            val maxProgress: Int,
            var progress: Int,
            var detail: String
        )
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onDestroy() {
        tasks.clear()
        super.onDestroy()
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

        // android.R.drawable.ic_menu_upload is a system drawable — not part
        // of the stable public API. It may differ or be missing across OEM
        // skins (Samsung, Xiaomi, etc.). Replace with an app-bundled resource
        // if crash reports surface on specific devices.
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Straymap")
            .setContentText(lines)
            .setSmallIcon(android.R.drawable.ic_menu_upload)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setSubText(detail)

        // The notification progress bar only reflects the first task with
        // maxProgress > 0. Multiple simultaneous progress-tracked tasks are
        // not supported — callers should serialise imports.
        val progressTask = tasks.values.find { it.maxProgress > 0 }
        if (progressTask != null) {
            builder.setProgress(progressTask.maxProgress, progressTask.progress, false)
        } else {
            builder.setProgress(0, 0, true)
        }

        startForeground(NOTIFICATION_ID, builder.build())
    }
}
