package com.jhotadhari.straymap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;

import java.io.File;
import java.util.Arrays;

@ReactModule(name = HelperModule.NAME)
public class HelperModule extends NativeHelperModuleSpec {

	public static final String NAME = "HelperModule";

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

		// internalCacheDirs ... it's just one. But as array with one element to not confuse types.
		WritableArray internalCacheDirs = new WritableNativeArray();
		internalCacheDirs.pushString( getReactApplicationContext().getCacheDir().toString() );
		responseParams.putArray( "internalCacheDirs", internalCacheDirs );

		// Subdirs
		File[] publicDirs = Arrays.copyOf( externalMediaDirs, externalMediaDirs.length + filesDirs.length );
		System.arraycopy( filesDirs, 0, publicDirs, externalMediaDirs.length, filesDirs.length );
		String[] subDirs = {
			"dem",
			"mapfiles",
			"databases",
			"mapstyles",
			"export",
			"marker",
			"cursor",
		};
		for ( int si = 0; si < subDirs.length; si++ ) {
			WritableArray dirs = new WritableNativeArray();
			if ( "databases".equals( subDirs[ si ] ) ) {
				String pathName = getReactApplicationContext().getApplicationInfo().dataDir + File.separator + subDirs[si];
				File dir = new File( pathName );
				if ( ! dir.exists() ) {
					dir.mkdirs();
				}
				dirs.pushString( pathName );
			}
			for ( int i = 0; i < publicDirs.length; i++ ) {
				String pathName = publicDirs[i].toString() + File.separator + subDirs[si];
				File dir = new File( pathName );
				if ( ! dir.exists() ) {
					dir.mkdirs();
				}
				dirs.pushString( pathName );
			}
			responseParams.putArray( subDirs[si], dirs );
		}
	}
}

