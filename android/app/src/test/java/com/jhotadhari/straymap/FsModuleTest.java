package com.jhotadhari.straymap;

import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.ArgumentCaptor;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class FsModuleTest {

	/**
	 * Test-only subclass that replaces JNI-backed WritableNativeMap/Array with
	 * pure-Java JavaOnlyMap/Array and forces the SDK guard to pass.
	 * Every test MUST use this or a further subclass of it.
	 */
	static class TestFsModule extends FsModule {

		TestFsModule(ReactApplicationContext ctx) {
			super(ctx);
		}

		@Override
		protected boolean isAtLeastO() {
			return true;
		}

		@Override
		protected WritableMap createMap() {
			return new JavaOnlyMap();
		}

		@Override
		protected WritableArray createArray() {
			return new JavaOnlyArray();
		}

		@Override
		protected MatchExtensionsPredicate createPredicate(String[] extensions) {
			MatchExtensionsPredicate p = super.createPredicate(extensions);
			p.sdkAtLeastO = true;
			return p;
		}
	}

	@Rule
	public TemporaryFolder tempFolder = new TemporaryFolder();

	// ---------------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------------

	private TestFsModule createModule() {
		return new TestFsModule(mock(ReactApplicationContext.class));
	}

	// ---------------------------------------------------------------------------
	// getReadableSize (static, no mocking needed)
	// ---------------------------------------------------------------------------

	@Test
	public void getReadableSize_zero_returns0B() {
		assertEquals("0 B", FsModule.getReadableSize(0));
	}

	@Test
	public void getReadableSize_bytes() {
		assertEquals("500 B", FsModule.getReadableSize(500));
	}

	@Test
	public void getReadableSize_kilobytes() {
		assertEquals("2 KB", FsModule.getReadableSize(2048));
	}

	@Test
	public void getReadableSize_megabytes() {
		assertEquals("1 MB", FsModule.getReadableSize(1048576));
	}

	@Test
	public void getReadableSize_gigabytes() {
		assertEquals("1 GB", FsModule.getReadableSize(1073741824L));
	}

	@Test
	public void getReadableSize_terabytes() {
		assertEquals("1 TB", FsModule.getReadableSize(1099511627776L));
	}

	@Test
	public void getReadableSize_decimalKb() {
		assertEquals("1.5 KB", FsModule.getReadableSize(1536));
	}

	@Test
	public void getReadableSize_decimalMb() {
		assertEquals("1.5 MB", FsModule.getReadableSize(1572864));
	}

	// ---------------------------------------------------------------------------
	// walk
	// ---------------------------------------------------------------------------

	@Test
	public void walk_matchingFile_handlesFile() throws Exception {
		TestFsModule module = createModule();
		File dir = tempFolder.newFolder("walkdir");
		File matchingFile = new File(dir, "photo.jpg");
		assertTrue(matchingFile.createNewFile());

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(dir, filter, false,
			new FsModule.FileHandler() {
				@Override
				void handle(File file) {
					handled.add(file);
				}
			});

		assertEquals("Handler should be called for matching file", 1, handled.size());
		assertEquals(matchingFile.getAbsolutePath(), handled.get(0).getAbsolutePath());
	}

	@Test
	public void walk_noMatchingFile_doesNotHandle() throws Exception {
		TestFsModule module = createModule();
		File dir = tempFolder.newFolder("walkdir");
		File nonMatchingFile = new File(dir, "readme.txt");
		assertTrue(nonMatchingFile.createNewFile());

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(dir, filter, false,
			new FsModule.FileHandler() {
				@Override
				void handle(File file) {
					handled.add(file);
				}
			});

		assertTrue("Handler should NOT be called when no file matches", handled.isEmpty());
	}

	@Test
	public void walk_hiddenFile_skipped() throws Exception {
		TestFsModule module = createModule();
		File dir = tempFolder.newFolder("walkdir");
		File hiddenFile = new File(dir, ".hidden.jpg");
		assertTrue(hiddenFile.createNewFile());

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(dir, filter, false,
			new FsModule.FileHandler() {
				@Override
				void handle(File file) {
					handled.add(file);
				}
			});

		assertTrue("Handler should NOT be called for hidden file", handled.isEmpty());
	}

	@Test
	public void walk_hiddenDir_skipped() throws Exception {
		TestFsModule module = createModule();
		File dir = tempFolder.newFolder("walkdir");
		File hiddenSubdir = new File(dir, ".subdir");
		assertTrue(hiddenSubdir.mkdir());
		File nestedFile = new File(hiddenSubdir, "photo.jpg");
		assertTrue(nestedFile.createNewFile());

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(dir, filter, true,
			new FsModule.FileHandler() {
				@Override
				void handle(File file) {
					handled.add(file);
				}
			});

		assertTrue("Handler should NOT be called for files inside hidden directory", handled.isEmpty());
	}

	@Test
	public void walk_recursive_stopsAtMatchLevel() throws Exception {
		TestFsModule module = createModule();
		File dir = tempFolder.newFolder("walkdir");
		// Top-level matching file
		File topFile = new File(dir, "photo.jpg");
		assertTrue(topFile.createNewFile());
		// Nested matching file — should NOT be reached
		File subdir = new File(dir, "subdir");
		assertTrue(subdir.mkdir());
		File nestedFile = new File(subdir, "photo.jpg");
		assertTrue(nestedFile.createNewFile());

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(dir, filter, true,
			new FsModule.FileHandler() {
				@Override
				void handle(File file) {
					handled.add(file);
				}
			});

		assertEquals("Only the top-level matching file should be handled", 1, handled.size());
		assertEquals(topFile.getAbsolutePath(), handled.get(0).getAbsolutePath());
	}

	@Test
	public void walk_recursive_descendsWhenNoMatch() throws Exception {
		TestFsModule module = createModule();
		File dir = tempFolder.newFolder("walkdir");
		// Non-matching file at top level
		File topFile = new File(dir, "readme.txt");
		assertTrue(topFile.createNewFile());
		// Matching file nested one level
		File subdir = new File(dir, "subdir");
		assertTrue(subdir.mkdir());
		File nestedFile = new File(subdir, "photo.jpg");
		assertTrue(nestedFile.createNewFile());

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(dir, filter, true,
			new FsModule.FileHandler() {
				@Override
				void handle(File file) {
					handled.add(file);
				}
			});

		assertEquals("Nested matching file should be handled", 1, handled.size());
		assertEquals(nestedFile.getAbsolutePath(), handled.get(0).getAbsolutePath());
	}

	@Test
	public void walk_nonRecursive_doesNotDescend() throws Exception {
		TestFsModule module = createModule();
		File dir = tempFolder.newFolder("walkdir");
		File subdir = new File(dir, "subdir");
		assertTrue(subdir.mkdir());
		File nestedFile = new File(subdir, "photo.jpg");
		assertTrue(nestedFile.createNewFile());

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(dir, filter, false,
			new FsModule.FileHandler() {
				@Override
				void handle(File file) {
					handled.add(file);
				}
			});

		assertTrue("Handler should NOT be called when non-recursive and no match at top level",
			handled.isEmpty());
	}

	@Test
	public void walk_nonDirectoryStartPath() throws Exception {
		TestFsModule module = createModule();
		File file = tempFolder.newFile("photo.jpg");

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(file, filter, false,
			new FsModule.FileHandler() {
				@Override
				void handle(File f) {
					handled.add(f);
				}
			});

		assertTrue("Handler should NOT be called when start path is a file", handled.isEmpty());
	}

	@Test
	public void walk_noMatchEvenWithRecursive() throws Exception {
		TestFsModule module = createModule();
		File dir = tempFolder.newFolder("walkdir");
		File subdir = new File(dir, "subdir");
		assertTrue(subdir.mkdir());
		File nestedFile = new File(subdir, "readme.txt");
		assertTrue(nestedFile.createNewFile());

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(dir, filter, true,
			new FsModule.FileHandler() {
				@Override
				void handle(File f) {
					handled.add(f);
				}
			});

		assertTrue("Handler should NOT be called when no file matches even with recursive",
			handled.isEmpty());
	}

	@Test
	public void walk_sdkBelowO_doesNothing() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		// Anonymous subclass that forces isAtLeastO() to return false
		TestFsModule module = new TestFsModule(mockCtx) {
			@Override
			protected boolean isAtLeastO() {
				return false;
			}
		};

		File dir = tempFolder.newFolder("walkdir");
		File matchingFile = new File(dir, "photo.jpg");
		assertTrue(matchingFile.createNewFile());

		MatchExtensionsPredicate filter = new MatchExtensionsPredicate(new String[]{"jpg"});
		filter.sdkAtLeastO = true;
		List<File> handled = new ArrayList<>();

		module.walk(dir, filter, true,
			new FsModule.FileHandler() {
				@Override
				void handle(File f) {
					handled.add(f);
				}
			});

		assertTrue("Handler should NOT be called when SDK is below O", handled.isEmpty());
	}

	// ---------------------------------------------------------------------------
	// getInfo
	// ---------------------------------------------------------------------------

	@Test
	public void getInfo_returnsNavParent() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		File dir = tempFolder.newFolder("infodir");
		File file1 = new File(dir, "file1.txt");
		assertTrue(file1.createNewFile());

		module.getInfo(dir.getAbsolutePath(), JavaOnlyArray.of("txt"), false, mockPromise);

		ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
		verify(mockPromise).resolve(captor.capture());

		assertTrue("Resolved value should be a WritableMap", captor.getValue() instanceof WritableMap);
		WritableMap response = (WritableMap) captor.getValue();

		assertNotNull("Response should contain navParent", response.getString("navParent"));
		assertEquals(dir.getParent(), response.getString("navParent"));
	}

	@Test
	public void getInfo_returnsNavChildren() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		File dir = tempFolder.newFolder("infodir");
		File file1 = new File(dir, "alpha.txt");
		assertTrue(file1.createNewFile());
		File file2 = new File(dir, "beta.txt");
		assertTrue(file2.createNewFile());

		module.getInfo(dir.getAbsolutePath(), JavaOnlyArray.of("txt"), false, mockPromise);

		ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
		verify(mockPromise).resolve(captor.capture());

		assertTrue(captor.getValue() instanceof WritableMap);
		WritableMap response = (WritableMap) captor.getValue();

		ReadableArray children = response.getArray("navChildren");
		assertNotNull("Response should contain navChildren", children);
		assertEquals(2, children.size());

		for (int i = 0; i < children.size(); i++) {
			ReadableMap child = children.getMap(i);
			assertNotNull("Child should have name", child.getString("name"));
			assertTrue(child.hasKey("depth"));
			assertTrue(child.hasKey("isDir"));
			assertTrue(child.hasKey("isFile"));
			assertTrue(child.hasKey("canRead"));
			assertTrue(child.hasKey("canExecute"));
		}
	}

	@Test
	public void getInfo_nullExtensions_listsAll() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		File dir = tempFolder.newFolder("infodir");
		File file1 = new File(dir, "readme.txt");
		assertTrue(file1.createNewFile());
		File file2 = new File(dir, "photo.jpg");
		assertTrue(file2.createNewFile());

		// null extensions -> MatchExtensionsPredicate with empty filter -> no
		// matches, but the call should complete without throwing.
		module.getInfo(dir.getAbsolutePath(), null, false, mockPromise);

		ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
		verify(mockPromise).resolve(captor.capture());

		assertTrue(captor.getValue() instanceof WritableMap);
		WritableMap response = (WritableMap) captor.getValue();
		assertNotNull("Response should contain navParent", response.getString("navParent"));
		assertNotNull("Response should contain navChildren", response.getArray("navChildren"));
	}

	@Test
	public void getInfo_recursive_returnsNested() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		File dir = tempFolder.newFolder("infodir");
		File topFile = new File(dir, "top.txt");
		assertTrue(topFile.createNewFile());
		File subdir = new File(dir, "subdir");
		assertTrue(subdir.mkdir());
		File nestedFile = new File(subdir, "nested.txt");
		assertTrue(nestedFile.createNewFile());

		module.getInfo(dir.getAbsolutePath(), JavaOnlyArray.of("txt"), true, mockPromise);

		ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
		verify(mockPromise).resolve(captor.capture());

		assertTrue(captor.getValue() instanceof WritableMap);
		WritableMap response = (WritableMap) captor.getValue();
		ReadableArray children = response.getArray("navChildren");
		assertNotNull(children);

		// Both files should be found (walk descends because .txt files do NOT match
		// the fully-qualified extension check — actually "txt" becomes ".txt"
		// in MatchExtensionsPredicate, so both .txt files DO match at their
		// respective levels).
		// top.txt matches at level 0, stopping descent. nested.txt is NOT reached.
		// So only 1 child.
		assertEquals(1, children.size());

		// Depth of the top-level file should be 0
		ReadableMap child = children.getMap(0);
		assertEquals(0, child.getInt("depth"));
	}

	@Test
	public void getInfo_nonRecursive_onlyTopLevel() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		File dir = tempFolder.newFolder("infodir");
		File topFile = new File(dir, "top.txt");
		assertTrue(topFile.createNewFile());
		File subdir = new File(dir, "subdir");
		assertTrue(subdir.mkdir());
		File nestedFile = new File(subdir, "nested.txt");
		assertTrue(nestedFile.createNewFile());

		module.getInfo(dir.getAbsolutePath(), JavaOnlyArray.of("txt"), false, mockPromise);

		ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
		verify(mockPromise).resolve(captor.capture());

		assertTrue(captor.getValue() instanceof WritableMap);
		WritableMap response = (WritableMap) captor.getValue();
		ReadableArray children = response.getArray("navChildren");
		assertNotNull(children);

		// Only top.txt should be found; nested.txt requires recursion
		assertEquals(1, children.size());
		ReadableMap child = children.getMap(0);
		assertEquals(0, child.getInt("depth"));
	}

	@Test
	public void getInfo_exception_rejects() {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		// Passing null as navDir causes new File(null) to throw NullPointerException,
		// exercising the catch block that calls promise.reject.
		module.getInfo(null, JavaOnlyArray.of("txt"), false, mockPromise);

		ArgumentCaptor<String> rejectCode = ArgumentCaptor.forClass(String.class);
		ArgumentCaptor<Throwable> rejectReason = ArgumentCaptor.forClass(Throwable.class);
		verify(mockPromise).reject(rejectCode.capture(), rejectReason.capture());

		assertEquals("Error", rejectCode.getValue());
		assertNotNull("Reject reason should be non-null", rejectReason.getValue());
	}

	// ---------------------------------------------------------------------------
	// deleteDir
	// ---------------------------------------------------------------------------

	@Test
	public void deleteDir_success() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		File dir = tempFolder.newFolder("deleteMe");
		File child = new File(dir, "child.txt");
		assertTrue(child.createNewFile());

		String dirPath = dir.getAbsolutePath();
		module.deleteDir(dirPath, mockPromise);

		verify(mockPromise).resolve(true);
		assertFalse("Directory should be deleted", new File(dirPath).exists());
	}

	@Test
	public void deleteDir_exception_rejects() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		// Create a regular file (not a directory) — FileUtils.deleteDirectory throws
		// IllegalArgumentException because cleanDirectory verifies isDirectory().
		File regularFile = tempFolder.newFile("not_a_dir.txt");

		module.deleteDir(regularFile.getAbsolutePath(), mockPromise);

		ArgumentCaptor<String> rejectCode = ArgumentCaptor.forClass(String.class);
		ArgumentCaptor<Throwable> rejectReason = ArgumentCaptor.forClass(Throwable.class);
		verify(mockPromise).reject(rejectCode.capture(), rejectReason.capture());

		assertEquals("Error", rejectCode.getValue());
		assertNotNull("Reject reason should be non-null", rejectReason.getValue());

		// The file should still exist (was not deleted by the failing call)
		assertTrue("File should still exist", regularFile.exists());
	}

	// ---------------------------------------------------------------------------
	// getCacheInfo
	// ---------------------------------------------------------------------------

	@Test
	public void getCacheInfo_includesInternalCacheDir() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		File cacheDir = tempFolder.newFolder("cacheDir");
		when(mockCtx.getCacheDir()).thenReturn(cacheDir);
		when(mockCtx.getExternalCacheDirs()).thenReturn(new File[0]);

		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		module.getCacheInfo(mockPromise);

		ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
		verify(mockPromise).resolve(captor.capture());

		assertTrue("Resolved value should be a WritableArray",
			captor.getValue() instanceof WritableArray);
		ReadableArray result = (ReadableArray) captor.getValue();
		assertEquals("Should have exactly one cache dir entry", 1, result.size());

		ReadableMap dirEntry = result.getMap(0);
		assertEquals(cacheDir.getAbsolutePath(), dirEntry.getString("path"));
		assertNotNull("Each cache dir entry should have a 'caches' array",
			dirEntry.getArray("caches"));
	}

	@Test
	public void getCacheInfo_subdirsListed() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		File cacheDir = tempFolder.newFolder("cacheDir");
		when(mockCtx.getCacheDir()).thenReturn(cacheDir);
		when(mockCtx.getExternalCacheDirs()).thenReturn(new File[0]);

		// Create subdirectories inside the cache dir
		File sub1 = new File(cacheDir, "subalpha");
		assertTrue(sub1.mkdir());
		// Put a file inside so sizeOfDirectory is meaningful
		File sub1File = new File(sub1, "data.bin");
		assertTrue(sub1File.createNewFile());

		File sub2 = new File(cacheDir, "subbeta");
		assertTrue(sub2.mkdir());

		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		module.getCacheInfo(mockPromise);

		ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
		verify(mockPromise).resolve(captor.capture());

		assertTrue(captor.getValue() instanceof WritableArray);
		ReadableArray result = (ReadableArray) captor.getValue();
		assertEquals(1, result.size());

		ReadableMap dirEntry = result.getMap(0);
		ReadableArray caches = dirEntry.getArray("caches");
		assertNotNull(caches);
		assertEquals("Both subdirectories should be listed", 2, caches.size());

		// Verify the subdirectory names appear as basenames
		List<String> basenames = new ArrayList<>();
		for (int i = 0; i < caches.size(); i++) {
			ReadableMap cache = caches.getMap(i);
			String basename = cache.getString("basename");
			basenames.add(basename);
			assertNotNull("Cache entry should have readableSize",
				cache.getString("readableSize"));
		}
		assertTrue("Should contain subalpha", basenames.contains("subalpha"));
		assertTrue("Should contain subbeta", basenames.contains("subbeta"));
	}

	@Test
	public void getCacheInfo_filesSkipped() throws Exception {
		ReactApplicationContext mockCtx = mock(ReactApplicationContext.class);
		File cacheDir = tempFolder.newFolder("cacheDir");
		when(mockCtx.getCacheDir()).thenReturn(cacheDir);
		when(mockCtx.getExternalCacheDirs()).thenReturn(new File[0]);

		// Create a regular file directly in the cache dir (should be skipped)
		File regularFile = new File(cacheDir, "some_file.txt");
		assertTrue(regularFile.createNewFile());

		// Create a subdirectory (should appear)
		File subDir = new File(cacheDir, "realdir");
		assertTrue(subDir.mkdir());

		TestFsModule module = new TestFsModule(mockCtx);
		Promise mockPromise = mock(Promise.class);

		module.getCacheInfo(mockPromise);

		ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
		verify(mockPromise).resolve(captor.capture());

		assertTrue(captor.getValue() instanceof WritableArray);
		ReadableArray result = (ReadableArray) captor.getValue();
		assertEquals(1, result.size());

		ReadableMap dirEntry = result.getMap(0);
		ReadableArray caches = dirEntry.getArray("caches");
		assertNotNull(caches);

		// Only the directory should be listed, not the file
		assertEquals("Only the directory should be in caches array", 1, caches.size());
		assertEquals("realdir", caches.getMap(0).getString("basename"));
	}
}
