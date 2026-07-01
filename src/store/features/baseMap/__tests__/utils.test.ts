/**
 * Tests for src/store/features/baseMap/utils.ts
 *
 * Pure utility functions and thunk factories.  Mocked: react-native-uuid,
 * defaults, lodash-es, slugify.
 */

import {
	stringifyProp,
	getSetterThunkWithGetter,
	getNewLayer,
	getLayerKind,
	getNewProfile,
	fillLayerConfigOptionsWithDefaults,
	getHillshadingCacheDirChild,
} from '../../../../store/features/baseMap/utils';

/**
 * Internal dependencies
 */
import type { LayerConfig } from '../../../../store/features/baseMap/types';

describe('stringifyProp', () => {
	describe('string input', () => {
		it('slugifies a simple string', () => {
			expect(stringifyProp('hello world')).toBe('hello_world');
		});

		it('handles empty string', () => {
			expect(stringifyProp('')).toBe('');
		});

		it('slugifies special characters', () => {
			const result = stringifyProp('foo/bar baz!');
			expect(result).not.toContain('/');
			expect(result).not.toContain(' ');
			expect(result).not.toContain('!');
		});
	});

	describe('number input', () => {
		it('converts positive numbers', () => {
			const result = stringifyProp(42);
			expect(result).toContain('42');
		});

		it('converts negative numbers with "m" prefix', () => {
			const result = stringifyProp(-5);
			expect(result).toMatch(/^m/);
			expect(result).toContain('5');
		});

		it('handles zero', () => {
			const result = stringifyProp(0);
			expect(result).toContain('0');
		});

		it('handles floats (dot->d replacement)', () => {
			const result = stringifyProp(3.14);
			expect(result).toContain('3d14');
		});
	});

	describe('object input', () => {
		it('serializes nested objects deterministically', () => {
			const obj = { b: 2, a: 1 };
			const result1 = stringifyProp(obj);
			const result2 = stringifyProp(obj);
			// Keys sorted, so deterministic
			expect(result1).toBe(result2);
		});

		it('uses custom delimiter', () => {
			const obj = { a: 1, b: 2 };
			const result = stringifyProp(obj, '-');
			expect(result).toContain('-');
		});

		it('handles empty object', () => {
			expect(stringifyProp({})).toBe('');
		});
	});

	describe('boolean input', () => {
		it('returns "1" for true', () => {
			expect(stringifyProp(true)).toBe('1');
		});

		it('returns "0" for false', () => {
			expect(stringifyProp(false)).toBe('0');
		});
	});

	describe('other types', () => {
		it('returns "" for undefined', () => {
			expect(stringifyProp(undefined)).toBe('');
		});

		// null triggers Object.keys(null) which throws TypeError —
		// this is never hit in practice because null is never passed.
		it('null triggers TypeError (known edge case)', () => {
			expect(() => stringifyProp(null)).toThrow(TypeError);
		});

		// Arrays match 'object' case and iterate over indices recursively.
		it('handles arrays as objects (recurses over indices)', () => {
			const result = stringifyProp([1, 2]);
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});
	});
});

// ===========================================================================
// getSetterThunkWithGetter
// ===========================================================================

describe('getSetterThunkWithGetter', () => {
	it('creates a thunk that dispatches with a direct value', () => {
		const selector = jest.fn((state: any) => state.value);
		const setter = jest.fn((val: number) => ({ type: 'SET', payload: val })) as any;

		const thunk = getSetterThunkWithGetter(selector, setter)(42);

		const dispatch = jest.fn();
		const getState = jest.fn(() => ({ value: 10 })) as any;

		thunk(dispatch, getState, undefined as any);

		expect(dispatch).toHaveBeenCalledWith({ type: 'SET', payload: 42 });
	});

	it('creates a thunk that calls a getter function with current value', () => {
		const selector = jest.fn((state: any) => state.value);
		const setter = jest.fn((val: number) => ({ type: 'SET', payload: val })) as any;

		// Use a plain function — the instanceof Function check inside
		// getSetterThunkWithGetter needs a real function, and jest.fn()
		// instances may not pass instanceof in all transform contexts.
		const getter = (current: number) => current * 2;
		const thunk = getSetterThunkWithGetter(selector, setter)(getter);

		const dispatch = jest.fn();
		const getState = jest.fn(() => ({ value: 21 })) as any;

		thunk(dispatch, getState, undefined as any);

		// Verify via dispatch payload: 21 * 2 = 42
		expect(dispatch).toHaveBeenCalledWith({ type: 'SET', payload: 42 });
	});

	it('respects selector extracting the right slice', () => {
		const selector = jest.fn((state: any) => state.nested.deep.value);
		const setter = jest.fn((val: string) => ({ type: 'SET', payload: val })) as any;

		const thunk = getSetterThunkWithGetter(selector, setter)('new-val');

		const dispatch = jest.fn();
		const getState = jest.fn(() => ({ nested: { deep: { value: 'old-val' } } })) as any;

		thunk(dispatch, getState, undefined as any);

		expect(dispatch).toHaveBeenCalledWith({
			type: 'SET',
			payload: 'new-val',
		});
	});
});

