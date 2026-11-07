/**
 * External dependencies
 */
import { get, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import { LineStats as LineStatsType } from '../../types';

export type RenderPart = 'label' | 'icon' | 'value';

export const defaultRenderParts = [
	'label',
	'icon',
	'value',
] as RenderPart[];

export const ICON_SIZE = 16;

/**
 * Aggregate per-line geometry stats: additive fields (length, uphill,
 * downhill) sum, elevation extremes (minZ/maxZ) take the min/max.
 * Lines without stats simply contribute nothing.
 */
export const aggregateLineStats = (lines: { stats?: LineStatsType }[]): LineStatsType => {
	return lines.reduce<LineStatsType>((acc, line) => {
		Object.keys(line?.stats ?? {}).forEach((key) => {
			switch (key) {
				case 'length':
				case 'uphill':
				case 'downhill':
					set(acc, key, get(acc, key, 0) + get(line?.stats ?? {}, key, 0));
					break;
				case 'minZ':
				case 'maxZ': {
					const val = get(line?.stats ?? {}, key);
					if (undefined !== val) {
						const accVal = get(acc, key);
						if (
							undefined === accVal ||
							('minZ' === key && val < accVal) ||
							('maxZ' === key && val > accVal)
						) {
							set(acc, key, val);
						}
					}
					break;
				}
			}
		});
		return acc;
	}, {});
};
