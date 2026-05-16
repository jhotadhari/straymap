/**
 * External dependencies
 */
import { createContext } from 'react';

export type ControlContextType = {
	position?: string;
};

export const ControlContext = createContext<ControlContextType>({});