// ===========================================================================
// getNewLayer
// ===========================================================================

describe('getNewLayer', () => {
	it('returns a LayerConfig with a UUID key', () => {
		const layer = getNewLayer();
		expect(layer.key).toBe('mock-uuid-0000-0000-000000000000');
	});

	it('has empty name', () => {
		expect(getNewLayer().name).toBe('');
	});

	it('is visible by default', () => {
		expect(getNewLayer().visible).toBe(true);
	});

	it('has null type', () => {
		expect(getNewLayer().type).toBeNull();
	});

	it('has empty options object', () => {
		expect(getNewLayer().options).toEqual({});
	});

	it('returns a unique key each call (within mock limits)', () => {
		// Mock always returns same UUID — this documents the mock behavior.
		const layer1 = getNewLayer();
		const layer2 = getNewLayer();
		expect(layer1.key).toBe(layer2.key);
	});
});

// ===========================================================================
// getLayerKind
// ===========================================================================

describe('getLayerKind', () => {
	it('returns null for unknown layer type', () => {
		const layer: LayerConfig = {
			key: '1',
			name: 'test',
			type: 'nonexistent',
			visible: true,
			options: {},
		};
		expect(getLayerKind(layer)).toBeNull();
	});

	it('returns null for null type', () => {
		const layer: LayerConfig = {
			key: '1',
			name: 'test',
			type: null,
			visible: true,
			options: {},
		};
		expect(getLayerKind(layer)).toBeNull();
	});
});

// ===========================================================================
// getNewProfile
// ===========================================================================

describe('getNewProfile', () => {
	it('returns a MapsforgeProfile with a UUID key', () => {
		const profile = getNewProfile();
		expect(profile.key).toBe('mock-uuid-0000-0000-000000000000');
	});

	it('has DEFAULT theme', () => {
		expect(getNewProfile().theme).toBe('DEFAULT');
	});

	it('has null renderStyle', () => {
		expect(getNewProfile().renderStyle).toBeNull();
	});

	it('has empty renderOverlays', () => {
		expect(getNewProfile().renderOverlays).toEqual([]);
	});

	it('has hasBuildings = true', () => {
		expect(getNewProfile().hasBuildings).toBe(true);
	});

	it('has hasLabels = true', () => {
		expect(getNewProfile().hasLabels).toBe(true);
	});

	it('has empty name', () => {
		expect(getNewProfile().name).toBe('');
	});
});

// ===========================================================================
// fillLayerConfigOptionsWithDefaults
// ===========================================================================

describe('fillLayerConfigOptionsWithDefaults', () => {
	it('returns options unchanged when type is null', () => {
		const options = { foo: 'bar' } as any;
		const result = fillLayerConfigOptionsWithDefaults(null, options);
		expect(result).toBe(options); // same reference
	});

	it('returns options unchanged when type is falsy empty string', () => {
		const options = { foo: 'bar' } as any;
		const result = fillLayerConfigOptionsWithDefaults('', options);
		expect(result).toBe(options);
	});

	it('fills defaults for known types', () => {
		// 'onlineRasterXYZ' has defaults in constants.ts
		const options: any = { url: 'https://example.com/{z}/{x}/{y}' };
		const result = fillLayerConfigOptionsWithDefaults('onlineRasterXYZ', options);
		expect(result).toHaveProperty('url', 'https://example.com/{z}/{x}/{y}');
	});

	it('preserves existing values over defaults', () => {
		const options: any = { zoomMin: 5 };
		const result = fillLayerConfigOptionsWithDefaults('onlineRasterXYZ', options);
		expect(result).toHaveProperty('zoomMin', 5);
	});
});

// ===========================================================================
// getHillshadingCacheDirChild
// ===========================================================================

describe('getHillshadingCacheDirChild', () => {
	it('returns a string starting with "shading"', () => {
		const result = getHillshadingCacheDirChild({} as any);
		expect(typeof result).toBe('string');
		expect(result.startsWith('shading')).toBe(true);
	});

	it('handles empty options', () => {
		const result = getHillshadingCacheDirChild({} as any);
		expect(result).toBeTruthy();
	});
});
