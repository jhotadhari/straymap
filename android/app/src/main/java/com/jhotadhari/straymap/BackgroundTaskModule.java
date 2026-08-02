package com.jhotadhari.straymap;

import android.content.Intent;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = BackgroundTaskModule.NAME)
public class BackgroundTaskModule extends NativeBackgroundTaskModuleSpec {

    public static final String NAME = "BackgroundTaskModule";

    public BackgroundTaskModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void registerTask(String label, double maxProgress, Promise promise) {
        try {
            int taskId = BackgroundTaskService.nextTaskId.incrementAndGet();
            BackgroundTaskService.tasks.put(
                taskId,
                new BackgroundTaskService.TaskInfo(label, (int) maxProgress, 0, "")
            );
            sendUpdateIntent();
            promise.resolve(taskId);
        } catch (Exception e) {
            promise.reject("Error", e);
        }
    }

    @ReactMethod
    public void updateTask(double taskId, double progress, String detail, Promise promise) {
        try {
            BackgroundTaskService.TaskInfo task = BackgroundTaskService.tasks.get((int) taskId);
            if (task != null) {
                task.setProgress((int) progress);
                task.setDetail(detail != null ? detail : "");
                sendUpdateIntent();
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("Error", e);
        }
    }

    @ReactMethod
    public void unregisterTask(double taskId, Promise promise) {
        try {
            boolean existed = BackgroundTaskService.tasks.remove((int) taskId) != null;
            if (BackgroundTaskService.tasks.isEmpty()) {
                getReactApplicationContext().stopService(
                    new Intent(getReactApplicationContext(), BackgroundTaskService.class)
                );
            } else if (existed) {
                sendUpdateIntent();
            }
            promise.resolve(existed);
        } catch (Exception e) {
            promise.reject("Error", e);
        }
    }

    private void sendUpdateIntent() {
        Intent intent = new Intent(getReactApplicationContext(), BackgroundTaskService.class);
        intent.putExtra("action", "update");
        getReactApplicationContext().startForegroundService(intent);
    }
}
