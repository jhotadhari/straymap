package com.jhotadhari.straymap;

import android.content.pm.ApplicationInfo;

import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.mockito.ArgumentCaptor;

import java.io.File;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@RunWith(JUnit4.class)
public class HelperModuleTest {

    @Rule
    public TemporaryFolder tempFolder = new TemporaryFolder();

    /**
     * Test-friendly subclass that uses JavaOnlyMap/JavaOnlyArray instead of
     * WritableNativeMap/WritableNativeArray so tests can run on the JVM without
     * Android native code.
     */
    static class TestHelperModule extends HelperModule {
        TestHelperModule(ReactApplicationContext ctx) {
            super(ctx);
        }

        @Override
        protected WritableMap createMap() {
            return new JavaOnlyMap();
        }

        @Override
        protected WritableArray createArray() {
            return new JavaOnlyArray();
        }
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private ReactApplicationContext createMockContext(
            String dataDir,
            File[] externalMediaDirs,
            File[] externalFilesDirs,
            File[] externalCacheDirs,
            File internalCacheDir
    ) {
        ReactApplicationContext ctx = mock(ReactApplicationContext.class);

        ApplicationInfo appInfo = mock(ApplicationInfo.class);
        appInfo.dataDir = dataDir;
        when(ctx.getApplicationInfo()).thenReturn(appInfo);

        when(ctx.getExternalMediaDirs()).thenReturn(
                externalMediaDirs != null ? externalMediaDirs : new File[0]);
        when(ctx.getExternalFilesDirs(null)).thenReturn(
                externalFilesDirs != null ? externalFilesDirs : new File[0]);
        when(ctx.getExternalCacheDirs()).thenReturn(
                externalCacheDirs != null ? externalCacheDirs : new File[0]);
        when(ctx.getCacheDir()).thenReturn(
                internalCacheDir != null ? internalCacheDir : mock(File.class));

        return ctx;
    }

    private WritableMap invokeGetAppDirs(
            String dataDir,
            File[] externalMediaDirs,
            File[] externalFilesDirs,
            File[] externalCacheDirs,
            File internalCacheDir,
            Promise promise
    ) {
        ReactApplicationContext ctx = createMockContext(
                dataDir, externalMediaDirs, externalFilesDirs, externalCacheDirs, internalCacheDir);
        TestHelperModule module = new TestHelperModule(ctx);

        module.getAppDirs(promise);

        ArgumentCaptor<WritableMap> captor = ArgumentCaptor.forClass(WritableMap.class);
        verify(promise).resolve(captor.capture());
        return captor.getValue();
    }

    // -----------------------------------------------------------------------
    // Tests
    // -----------------------------------------------------------------------

    @Test
    public void getAppDirs_returnsAppInternal() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        Promise promise = mock(Promise.class);

        WritableMap result = invokeGetAppDirs(
                dataDir, new File[0], new File[0], new File[0],
                tempFolder.newFolder("cache"), promise);

        assertTrue(result.hasKey("appInternal"));
        ReadableArray arr = result.getArray("appInternal");
        assertNotNull(arr);
        assertEquals(1, arr.size());
        assertEquals(dataDir, arr.getString(0));
    }

    @Test
    public void getAppDirs_includesExternalMediaDirs() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        File mediaDir1 = tempFolder.newFolder("media1");
        File mediaDir2 = tempFolder.newFolder("media2");
        Promise promise = mock(Promise.class);

        WritableMap result = invokeGetAppDirs(
                dataDir, new File[]{mediaDir1, mediaDir2}, new File[0], new File[0],
                tempFolder.newFolder("cache"), promise);

