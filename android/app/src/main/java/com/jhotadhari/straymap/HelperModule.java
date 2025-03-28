package com.jhotadhari.straymap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import java.io.File;
import java.util.Arrays;

public class HelperModule extends ReactContextBaseJavaModule {

	public String getName() { return "HelperModule"; };

	public HelperModule(ReactApplicationContext context) {
		super(context);
	}

	@ReactMethod
	public void getAppDirs(
		Promise promise
	) {
		WritableMap responseParams = new WritableNativeMap();

		// appInternal
		WritableArray dirs = new WritableNativeArray();
		dirs.pushString( getReactApplicationContext().getApplicationInfo().dataDir );
		responseParams.putArray( "appInternal", dirs );

		addAppSubDirsToResponse( responseParams );

		promise.resolve( responseParams );
	};

	public void addAppSubDirsToResponse( WritableMap responseParams ) {
		// externalMediaDirs
		File[] externalMediaDirs = getReactApplicationContext().getExternalMediaDirs();
		for ( int i = 0; i < externalMediaDirs.length; i++ ) {
			WritableArray dirs = new WritableNativeArray();
			dirs.pushString( externalMediaDirs[i].toString() );
			responseParams.putArray( "externalMediaDirs", dirs );
		}
		// externalFileDirs
		File[] filesDirs = getReactApplicationContext().getExternalFilesDirs( null );
		for ( int i = 0; i < filesDirs.length; i++ ) {
			WritableArray dirs = new WritableNativeArray();
			dirs.pushString( filesDirs[i].toString() );
			responseParams.putArray( "externalFileDirs", dirs );
		}
		// externalCacheDirs
		File[] externalCacheDirs = getReactApplicationContext().getExternalCacheDirs();
		for ( int i = 0; i < externalCacheDirs.length; i++ ) {
			WritableArray dirs = new WritableNativeArray();
			dirs.pushString( externalCacheDirs[i].toString() );
			responseParams.putArray( "externalCacheDirs", dirs );
		}
		// internalCacheDir
		responseParams.putString( "internalCacheDir", getReactApplicationContext().getCacheDir().toString() );
		// externalCacheDir
		File externalCacheDir = getReactApplicationContext().getExternalCacheDir();
		if ( null != externalCacheDir ) {
			responseParams.putString( "externalCacheDir", externalCacheDir.toString() );
		}
		// Subdirs
		File[] allDirs = Arrays.copyOf( externalMediaDirs, externalMediaDirs.length + filesDirs.length );
		System.arraycopy( filesDirs, 0, allDirs, externalMediaDirs.length, filesDirs.length );
		String[] subdirs = {
			"dem",
			"mapfiles",
			"mapstyles",
			"tracks",
			"marker",
			"cursor",
		};
		for ( int si = 0; si < subdirs.length; si++ ) {
			WritableArray dirs = new WritableNativeArray();
			for ( int i = 0; i < allDirs.length; i++ ) {
				String pathName = allDirs[i].toString() + File.separator + subdirs[si];
				File dir = new File( pathName );
				if ( ! dir.exists() ) {
					dir.mkdirs();
				}
				dirs.pushString( pathName );
			}
			responseParams.putArray( subdirs[si], dirs );
		}
	}
}

