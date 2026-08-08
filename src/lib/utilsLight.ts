/**
 * External dependencies
 */
import { isObject, set } from 'lodash-es';

/**
 * Used by scripts as well. So keep them light clean from overhead imports.
 */

/**
 */

/**
 * Converts a CSS rgb() or rgba() string to a 6-digit hex color (alpha is
 * discarded — the output is always opaque).  Returns `#000000` for any input
 * that doesn't match the expected format.
 *
 * @example
 * rgbStrToHex('rgb(208, 188, 255)')       // '#d0bcff'
 * rgbStrToHex('rgba(208, 188, 255, 0.5)') // '#d0bcff'
 * rgbStrToHex('rgb(0, 0, 0)')             // '#000000'
 * rgbStrToHex('garbage')                   // '#000000'
 */
export const rgbStrToHex = (rgbStr: string): string => {
	const match = rgbStr.match(
		/rgba?\s*\(\s*(-?\d{1,3})\s*,\s*(-?\d{1,3})\s*,\s*(-?\d{1,3})\s*(?:,\s*[\d.]+)?\s*\)/i
	);
	if (!match) {
		return '#000000';
	}
	const toHex = (n: string) => {
		const val = Math.min(255, Math.max(0, parseInt(n, 10)));
		return val.toString(16).padStart(2, '0');
	};
	return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
};

export const randomNumber = (min: number, max: number): number => Math.random() * (max - min) + min;

export const roundTo = (num: number, precision: number): number => {
	const factor = Math.pow(10, precision);
	return Math.round(num * factor) / factor;
};

export const parseSerialized = <T>(str: string, fallback?: T): T | undefined => {
	let object = fallback ?? undefined;
	try {
		object = JSON.parse(str);
	} catch (e) {
		if (__DEV__) {
			console.log('Error parseSerialized', e);
		}
		object = object;
	}
	return object;
};

// Sort array of strings or objects based on another array.
export const sortArrayByOrderArray = (
	inputArr: (string | { [key: string]: any })[],
	orderArr: (string | number)[],
	key?: string,
	mutate?: boolean
) => {
	return (mutate ? inputArr : [...inputArr]).sort((a, b) => {
		const aVal = isObject(a) && key ? a[key] : a;
		const bVal = isObject(b) && key ? b[key] : b;
		// Get sort order from orderArr.
		let aIndex = orderArr.indexOf(aVal);
		let bIndex = orderArr.indexOf(bVal);
		// If not found in orderArr, move to the end.
		if (aIndex === -1 && bIndex !== -1) {
			aIndex = bIndex + 1;
		} else if (aIndex !== -1 && bIndex === -1) {
			bIndex = aIndex + 1;
		}
		// return aIndex > bIndex ? 1 : bIndex < aIndex ? -1 : 0;
		return aIndex - bIndex;
	});
};

export const sortDeep = (
	objInput: { [key: string]: any },
	objOrder: { [key: string]: any },
	options?: {
		verbose?:
			| false
			| {
					objInputLabel?: string;
					objOrderLabel?: string;
			  };
		strict?: boolean; // if strict, will only copy if existing in objOrder
	},
	parentKeys?: string[]
): { [key: string]: any } => {
	const { verbose, strict } = {
		verbose: false,
		strict: false,
		...(options ?? {}),
	};
	const { objInputLabel, objOrderLabel } = {
		objInputLabel: 'input',
		objOrderLabel: 'order',
		...('object' === typeof verbose ? verbose : {}),
	};

	parentKeys = parentKeys ?? [];

	// Object.keys( objInput )
	const objInputKeysOrdered = sortArrayByOrderArray(
		Object.keys(objInput),
		Object.keys(objOrder)
	) as string[];

	const result: { [key: string]: any } = {};
	if (verbose) {
		Object.keys(objOrder).forEach((key) => {
			if (!objInput.hasOwnProperty(key)) {
				console.log(
					'Warning: Key "' +
						[...parentKeys, key].join('.') +
						'" not existing in ' +
						objInputLabel +
						' but in ' +
						objOrderLabel +
						''
				);
			}
		});
	}

	objInputKeysOrdered.forEach((key) => {
		if (!objOrder.hasOwnProperty(key)) {
			if (verbose) {
				console.log(
					'Warning: Key "' +
						[...parentKeys, key].join('.') +
						'" not existing in ' +
						objOrderLabel +
						' but in ' +
						objInputLabel +
						'.' +
						(strict ? ' Removed in result' : '')
				);
			}
			if (!strict) {
				set(result, key, objInput[key]);
			}
			return;
		}
		if ('string' === typeof objOrder[key]) {
			set(result, key, objInput[key]);
			return;
		}
		if ('object' === typeof objOrder[key]) {
			set(result, key, sortDeep(objInput[key], objOrder[key], options, [...parentKeys, key]));
			return;
		}
	});
	return result;
};
