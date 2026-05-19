package com.jhotadhari.straymap;

import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.logging.FileHandler;


public class FsModule extends ReactContextBaseJavaModule {

	ReactContext reactContext;

	public FsModule(@Nullable ReactApplicationContext reactContext_) {
		super(reactContext_);
		reactContext = reactContext_;
	}

	@NonNull
	@Override
    public String getName() {
        return "FsModule";
    }

    @ReactMethod
    public void getInfo( String navDir, ReadableArray extensions, Boolean recursive, Promise promise ) {
        try {
            WritableMap response = new WritableNativeMap();
            File path = new File( navDir );

            // navParent
			response.putString( "navParent", String.valueOf( path.getParent() ) );

			String[] extensionsStrings = extensions.toArrayList().toArray( new String[ 0 ] );

            // navChildren
            WritableArray navChildrenArray = new WritableNativeArray();
			this.walk(
				path,
				new MatchExtensionsPredicate( extensionsStrings ),
				recursive,
				new FileHandler() {
					@Override
					void handle( File file ) {
						int depth = file.toString().replace(
							path.toString() + '/',
							""
						).split( "/" ).length - 1;
						WritableMap fileInfoMap = new WritableNativeMap();
						fileInfoMap.putString( "name", file.toString() );
						fileInfoMap.putInt( "depth", depth );
						fileInfoMap.putBoolean( "isDir", file.isDirectory() );
						fileInfoMap.putBoolean( "isFile", file.isFile() );
						fileInfoMap.putBoolean( "canRead", file.canRead() );
						fileInfoMap.putBoolean( "canExecute", file.canExecute() );
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
			boolean shouldWalk = recursive;
			if ( Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ) {
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
    public void getCacheInfo( Promise promise ) {
        try {
			WritableArray responseCacheDirs = new WritableNativeArray();
			List<File> cacheDirs = new ArrayList<>();
			cacheDirs.add( getReactApplicationContext().getCacheDir() );
			Collections.addAll( cacheDirs, getReactApplicationContext().getExternalCacheDirs() );
			// Loop cache dirs.
			for ( int i = 0; i < cacheDirs.size(); i++ ) {
				File cacheDir = cacheDirs.get( i );
				WritableMap fileMap = new WritableNativeMap();
				fileMap.putString( "path", cacheDir.toString() );
				// Loop cacheSubDirs.
				WritableArray caches = new WritableNativeArray();
				File[] cacheSubDirs = cacheDir.listFiles();
				if ( null != cacheSubDirs ) {
					for ( File cacheSubDir : cacheSubDirs ) {
						if ( ! cacheSubDir.isDirectory() ) {
							continue;
						}
						WritableMap fileInfoMap = new WritableNativeMap();
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
		double unitValue = 1 << (unitIndex * 10);
		return new DecimalFormat("#,##0.#")
				.format(size / unitValue) + " "
				+ units[unitIndex];
	}

	abstract static protected class FileHandler {
		abstract void handle( File file );
	}

}
