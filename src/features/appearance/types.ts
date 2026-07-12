/**
 * External dependencies
 */
import { MD3Theme } from 'react-native-paper/lib/typescript/types';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../types';

export type CursorConfig = {
	iconSource: string;
	size: number;
	color: string;
};

export interface ThemePropExtended extends MD3Theme {
	label?: string;
}

export interface ThemeOption extends OptionBase {
	value: ThemePropExtended;
}
