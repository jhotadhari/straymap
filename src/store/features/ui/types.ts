/**
 * External dependencies
 */
import { ReactElement, ReactNode } from 'react';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';

export interface UiItem {
	key: string;
	icon?: string | ((props: { color: string; style: ListStyle }) => ReactNode);
	label: string;
	Component?: ReactElement;
}

