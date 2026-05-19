/**
 * External dependencies
 */
import { ElementType, ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';

export interface UiItem {
	key: string;
	icon?: string | ((props: { color: string; style: ListStyle }) => ReactNode);
	label: string;
	Component?: ElementType<{ style?: ViewStyle }>;
}
