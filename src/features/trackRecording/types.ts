export interface TrackSettings {
	minDistance: number; // meters
	minTime: number; // seconds
	minPrecision: number; // meters (GNSS accuracy threshold)
}

export interface TrackRecordingState {
	initialized: boolean;
	isRecording: boolean;
	activeTrackId: number | null;
	activeLineId: number | null;
	minDistance: number;
	minTime: number;
	minPrecision: number;
	recordingStartTime: number | null;
	lastWrittenPosition?: [
		number,
		number,
		number?,
	];
	lastWrittenTime?: number;
}

export interface Track {
	id: number;
	line_id: number | null;
	title: string | null;
	settings: Partial<TrackSettings>;
	data: any;
}

/**
 * Per-point metadata captured from a native GNSS fix (persisted to
 * `track_points`).  `timestamp` is the fix time, `gnssAltitude` the raw
 * fix altitude (independent of the DEM-resolved geometry Z), and
 * `elevationSource` records which source produced that Z.
 */
export interface TrackPointMeta {
	timestamp: number;
	gnssAltitude: number | null;
	elevationSource: 'dem' | 'gnss' | 'none';
	accuracy: number;
	bearing: number;
}

/**
 * One `track_points` row as written by the recording write path.
 * Property names match the drizzle schema columns (snake_case), so the
 * object is directly usable in `.values()`.  `speed` is derived from
 * the previous stored point (m/s), not the GNSS-reported fix speed.
 */
export interface TrackPointInput {
	track_id: number;
	line_id: number;
	point_index: number;
	timestamp: number;
	/** Derived segment speed (m/s), or null when there is no baseline
	 * (first point of a session / after a resume). */
	speed: number | null;
	accuracy: number | null;
	bearing: number | null;
	gnss_altitude: number | null;
	elevation_source: 'dem' | 'gnss' | 'none';
	data?: any;
}

/**
 * Track-level summary cached in `tracks.data` (written on stop, verified
 * against the raw data on read).  Recomputed from track_points +
 * geometry whenever missing or stale — it is a cache, never a source of
 * truth.
 */
export interface TrackSummary {
	/** First point fix time (ms epoch). */
	startTime: number | null;
	/** Last point fix time (ms epoch). */
	endTime: number | null;
	/** Wall-clock span between first and last point (includes pauses). */
	totalDurationMs: number | null;
	/** Sum of inter-point gaps <= PAUSE_GAP_THRESHOLD_MS. */
	movingDurationMs: number | null;
	/** totalDuration - movingDuration. */
	pauseDurationMs: number | null;
	distanceM: number;
	/** distance / movingDuration (m/s), or null when there is no movement. */
	avgSpeedMps: number | null;
	/** Highest per-segment derived speed (m/s). */
	maxSpeedMps: number | null;
	ascentM: number;
	descentM: number;
	pointCount: number;
	minElevation: number | null;
	maxElevation: number | null;
}
