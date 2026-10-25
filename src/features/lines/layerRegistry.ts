/**
 * Module-level registry mapping native LayerPath entry uuids to line ids.
 * Populated by LinesMapView via onCreate/onRemove callbacks, consumed by
 * the map context-menu line source to correlate layer hits (uuid) with
 * lines.
 */
export const linesLayerRegistry = {
	/** line id → native LayerPath entry uuid. */
	pathUuidByLineId: new Map<number, string>(),
};

/** Reverse lookup: native layer entry uuid → line id (or null). */
export const lineIdByPathUuid = (uuid: string): number | null => {
	for (const [lineId, entryUuid] of linesLayerRegistry.pathUuidByLineId.entries()) {
		if (entryUuid === uuid) {
			return lineId;
		}
	}
	return null;
};
