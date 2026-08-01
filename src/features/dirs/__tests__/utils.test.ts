/**
 * Internal dependencies
*/
import { getDirInfoCacheId } from '../../../features/dirs/utils';

/**
 * Tests for src/store/features/dirs/utils.ts
 */

describe('getDirInfoCacheId', () => {
	it('generates a JSON cache key from navDirs', () => {
		const params: any = {
			navDirs: ['/path/a', '/path/b'],
		};
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed).toHaveProperty('extensions', []);
		expect(parsed).toHaveProperty('navDirs', ['/path/a', '/path/b']);
		expect(parsed).toHaveProperty('recursive', false);
	});

	it('includes extensions when provided', () => {
		const params: any = {
			navDirs: ['/path'],
			extensions: ['.map', '.xml'],
		};
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed.extensions).toEqual(['.map', '.xml']);
	});

	it('defaults extensions to empty array', () => {
		const params: any = { navDirs: ['/path'] };
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed.extensions).toEqual([]);
	});

	it('defaults recursive to false', () => {
		const params: any = { navDirs: ['/path'] };
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed.recursive).toBe(false);
	});

	it('includes recursive when true', () => {
		const params: any = { navDirs: ['/path'], recursive: true };
		const result = getDirInfoCacheId(params);
		const parsed = JSON.parse(result);
		expect(parsed.recursive).toBe(true);
	});

	it('produces deterministic keys with sorted object properties', () => {
		const result1 = getDirInfoCacheId({
			navDirs: ['/a', '/b'],
			recursive: false,
			extensions: [],
		} as any);
		const result2 = getDirInfoCacheId({
			recursive: false,
			navDirs: ['/a', '/b'],
			extensions: [],
		} as any);
		// Keys are sorted by Object.keys(paramsStrict).sort() before stringify
		expect(result1).toBe(result2);
	});

	it('produces different keys for different navDirs', () => {
		const result1 = getDirInfoCacheId({ navDirs: ['/path/a'] } as any);
		const result2 = getDirInfoCacheId({ navDirs: ['/path/b'] } as any);
		expect(result1).not.toBe(result2);
	});
});
