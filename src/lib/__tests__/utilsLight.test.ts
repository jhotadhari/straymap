/**
 * Tests for src/lib/utilsLight.ts — pure utility functions with no native deps.
 */

import {
	parseSerialized,
	sortArrayByOrderArray,
	roundTo,
	randomNumber,
	sortDeep,
} from '../utilsLight';

// ===========================================================================
// parseSerialized
// ===========================================================================

describe('parseSerialized', () => {
	// Suppress expected console.log from parseSerialized error paths in __DEV__.
	let logSpy: jest.SpyInstance;
	beforeAll(() => {
		logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
	});
	afterAll(() => {
		logSpy.mockRestore();
	});

	it('parses valid JSON string', () => {
		const result = parseSerialized<{ a: number }>('{"a":1}');
		expect(result).toEqual({ a: 1 });
	});

	it('returns undefined for invalid JSON (non-strict)', () => {
		const result = parseSerialized('not-json');
		expect(result).toBeUndefined();
	});

	it('returns fallback value for invalid JSON', () => {
		const result = parseSerialized('bad', { fallback: true });
		expect(result).toEqual({ fallback: true });
	});

	it('returns fallback for empty string', () => {
		const result = parseSerialized('', []);
		expect(result).toEqual([]);
	});

	it('parses arrays', () => {
		const result = parseSerialized<number[]>('[1,2,3]');
		expect(result).toEqual([
			1,
			2,
			3,
		]);
	});

	it('parses primitives', () => {
		expect(parseSerialized('42')).toBe(42);
		expect(parseSerialized('"hello"')).toBe('hello');
		expect(parseSerialized('true')).toBe(true);
		expect(parseSerialized('null')).toBe(null);
	});

	it('returns undefined when no fallback and invalid JSON', () => {
		expect(parseSerialized('{broken')).toBeUndefined();
	});
});

// ===========================================================================
// roundTo
// ===========================================================================

describe('roundTo', () => {
	it('rounds to 0 decimal places', () => {
		expect(roundTo(3.14159, 0)).toBe(3);
	});

	it('rounds to 2 decimal places', () => {
		expect(roundTo(3.14159, 2)).toBe(3.14);
	});

	it('rounds to 4 decimal places', () => {
		expect(roundTo(3.14159, 4)).toBe(3.1416);
	});

	it('rounds up at .5', () => {
		expect(roundTo(2.5, 0)).toBe(3);
		expect(roundTo(2.675, 2)).toBe(2.68);
	});

	it('rounds down below .5', () => {
		expect(roundTo(2.49, 0)).toBe(2);
		expect(roundTo(2.674, 2)).toBe(2.67);
	});

	it('handles negative numbers', () => {
		expect(roundTo(-3.14159, 2)).toBe(-3.14);
		expect(roundTo(-2.5, 0)).toBe(-2); // Math.round(-2.5) = -2
	});

	it('handles zero', () => {
		expect(roundTo(0, 2)).toBe(0);
		expect(roundTo(0, 0)).toBe(0);
	});

	it('handles integers', () => {
		expect(roundTo(42, 3)).toBe(42);
	});
});

// ===========================================================================
// randomNumber
// ===========================================================================

describe('randomNumber', () => {
	it('returns a number within range', () => {
		for (let i = 0; i < 100; i++) {
			const val = randomNumber(10, 20);
			expect(val).toBeGreaterThanOrEqual(10);
			expect(val).toBeLessThan(20);
		}
	});

	it('returns min when min === max', () => {
		expect(randomNumber(5, 5)).toBe(5);
	});

	it('works with negative range', () => {
		for (let i = 0; i < 100; i++) {
			const val = randomNumber(-10, -5);
			expect(val).toBeGreaterThanOrEqual(-10);
			expect(val).toBeLessThan(-5);
		}
	});
});

// ===========================================================================
// sortArrayByOrderArray
// ===========================================================================

