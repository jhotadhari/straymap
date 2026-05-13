/**
 * External dependencies
 */
import { isObject, set, upperCase } from 'lodash-es';

/**
 * General utils
 *
 * Used by scripts as well. So keep them clean from overhead imports.
 */

export const randomNumber = (min: number, max: number): number => Math.random() * (max - min) + min;

export const roundTo = (num: number, precision: number): number => {
	const factor = Math.pow(10, precision);
	return Math.round(num * factor) / factor;
};

export const parseSerialized = (str: string, fallback?: any): object | false => {
	fallback = fallback ? fallback : false;
	let object = fallback;
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
	orderArr: string[],
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
		strict?: false; // if strict, will only copy if existing in objOrder
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
						upperCase(objInputLabel) +
						' but in ' +
						upperCase(objOrderLabel) +
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
						'" not existing in objOrder but in objInput.' +
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
