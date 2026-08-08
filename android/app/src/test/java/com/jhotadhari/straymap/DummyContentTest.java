package com.jhotadhari.straymap;

import android.content.res.AssetManager;

import java.io.IOException;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnit;
import org.mockito.junit.MockitoRule;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.lang.reflect.Method;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class DummyContentTest {

    @Rule public MockitoRule mockitoRule = MockitoJUnit.rule();
    @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

    @Mock private MainApplication mockApp;

    // ---------------------------------------------------------------------------
    // Reflection helpers to invoke private static methods
    // ---------------------------------------------------------------------------

    private static Object invokePrivateStatic(String methodName, Class<?>[] paramTypes, Object[] args)
            throws Exception {
        Method method = DummyContent.class.getDeclaredMethod(methodName, paramTypes);
        method.setAccessible(true);
        return method.invoke(null, args);
    }

    private static String invokeGetMediaDirPath(MainApplication app) throws Exception {
        return (String) invokePrivateStatic(
                "getMediaDirPath",
                new Class<?>[] {MainApplication.class},
                new Object[] {app});
    }

    private static File invokeGetOutFile(String mediaDirPath, String parent, File file)
            throws Exception {
        return (File) invokePrivateStatic(
                "getOutFile",
                new Class<?>[] {String.class, String.class, File.class},
                new Object[] {mediaDirPath, parent, file});
    }

    private static void invokeCopyFile(InputStream in, FileOutputStream out) throws Exception {
        invokePrivateStatic(
                "copyFile",
                new Class<?>[] {InputStream.class, FileOutputStream.class},
                new Object[] {in, out});
    }

    // ===== getMediaDirPath tests ===============================================

    @Test
    public void getMediaDirPath_withMediaDirs() {
        when(mockApp.getExternalMediaDirs()).thenReturn(new File[] {new File("/media/0")});
        assertEquals("/media/0", DummyContent.getMediaDirPath(mockApp));
    }

    @Test
    public void getMediaDirPath_noMediaDirs() {
        when(mockApp.getExternalMediaDirs()).thenReturn(new File[0]);
        assertNull(DummyContent.getMediaDirPath(mockApp));
    }

    // ===== getOutFile tests ====================================================

    @Test
    public void getOutFile_withValidPath() throws Exception {
        File file = new File("test.txt");
        File result = invokeGetOutFile("/media/0", "dummy/subdir", file);
        // getOutFile uses file.getAbsolutePath(), which includes the CWD, so we
        // verify that the result contains the expected directory and filename.
        String path = result.getAbsolutePath();
        assertTrue("Path should start with mediaDirPath + subdir",
                path.startsWith("/media/0/subdir"));
        assertTrue("Path should end with the filename",
                path.endsWith("test.txt"));
    }

    @Test
    public void getOutFile_withNullMediaDirPath() throws Exception {
        File result = invokeGetOutFile(null, "dummy/subdir", new File("test.txt"));
        assertNull(result);
    }

    @Test
    public void getOutFile_stripsDummyPrefix() throws Exception {
        File file = new File("data.xml");
        File result = invokeGetOutFile("/media/0", "dummy/a/b", file);
        String path = result.getAbsolutePath();
        assertTrue("Path should contain /media/0/a/b", path.contains("/media/0/a/b"));
        assertTrue("Path should end with data.xml", path.endsWith("data.xml"));
        assertFalse("Path should not contain /dummy/", path.contains("/dummy/"));
    }

    @Test
    public void getOutFile_rootLevelAsset() throws Exception {
        File file = new File("file.txt");
        File result = invokeGetOutFile("/media/0", "dummy", file);
        String path = result.getAbsolutePath();
        assertTrue("Path should start with /media/0", path.startsWith("/media/0"));
        assertTrue("Path should end with file.txt", path.endsWith("file.txt"));
        // For a root-level asset with parent="dummy", splitting yields ["dummy"],
        // copyOfRange from index 1 produces an empty array -> joined to "".
        // Expected: /media/0/<CWD>/file.txt
    }

    // ===== copyFile tests ======================================================

    @Test
    public void copyFile_copiesCorrectly() throws Exception {
        File tempFile = tempFolder.newFile("output.txt");
        ByteArrayInputStream in = new ByteArrayInputStream("hello".getBytes("UTF-8"));
        FileOutputStream out = new FileOutputStream(tempFile);
        invokeCopyFile(in, out);
        out.close();

        byte[] resultBytes = java.nio.file.Files.readAllBytes(tempFile.toPath());
        assertArrayEquals("hello".getBytes("UTF-8"), resultBytes);
    }

    @Test
    public void copyFile_largeData() throws Exception {
        byte[] largeData = new byte[10 * 1024];
        for (int i = 0; i < largeData.length; i++) {
            largeData[i] = (byte) (i % 256);
        }
        File tempFile = tempFolder.newFile("large_output.bin");
        ByteArrayInputStream in = new ByteArrayInputStream(largeData);
        FileOutputStream out = new FileOutputStream(tempFile);
        invokeCopyFile(in, out);
        out.close();

        byte[] resultBytes = java.nio.file.Files.readAllBytes(tempFile.toPath());
        assertArrayEquals(largeData, resultBytes);
    }

    @Test
    public void copyFile_emptyData() throws Exception {
        File tempFile = tempFolder.newFile("empty_output.txt");
        ByteArrayInputStream in = new ByteArrayInputStream(new byte[0]);
        FileOutputStream out = new FileOutputStream(tempFile);
        invokeCopyFile(in, out);
        out.close();

        byte[] resultBytes = java.nio.file.Files.readAllBytes(tempFile.toPath());
        assertEquals(0, resultBytes.length);
    }

    // ===== init tests ==========================================================

    @Test
    public void init_createsMediaDir() {
        File mediaDir = new File(tempFolder.getRoot(), "media");
        assertFalse("media dir should not exist before init", mediaDir.exists());

        when(mockApp.getExternalMediaDirs()).thenReturn(new File[] {mediaDir});

        AssetManager mockAssets = mock(AssetManager.class);
        when(mockApp.getAssets()).thenReturn(mockAssets);
        try {
            when(mockAssets.list("dummy")).thenReturn(new String[0]);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        DummyContent.init(mockApp);

        assertTrue("media dir should exist after init", mediaDir.exists());
        assertTrue("media dir should be a directory", mediaDir.isDirectory());
    }

    @Test
    public void init_noMediaDir() {
        when(mockApp.getExternalMediaDirs()).thenReturn(new File[0]);
        // Should not throw and copyAssets should never be invoked.
        DummyContent.init(mockApp);
        // If we reach here without exception the test passes.
    }
}
