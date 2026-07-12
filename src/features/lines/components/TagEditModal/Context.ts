/**
 * External dependencies
 */
import { createContext } from 'react';

/**
 * Internal dependencies
 */
import { Tag } from '../../types';

export type TagEditModalContextType = {
	tag?: (Tag & { line_count: number }) | null;
	onDismiss: () => void;
};

export const TagEditModalContext = createContext<TagEditModalContextType>({
	onDismiss: () => undefined,
});
