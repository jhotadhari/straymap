package com.jhotadhari.straymap;

import com.facebook.react.BaseReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.HashMap;
import java.util.Map;

public class ReactNativePackage extends BaseReactPackage {

    @Override
    public NativeModule getModule(String name, ReactApplicationContext reactContext) {
        if (name.equals(HelperModule.NAME)) {
            return new HelperModule(reactContext);
        } else if (name.equals(FsModule.NAME)) {
            return new FsModule(reactContext);
        } else {
            return null;
        }
    }

    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
        return () -> {
            Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
            moduleInfos.put(
                HelperModule.NAME,
                new ReactModuleInfo(
                    HelperModule.NAME,
                    HelperModule.NAME,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    false, // isCxxModule
                    true   // isTurboModule
                )
            );
            moduleInfos.put(
                FsModule.NAME,
                new ReactModuleInfo(
                    FsModule.NAME,
                    FsModule.NAME,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    false, // isCxxModule
                    true   // isTurboModule
                )
            );
            return moduleInfos;
        };
    }

}
