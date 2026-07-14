package com.jhotadhari.straymap;

import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.logging.FileHandler;


@ReactModule(name = FsModule.NAME)
public class FsModule extends NativeFsModuleSpec {

	public static final String NAME = "FsModule";

	ReactContext reactContext;

	public FsModule(@Nullable ReactApplicationContext reactContext_) {
		super(reactContext_);
		reactContext = reactContext_;
	}

	@NonNull
	@Override
    public String getName() {
        return NAME;
    }

	protected boolean isAtLeastO() {
		return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
	}

	protected WritableMap createMap() {
		return new WritableNativeMap();
	}

	protected WritableArray createArray() {
		return new WritableNativeArray();
	}

	protected MatchExtensionsPredicate createPredicate(String[] extensions) {
		return new MatchExtensionsPredicate(extensions);
	}

    @ReactMethod
    public void getInfo( String navDir, @Nullable ReadableArray extensions, boolean recursive, Promise promise ) {
        try {
            WritableMap response = createMap();
            File path = new File( navDir );

            // navParent
			response.putString( "navParent", String.valueOf( path.getParent() ) );

			String[] extensionsStrings = extensions != null
				? extensions.toArrayList().toArray( new String[ 0 ] )
				: new String[ 0 ];

            // navChildren
            WritableArray navChildrenArray = createArray();
			this.walk(
				path,
				createPredicate( extensionsStrings ),
				recursive,
				new FileHandler() {
					@Override
					void handle( File file ) {
						int depth = file.toString().replace(
							path.toString() + '/',
							""
						).split( "/" ).length - 1;
						WritableMap fileInfoMap = createMap();
						fileInfoMap.putString( "name", file.toString() );
						fileInfoMap.putInt( "depth", depth );
						fileInfoMap.putBoolean( "isDir", file.isDirectory() );
						fileInfoMap.putBoolean( "isFile", file.isFile() );
						fileInfoMap.putBoolean( "canRead", file.canRead() );
						fileInfoMap.putBoolean( "canExecute", file.canExecute() );
						fileInfoMap.putDouble( "size", (double) file.length() );
						navChildrenArray.pushMap( fileInfoMap );
					}
				}
			);
			response.putArray( "navChildren", navChildrenArray );

            // Return response
            promise.resolve( response );
        } catch(Exception e) {
            promise.reject("Error", e);
        }
    }

	protected void walk( File startPath, MatchExtensionsPredicate filter, Boolean recursive, FileHandler handler ) {
		if ( startPath.isDirectory() ) {
			// shouldWalk starts as `recursive` — if true, we will descend into
			// subdirectories UNLESS a matching file is found at the current
			// level.  This is intentional: a match here means "stop, don't go
			// deeper."  Future: replace the implicit boolean with an explicit
			// option flag (e.g. stopOnFirstMatch) passed from the JS side.
			boolean shouldWalk = recursive;
			if ( isAtLeastO() ) {
				File[] files = startPath.listFiles();
				assert files != null;
				for (File file : files) {
					if (! file.isDirectory() && ! file.getName().startsWith( "." ) && filter.test(file.toPath())) {
						shouldWalk = false;
						handler.handle( file );
					}
				}
				if ( shouldWalk ) {
					for (File file : files ) {
						if ( file.isDirectory() && ! file.getName().startsWith( "." ) ) {
							this.walk( file, filter, recursive, handler );
						}
					}
				}
			}
		}
	}

    @ReactMethod
    public void deleteDir( String path, Promise promise ) {
		try {
			File file = new File( path );
			FileUtils.deleteDirectory(file);
			promise.resolve( true );
		} catch(Exception e) {
			promise.reject("Error", e);
		}
	}


	    @ReactMethod
	    public void deleteFile( String path, Promise promise ) {
			try {
				File file = new File( path );
				if ( ! file.exists() ) {
					promise.reject( "Error", "File does not exist: " + path );
					return;
				}
				if ( file.isDirectory() ) {
					promise.reject( "Error", "Path is a directory, use deleteDir instead: " + path );
					return;
				}
				boolean result = file.delete();
				promise.resolve( result );
			} catch( Exception e ) {
				promise.reject( "Error", e );
			}
		}

