/**
 * Bridge to the error toast queue for code that runs outside the React tree
 * (DB actions, plain async helpers) and therefore can't call useContext.
 * ErrorToastProvider registers its showError as the handler on mount.
 */
let handler: ((message: string) => void) | null = null;

export const registerErrorToastHandler = (fn: ((message: string) => void) | null) => {
	handler = fn;
};

export const showErrorToast = (message: string) => {
	handler?.(message);
};
