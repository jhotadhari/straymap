/**
 * External dependencies
 */
import { NativeModules } from 'react-native';

/**
 * Internal dependencies
 */
import { LINKING_ERROR } from './constants';

export const HelperModule = NativeModules.HelperModule
	? NativeModules.HelperModule
	: new Proxy(
		{},
		{
			get() {
				throw new Error( LINKING_ERROR );
			},
		},
	);

export const FsModule = NativeModules.FsModule
	? NativeModules.FsModule
	: new Proxy(
		{},
		{
			get() {
				throw new Error( LINKING_ERROR );
			},
		},
	);