        assertTrue(result.hasKey("externalMediaDirs"));
        // The loop in addAppSubDirsToResponse overwrites the entry on each
        // iteration, so only the last directory is present in the result.
        ReadableArray arr = result.getArray("externalMediaDirs");
        assertNotNull(arr);
        assertEquals(mediaDir2.getAbsolutePath(), arr.getString(0));
    }

    @Test
    public void getAppDirs_includesExternalFileDirs() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        File fileDir = tempFolder.newFolder("files");
        Promise promise = mock(Promise.class);

        WritableMap result = invokeGetAppDirs(
                dataDir, new File[0], new File[]{fileDir}, new File[0],
                tempFolder.newFolder("cache"), promise);

        assertTrue(result.hasKey("externalFileDirs"));
        ReadableArray arr = result.getArray("externalFileDirs");
        assertNotNull(arr);
        assertEquals(fileDir.getAbsolutePath(), arr.getString(0));
    }

    @Test
    public void getAppDirs_includesExternalCacheDirs() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        File cacheDir = tempFolder.newFolder("ext_cache");
        Promise promise = mock(Promise.class);

        WritableMap result = invokeGetAppDirs(
                dataDir, new File[0], new File[0], new File[]{cacheDir},
                tempFolder.newFolder("cache"), promise);

        assertTrue(result.hasKey("externalCacheDirs"));
        ReadableArray arr = result.getArray("externalCacheDirs");
        assertNotNull(arr);
        assertEquals(cacheDir.getAbsolutePath(), arr.getString(0));
    }

    @Test
    public void getAppDirs_includesInternalCacheDir() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        File internalCache = tempFolder.newFolder("internal_cache");
        Promise promise = mock(Promise.class);

        WritableMap result = invokeGetAppDirs(
                dataDir, new File[0], new File[0], new File[0],
                internalCache, promise);

        assertTrue(result.hasKey("internalCacheDirs"));
        ReadableArray arr = result.getArray("internalCacheDirs");
        assertNotNull(arr);
        assertEquals(1, arr.size());
        assertEquals(internalCache.getAbsolutePath(), arr.getString(0));
    }

    @Test
    public void getAppDirs_hasAllSevenSubdirs() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        File mediaDir = tempFolder.newFolder("media");
        File fileDir = tempFolder.newFolder("files");
        Promise promise = mock(Promise.class);

        WritableMap result = invokeGetAppDirs(
                dataDir, new File[]{mediaDir}, new File[]{fileDir}, new File[0],
                tempFolder.newFolder("cache"), promise);

        assertTrue(result.hasKey("dem"));
        assertTrue(result.hasKey("mapfiles"));
        assertTrue(result.hasKey("databases"));
        assertTrue(result.hasKey("mapstyles"));
        assertTrue(result.hasKey("export"));
        assertTrue(result.hasKey("marker"));
        assertTrue(result.hasKey("cursor"));
    }

    @Test
    public void getAppDirs_databasesUnderDataDir() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        File mediaDir = tempFolder.newFolder("media");
        Promise promise = mock(Promise.class);

        WritableMap result = invokeGetAppDirs(
                dataDir, new File[]{mediaDir}, new File[0], new File[0],
                tempFolder.newFolder("cache"), promise);

        assertTrue(result.hasKey("databases"));
        ReadableArray arr = result.getArray("databases");
        assertNotNull(arr);

        // The first "databases" entry should be the one under dataDir
        String expectedDataDirDb = dataDir + File.separator + "databases";
        assertEquals(expectedDataDirDb, arr.getString(0));

        // There should also be an entry under the external media dir
        String expectedMediaDirDb = mediaDir.getAbsolutePath() + File.separator + "databases";
        assertEquals(expectedMediaDirDb, arr.getString(1));
    }

    @Test
    public void getAppDirs_noExternalMediaDirs_doesNotCrash() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        File fileDir = tempFolder.newFolder("files");
        File cacheDir = tempFolder.newFolder("ext_cache");
        ReactApplicationContext ctx = createMockContext(
                dataDir, new File[0], new File[]{fileDir}, new File[]{cacheDir},
                tempFolder.newFolder("cache"));
        TestHelperModule module = new TestHelperModule(ctx);
        Promise promise = mock(Promise.class);

        // Must not throw
        module.getAppDirs(promise);

        verify(promise).resolve(any(WritableMap.class));
    }

    @Test
    public void getAppDirs_emptyPublicDirs_doesNotCrash() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        // Both externalMediaDirs and externalFilesDirs are empty,
        // so publicDirs will be an empty array.
        ReactApplicationContext ctx = createMockContext(
                dataDir, new File[0], new File[0], new File[]{tempFolder.newFolder("ext_cache")},
                tempFolder.newFolder("cache"));
        TestHelperModule module = new TestHelperModule(ctx);
        Promise promise = mock(Promise.class);

        // Must not throw even when there are no public dirs to iterate over
        module.getAppDirs(promise);

        ArgumentCaptor<WritableMap> captor = ArgumentCaptor.forClass(WritableMap.class);
        verify(promise).resolve(captor.capture());
        WritableMap result = captor.getValue();

        // The "databases" key should still be present with the dataDir entry
        assertTrue(result.hasKey("databases"));
        ReadableArray dbArr = result.getArray("databases");
        assertNotNull(dbArr);
        assertEquals(1, dbArr.size());
        assertEquals(dataDir + File.separator + "databases", dbArr.getString(0));
    }

    @Test
    public void getAppDirs_subdirsCreated() throws Exception {
        String dataDir = tempFolder.newFolder("app_data").getAbsolutePath();
        File externalDir = tempFolder.newFolder("external");
        ReactApplicationContext ctx = createMockContext(
                dataDir, new File[]{externalDir}, new File[0], new File[0],
                tempFolder.newFolder("cache"));
        TestHelperModule module = new TestHelperModule(ctx);
        Promise promise = mock(Promise.class);

        // Verify subdirectories do not exist before the call
        String[] subDirs = {"dem", "mapfiles", "databases", "mapstyles",
                "export", "marker", "cursor"};
        for (String subDir : subDirs) {
            File sub = new File(externalDir, subDir);
            assertFalse("Subdir " + subDir + " should not exist before call",
                    sub.exists());
        }

        // Also verify the dataDir/databases does not exist yet
        File dataDirDb = new File(dataDir, "databases");
        assertFalse(dataDirDb.exists());

        module.getAppDirs(promise);

        // Verify every subdirectory was created under the external dir
        for (String subDir : subDirs) {
            File sub = new File(externalDir, subDir);
            assertTrue("Subdir " + subDir + " should exist after call",
                    sub.exists());
            assertTrue("Subdir " + subDir + " should be a directory",
                    sub.isDirectory());
        }

        // Verify dataDir/databases was also created
        assertTrue("dataDir/databases should exist", dataDirDb.exists());
        assertTrue("dataDir/databases should be a directory",
                dataDirDb.isDirectory());

        verify(promise).resolve(any(WritableMap.class));
    }
}
