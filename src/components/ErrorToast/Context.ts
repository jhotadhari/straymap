/**
 * External dependencies
 */
import { createContext } from 'react';

export type ErrorToastContextType = {
	showError: (message: string) => void;
};

export const ErrorToastContext = createContext<ErrorToastContextType>({
	showError: (_message: string) => undefined,
});
