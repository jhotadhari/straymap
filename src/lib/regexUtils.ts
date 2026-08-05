const DANGEROUS = /\([^)]*[+*?]\)[+*{]/;

export interface RegexCheckOptions {
	checkEmpty?: boolean;
	checkCaptureGroup?: boolean;
	checkEmptyCaptureGroup?: boolean;
}

export interface RegexValidation {
	valid: boolean;
	dangerous: boolean;
	hasCaptureGroup?: boolean;
	hasEmptyGroup?: boolean;
}

export const classifyRegex = (
	pattern: string,
	options?: RegexCheckOptions
): RegexValidation => {
	let valid = true;
	try {
		RegExp(pattern);
	} catch {
		valid = false;
	}

	const dangerous = valid && DANGEROUS.test(pattern);
	const result: RegexValidation = { valid, dangerous };

	if (options?.checkCaptureGroup && valid) {
		result.hasCaptureGroup = pattern.includes('(');
	}
	if (options?.checkEmptyCaptureGroup && result.hasCaptureGroup) {
		result.hasEmptyGroup = /\(\)/.test(pattern);
	}

	return result;
};

export interface RegexValidationMessage {
	key: string;
	isError: boolean;
}

export const getRegexWarnings = (
	pattern: string,
	options?: RegexCheckOptions
): RegexValidationMessage | null => {
	if (options?.checkEmpty && !pattern)
		return { key: 'regex.empty', isError: true };
	if (!pattern) return null;
	const cls = classifyRegex(pattern, options);
	if (!cls.valid) return { key: 'regex.invalid', isError: true };
	if (options?.checkCaptureGroup && cls.hasCaptureGroup === false)
		return { key: 'regex.noCaptureGroup', isError: false };
	if (options?.checkEmptyCaptureGroup && cls.hasEmptyGroup)
		return { key: 'regex.emptyGroup', isError: true };
	if (cls.dangerous) return { key: 'regex.expensive', isError: true };
	return null;
};
