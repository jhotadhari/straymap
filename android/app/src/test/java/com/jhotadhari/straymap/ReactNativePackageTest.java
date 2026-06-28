package com.jhotadhari.straymap;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import org.junit.Test;

import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;

public class ReactNativePackageTest {

    private final ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
    private final ReactNativePackage reactNativePackage = new ReactNativePackage();

    @Test
    public void getModule_helperName() {
        assertTrue(
                reactNativePackage.getModule(HelperModule.NAME, mockCtx) instanceof HelperModule
        );
    }

    @Test
    public void getModule_fsName() {
        assertTrue(
                reactNativePackage.getModule(FsModule.NAME, mockCtx) instanceof FsModule
        );
    }

    @Test
    public void getModule_unknownName() {
        assertNull(
                reactNativePackage.getModule("UnknownModule", mockCtx)
        );
    }

    @Test
    public void getReactModuleInfoProvider_returnsBoth() throws Exception {
        ReactModuleInfoProvider provider = reactNativePackage.getReactModuleInfoProvider();
        Map<String, ReactModuleInfo> moduleInfos = provider.getReactModuleInfos();

        assertNotNull(moduleInfos.get(HelperModule.NAME));
        assertNotNull(moduleInfos.get(FsModule.NAME));
    }

    @Test
    public void getReactModuleInfoProvider_helperIsTurbo() throws Exception {
        ReactModuleInfoProvider provider = reactNativePackage.getReactModuleInfoProvider();
        Map<String, ReactModuleInfo> moduleInfos = provider.getReactModuleInfos();

        assertTrue(moduleInfos.get(HelperModule.NAME).isTurboModule());
    }

    @Test
    public void getReactModuleInfoProvider_fsIsTurbo() throws Exception {
        ReactModuleInfoProvider provider = reactNativePackage.getReactModuleInfoProvider();
        Map<String, ReactModuleInfo> moduleInfos = provider.getReactModuleInfos();

        assertTrue(moduleInfos.get(FsModule.NAME).isTurboModule());
    }

    @Test
    public void getModule_helperHasCorrectName() {
        HelperModule helperModule = (HelperModule) reactNativePackage.getModule(
                HelperModule.NAME, mockCtx
        );
        assertEquals("HelperModule", helperModule.getName());
    }

    @Test
    public void getModule_fsHasCorrectName() {
        FsModule fsModule = (FsModule) reactNativePackage.getModule(
                FsModule.NAME, mockCtx
        );
        assertEquals("FsModule", fsModule.getName());
    }
}