	    @ReactMethod
	    public void renameFile( String oldPath, String newPath, Promise promise ) {
			try {
				File oldFile = new File( oldPath );
				if ( ! oldFile.exists() ) {
					promise.reject( "Error", "File does not exist: " + oldPath );
					return;
				}
				File newFile = new File( newPath );
				if ( newFile.exists() ) {
					promise.reject( "Error", "Target already exists: " + newPath );
					return;
				}
				File parentDir = newFile.getParentFile();
				if ( parentDir != null && ! parentDir.exists() ) {
					parentDir.mkdirs();
				}
				boolean result = oldFile.renameTo( newFile );
				if ( ! result ) {
					FileUtils.copyFile( oldFile, newFile );
					oldFile.delete();
				}
				promise.resolve( true );
			} catch( Exception e ) {
				promise.reject( "Error", e );
			}
		}

	    @ReactMethod
	    public void copyFile( String sourcePath, String destPath, Promise promise ) {
			try {
				File sourceFile = new File( sourcePath );
				if ( ! sourceFile.exists() ) {
					promise.reject( "Error", "Source file does not exist: " + sourcePath );
					return;
				}
				if ( sourceFile.isDirectory() ) {
					promise.reject( "Error", "Source is a directory: " + sourcePath );
					return;
				}
				File destFile = new File( destPath );
				if ( destFile.exists() ) {
					promise.reject( "Error", "Target already exists: " + destPath );
					return;
				}
				File parentDir = destFile.getParentFile();
				if ( parentDir != null && ! parentDir.exists() ) {
					parentDir.mkdirs();
				}
				FileUtils.copyFile( sourceFile, destFile );
				promise.resolve( true );
			} catch( Exception e ) {
				promise.reject( "Error", e );
			}
		}
    @ReactMethod
    public void getCacheInfo( Promise promise ) {
        try {
			WritableArray responseCacheDirs = createArray();
			List<File> cacheDirs = new ArrayList<>();
			cacheDirs.add( getReactApplicationContext().getCacheDir() );
			Collections.addAll( cacheDirs, getReactApplicationContext().getExternalCacheDirs() );
			// Loop cache dirs.
			for ( int i = 0; i < cacheDirs.size(); i++ ) {
				File cacheDir = cacheDirs.get( i );
				WritableMap fileMap = createMap();
				fileMap.putString( "path", cacheDir.toString() );
				// Loop cacheSubDirs.
				WritableArray caches = createArray();
				File[] cacheSubDirs = cacheDir.listFiles();
				if ( null != cacheSubDirs ) {
					for ( File cacheSubDir : cacheSubDirs ) {
						if ( ! cacheSubDir.isDirectory() ) {
							continue;
						}
						WritableMap fileInfoMap = createMap();
						String readableSize = getReadableSize( FileUtils.sizeOfDirectory( cacheSubDir ) );
						fileInfoMap.putString( "basename", cacheSubDir.toString().replace( cacheDir.toString() + "/", "" ) );
						fileInfoMap.putString( "readableSize", readableSize );
						caches.pushMap( fileInfoMap );
					}
					fileMap.putArray( "caches", caches );
					responseCacheDirs.pushMap( fileMap );
				}
			}
            promise.resolve( responseCacheDirs );
        } catch(Exception e) {
            promise.reject("Error", e);
        }
    }

	// https://www.baeldung.com/java-folder-size#human-readable-size
	public static String getReadableSize( long size ) {
		if ( size == 0 ) {
			return "0 B";
		}
		String[] units = new String[] { "B", "KB", "MB", "GB", "TB" };
		int unitIndex = (int) (Math.log10(size) / 3);
		double unitValue = 1L << (unitIndex * 10);
		return new DecimalFormat("#,##0.#")
				.format(size / unitValue) + " "
				+ units[unitIndex];
	}

	abstract static protected class FileHandler {
		abstract void handle( File file );
	}

}
