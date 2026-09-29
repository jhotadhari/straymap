/**
 * Tests for drawers connectStorage — obsolete drawer key filtering.
 */

/**
 * Internal dependencies
 */
import { filterObsoleteDrawerKeys } from '../connectStorage';

describe('filterObsoleteDrawerKeys', () => {
	it('filters out obsolete keys, keeps valid ones in order', () => {
		expect(
			filterObsoleteDrawerKeys([
				'searchPlace',
				'maps',
				'brouter',
				'routing',
			])
		).toEqual(['maps', 'routing']);
	});

	it('returns empty array when all keys are obsolete', () => {
		expect(
			filterObsoleteDrawerKeys([
				'searchPlace',
				'brouter',
				'position',
			])
		).toEqual([]);
	});

	it('returns empty array for empty input', () => {
		expect(filterObsoleteDrawerKeys([])).toEqual([]);
	});

	it('keeps valid keys unchanged', () => {
		expect(filterObsoleteDrawerKeys(['lines', 'maps'])).toEqual(['lines', 'maps']);
	});
});
