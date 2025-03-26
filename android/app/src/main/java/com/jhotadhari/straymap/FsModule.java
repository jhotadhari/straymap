package com.jhotadhari.straymap;

import android.os.Build;
import android.os.Environment;
import android.util.Log;

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
import java.io.FileFilter;
import java.nio.file.Path;
import java.util.Iterator;

public class FsModule extends ReactContextBaseJavaModule {

	final static int APP_STORAGE_ACCESS_REQUEST_CODE = 501; // Any value

	ReactContext reactContext;

	public FsModule(@Nullable ReactApplicationContext reactContext_) {
		super(reactContext_);
		reactContext = reactContext_;
	}

	@Override
    public String getName() {
        return "FsModule";
    }

    @ReactMethod
    public void getInfo( String navDir, @Nullable ReadableArray extensions, Boolean recursive, Promise promise ) {
        try {
            WritableMap response = new WritableNativeMap();
            File path = new File( navDir );

            // navParent
			response.putString( "navParent", String.valueOf( path.getParent() ) );

			@Nullable String[] extensionsStrings =  null == extensions
				? null
				: extensions.toArrayList().toArray( new String[ 0 ] );

            // navChildren
            WritableArray navChildrenArray = new WritableNativeArray();
            if ( path.isDirectory() ) {
				Iterator<File> fileIterator = FileUtils.iterateFiles(
					path,
					extensionsStrings,
					recursive
				);
				while ( fileIterator.hasNext() ) {
					File file = fileIterator.next();
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
			response.putArray( "navChildren", navChildrenArray );

            // Return response
            promise.resolve( response );
        } catch(Exception e) {
            promise.reject("Error", e);
        }
    }

}
