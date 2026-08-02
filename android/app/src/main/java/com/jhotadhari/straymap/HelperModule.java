package com.jhotadhari.straymap;
import android.app.Activity;
import android.graphics.drawable.ColorDrawable;
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

	protected WritableMap createMap() {
		return new WritableNativeMap();
	}

	protected WritableArray createArray() {
		return new WritableNativeArray();
	}

	@ReactMethod
	public void getAppDirs(
		Promise promise
	) {
		WritableMap responseParams = createMap();

		// appInternal
		WritableArray dirs = createArray();
		dirs.pushString( getReactApplicationContext().getApplicationInfo().dataDir );
		responseParams.putArray( "appInternal", dirs );

		addAppSubDirsToResponse( responseParams );

		promise.resolve( responseParams );
	};

	@ReactMethod
	public void setWindowBackgroundColor(String color) {
		getReactApplicationContext().runOnUiQueueThread(new Runnable() {
			@Override
			public void run() {
				Activity activity = getCurrentActivity();
				if (activity != null) {
					try {
						int parsedColor = android.graphics.Color.parseColor(color);
						activity.getWindow().setBackgroundDrawable(new ColorDrawable(parsedColor));
					} catch (IllegalArgumentException e) {
						// Invalid color string — ignore silently
					}
				}
			}
		});
	}

	public void addAppSubDirsToResponse( WritableMap responseParams ) {
		// externalMediaDirs
		File[] externalMediaDirs = getReactApplicationContext().getExternalMediaDirs();
		WritableArray externalMediaDirsArray = createArray();
		for ( int i = 0; i < externalMediaDirs.length; i++ ) {
			externalMediaDirsArray.pushString( externalMediaDirs[i].toString() );
		}
		responseParams.putArray( "externalMediaDirs", externalMediaDirsArray );
		// externalFileDirs
		File[] filesDirs = getReactApplicationContext().getExternalFilesDirs( null );
		WritableArray externalFileDirsArray = createArray();
		for ( int i = 0; i < filesDirs.length; i++ ) {
			externalFileDirsArray.pushString( filesDirs[i].toString() );
		}
		responseParams.putArray( "externalFileDirs", externalFileDirsArray );
		// externalCacheDirs
		File[] externalCacheDirs = getReactApplicationContext().getExternalCacheDirs();
		WritableArray externalCacheDirsArray = createArray();
		for ( int i = 0; i < externalCacheDirs.length; i++ ) {
			externalCacheDirsArray.pushString( externalCacheDirs[i].toString() );
		}
		responseParams.putArray( "externalCacheDirs", externalCacheDirsArray );

		// internalCacheDirs ... it's just one. But as array with one element to not confuse types.
		WritableArray internalCacheDirs = createArray();
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
			"import",
		};
		for ( int si = 0; si < subDirs.length; si++ ) {
			WritableArray dirs = createArray();
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