describe('sortArrayByOrderArray', () => {
	it('sorts strings by given order array', () => {
		const input = [
			'c',
			'a',
			'b',
		];
		const order = [
			'a',
			'b',
			'c',
		];
		const result = sortArrayByOrderArray(input, order);
		expect(result).toEqual([
			'a',
			'b',
			'c',
		]);
	});

	it('places unknown items at the end', () => {
		const input = [
			'x',
			'a',
			'y',
			'b',
		];
		const order = ['a', 'b'];
		const result = sortArrayByOrderArray(input, order) as string[];
		// 'a' and 'b' first in order, then 'x' and 'y' at end
		expect(result[0]).toBe('a');
		expect(result[1]).toBe('b');
		expect(result.slice(2).sort()).toEqual(['x', 'y']);
	});

	it('sorts objects by key', () => {
		const input = [
			{ id: 'c', val: 3 },
			{ id: 'a', val: 1 },
			{ id: 'b', val: 2 },
		];
		const order = [
			'a',
			'b',
			'c',
		];
		const result = sortArrayByOrderArray(input, order, 'id');
		expect(result).toEqual([
			{ id: 'a', val: 1 },
			{ id: 'b', val: 2 },
			{ id: 'c', val: 3 },
		]);
	});

	it('does not mutate input when mutate=false (default)', () => {
		const input = [
			'c',
			'a',
			'b',
		];
		const order = [
			'a',
			'b',
			'c',
		];
		sortArrayByOrderArray(input, order);
		expect(input).toEqual([
			'c',
			'a',
			'b',
		]); // unchanged
	});

	it('mutates input when mutate=true', () => {
		const input = [
			'c',
			'a',
			'b',
		];
		const order = [
			'a',
			'b',
			'c',
		];
		const result = sortArrayByOrderArray(input, order, undefined, true);
		expect(input).toEqual([
			'a',
			'b',
			'c',
		]); // mutated
		expect(result).toBe(input); // same reference
	});

	it('handles numeric order arrays', () => {
		const input = [
			{ id: 'c', val: 3 },
			{ id: 'a', val: 1 },
		];
		const order = [1, 2];
		const result = sortArrayByOrderArray(input, order, 'val');
		expect(result).toEqual([
			{ id: 'a', val: 1 },
			{ id: 'c', val: 3 },
		]);
	});

	it('handles empty arrays', () => {
		const result = sortArrayByOrderArray([], ['a', 'b']);
		expect(result).toEqual([]);
	});

	it('handles empty order array', () => {
		const input = [
			'c',
			'a',
			'b',
		];
		const result = sortArrayByOrderArray(input, []);
		// All unknown, original order preserved by stable sort? Not guaranteed.
		expect(result).toHaveLength(3);
		expect(result.sort()).toEqual([
			'a',
			'b',
			'c',
		]);
	});

	it('preserves stable ordering for items with equal order weight', () => {
		const input = ['a1', 'a2'];
		const order = ['a1', 'a2'];
		const result = sortArrayByOrderArray(input, order);
		expect(result).toEqual(['a1', 'a2']);
	});
});

// ===========================================================================
// sortDeep
// ===========================================================================

describe('sortDeep', () => {
	it('reorders top-level keys to match order object', () => {
		const input = { c: 3, a: 1, b: 2 };
		const order = { a: '', b: '', c: '' };
		const result = sortDeep(input, order);
		expect(Object.keys(result)).toEqual([
			'a',
			'b',
			'c',
		]);
	});

	it('preserves values when reordering keys', () => {
		const input = { c: 3, a: 1, b: 2 };
		const order = { a: '', b: '', c: '' };
		const result = sortDeep(input, order);
		expect(result).toEqual({ a: 1, b: 2, c: 3 });
	});

	it('reorders nested objects recursively', () => {
		const input = {
			outer: { inner2: 'b', inner1: 'a' },
		};
		const order = {
			outer: { inner1: '', inner2: '' },
		};
		const result = sortDeep(input, order);
		expect(Object.keys(result.outer)).toEqual(['inner1', 'inner2']);
	});

	it('includes keys not present in order object when strict=false', () => {
		const input = { a: 1, b: 2, extra: 3 };
		const order = { a: '', b: '' };
		const result = sortDeep(input, order);
		expect(result).toHaveProperty('a', 1);
		expect(result).toHaveProperty('b', 2);
		expect(result).toHaveProperty('extra', 3);
	});

	it('excludes keys not in order object when strict=true', () => {
		const input = { a: 1, extra: 3 };
		const order = { a: '' };
		const result = sortDeep(input, order, { strict: true });
		expect(result).toEqual({ a: 1 });
		expect(result).not.toHaveProperty('extra');
	});

	it('handles empty input object', () => {
		const result = sortDeep({}, { a: '' });
		expect(result).toEqual({});
	});

	it('handles empty order object (all keys pass through)', () => {
		const input = { a: 1, b: 2 };
		const result = sortDeep(input, {});
		expect(result).toEqual({ a: 1, b: 2 });
	});

	it('deeply nested mixed with string and object types in order', () => {
		const input = {
			level1: {
				level2b: 'val2',
				level2a: {
					deep2: 2,
					deep1: 1,
				},
			},
		};
		const order = {
			level1: {
				level2a: { deep1: '', deep2: '' },
				level2b: '',
			},
		};
		const result = sortDeep(input, order);
		const keys1 = Object.keys(result.level1);
		expect(keys1).toEqual(['level2a', 'level2b']);

		const keys2 = Object.keys(result.level1.level2a);
		expect(keys2).toEqual(['deep1', 'deep2']);
	});
});
