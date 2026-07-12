/**
 * External dependencies
 */
import { createContext } from 'react';

/**
 * Internal dependencies
 */
import { LinePartial } from '../../types';
import { Route } from '../../../routing/types';

export type LineEditModalContextType = {
	line?: LinePartial | null;
	route?: Route | null;
	selectLine: (id: number, isSelected: boolean) => void;
	onDismiss: () => void;
	onDeleteSuccess?: (lineId?: number) => void;
};

export const LineEditModalContext = createContext<LineEditModalContextType>({
	selectLine: (_id: number, _isSelected: boolean) => undefined,
	onDismiss: () => undefined,
});
