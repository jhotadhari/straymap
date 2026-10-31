/**
 * Internal dependencies
 */
import { MapContextMenuContext } from '../../types';

/**
 * True when the press context carries a hit from a native map label
 * (`LayerLabel` entries surface through the map's hit aggregation with
 * `manager: 'labels'`). Native labels replaced the reanimated overlay
 * labels — their taps no longer route through a JS Pressable, so the
 * label-press detection moved to the aggregated hit payload.
 */
export const isPressOnLabel = (context: MapContextMenuContext): boolean =>
	context.hits.some((hit) => hit?.manager === 'labels');
