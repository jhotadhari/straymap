const DANGEROUS = /\([^)]*[+*?]\)[+*{]/;

export interface RegexValidation {
	valid: boolean;
	dangerous: boolean;
}

export const classifyRegex = (pattern: string): RegexValidation => {
	try {
		RegExp(pattern);
	} catch {
		return { valid: false, dangerous: false };
	}
	return { valid: true, dangerous: DANGEROUS.test(pattern) };
};
