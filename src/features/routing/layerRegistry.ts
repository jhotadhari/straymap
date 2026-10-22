/**
 * Module-level registry mapping native layer entry uuids to routing
 * entities. Populated by RoutingMapView via onCreate/onRemove callbacks,
 * consumed by the map context-menu sources to correlate layer hits
 * (uuid) with segments/waypoints.
 */
export const routingLayerRegistry = {
	/** segmentRecordId ("fromId_toId") → native layer entry uuid. */
	segmentUuidByRecordId: new Map<string, string>(),
	/** routing point id → native marker entry uuid. */
	markerUuidByPointId: new Map<number, string>(),
};

/** Reverse lookup: marker entry uuid → routing point id (or null). */
export const pointIdByMarkerUuid = (uuid: string): number | null => {
	for (const [pointId, entryUuid] of routingLayerRegistry.markerUuidByPointId.entries()) {
		if (entryUuid === uuid) {
			return pointId;
		}
	}
	return null;
};

/** Reverse lookup: native layer entry uuid → segmentRecordId (or null). */
export const segmentRecordIdByUuid = (uuid: string): string | null => {
	for (const [recordId, entryUuid] of routingLayerRegistry.segmentUuidByRecordId.entries()) {
		if (entryUuid === uuid) {
			return recordId;
		}
	}
	return null;
};
