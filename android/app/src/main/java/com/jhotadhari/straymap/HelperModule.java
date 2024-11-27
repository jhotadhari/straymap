package com.jhotadhari.straymap;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.jhotadhari.reactnative.mapsforge.vtm.Utils;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

		// Subdirs
		File[] allDirs = Arrays.copyOf( externalMediaDirs, externalMediaDirs.length + filesDirs.length );
		System.arraycopy( filesDirs, 0, allDirs, externalMediaDirs.length, filesDirs.length );
		String[] subdirs = {
			"dem",
			"mapfiles",
			"mapstyles",
			"tracks",
			"marker",
			"curser",
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

