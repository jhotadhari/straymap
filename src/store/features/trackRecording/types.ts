export interface TrackSettings {
	minDistance: number; // meters
	minTime: number; // seconds
	minPrecision: number; // meters (GPS accuracy threshold)
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
	lastWrittenPosition?: [number, number];
	lastWrittenTime?: number;
}

export interface Track {
	id: number;
	timestamp: string;
	line_id: number | null;
	title: string | null;
	settings: Partial<TrackSettings>;
	data: any;
}
