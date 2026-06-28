/**
 * Tests for src/store/features/dirs/utils.ts
 */

import { getDirInfoCacheId } from '../../../../store/features/dirs/utils';

// ===========================================================================
// getDirInfoCacheId
// ===========================================================================

describe('getDirInfoCacheId', () => {
	it('generates a JSON cache key from navDirs', () => {
		const params = {
			navDirs: ['/path/a', '/path/b'],
		};
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed).toHaveProperty('extensions', []);
		expect(parsed).toHaveProperty('navDirs', ['/path/a', '/path/b']);
		expect(parsed).toHaveProperty('recursive', false);
	});

	it('includes extensions when provided', () => {
		const params = {
			navDirs: ['/path'],
			extensions: ['.map', '.xml'],
		};
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed.extensions).toEqual(['.map', '.xml']);
	});

	it('defaults extensions to empty array', () => {
		const params = { navDirs: ['/path'] };
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed.extensions).toEqual([]);
	});

	it('defaults recursive to false', () => {
		const params = { navDirs: ['/path'] };
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed.recursive).toBe(false);
	});

	it('includes recursive when true', () => {
		const params = { navDirs: ['/path'], recursive: true };
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed.recursive).toBe(true);
	});

	it('produces deterministic keys with sorted object properties', () => {
		const result1 = getDirInfoCacheId({
			navDirs: ['/a', '/b'],
			recursive: false,
			extensions: [],
		});
		const result2 = getDirInfoCacheId({
			recursive: false,
			navDirs: ['/a', '/b'],
			extensions: [],
		});
		// Keys are sorted by Object.keys(paramsStrict).sort() before stringify
		expect(result1).toBe(result2);
	});

	it('produces different keys for different navDirs', () => {
		const result1 = getDirInfoCacheId({ navDirs: ['/path/a'] });
		const result2 = getDirInfoCacheId({ navDirs: ['/path/b'] });
		expect(result1).not.toBe(result2);
	});
});
