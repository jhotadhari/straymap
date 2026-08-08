package com.jhotadhari.straymap;

import android.content.Intent;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = TrackingModule.NAME)
public class TrackingModule extends NativeTrackingModuleSpec {

    public static final String NAME = "TrackingModule";

    public TrackingModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void startService(Promise promise) {
        try {
            Intent intent = new Intent(getReactApplicationContext(), TrackingService.class);
            getReactApplicationContext().startForegroundService(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("Error", e);
        }
    }

    @ReactMethod
    public void stopService(Promise promise) {
        try {
            Intent intent = new Intent(getReactApplicationContext(), TrackingService.class);
            getReactApplicationContext().stopService(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("Error", e);
        }
    }
}
