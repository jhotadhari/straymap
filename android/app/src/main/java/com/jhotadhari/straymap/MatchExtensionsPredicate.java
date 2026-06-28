package com.jhotadhari.straymap;

import android.os.Build;

import java.nio.file.Path;
import java.util.function.Predicate;

public class MatchExtensionsPredicate implements Predicate<Path> {

	private final String[] extensions;

	// Package-private so tests in the same package can bypass the SDK guard
	// without needing anonymous subclasses for every predicate instance.
	boolean sdkAtLeastO = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;

	public MatchExtensionsPredicate(String[] extensions) {
		for ( int i = 0; i < extensions.length; i++ ) {
			if (!extensions[i].startsWith(".")) {
				extensions[i] = "." + extensions[i];
			}
			extensions[i] = extensions[i].toLowerCase();
		}
		this.extensions = extensions;
	}

	protected boolean isAtLeastO() {
		return sdkAtLeastO;
	}

	@Override
	public boolean test(Path path) {
		if (path == null) {
			return false;
		}
		boolean isMatch = false;
		if ( isAtLeastO() ) {
			for ( String extension : this.extensions ) {
				if ( !isMatch ) {
					isMatch = path.getFileName()
						.toString()
						.toLowerCase()
						.endsWith( extension );
				}
			}
		}
		return isMatch;
	}
}