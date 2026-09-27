export const ALTITUDE_PROFILE_KEY_PREFIX = 'altitudeProfile:';

export const getAltitudeProfileSourceKey = {
	routing: (): string => `${ALTITUDE_PROFILE_KEY_PREFIX}routing`,
	line: (lineId: number): string => `${ALTITUDE_PROFILE_KEY_PREFIX}line:${lineId}`,
};

export type ProfileSource = { type: 'routing' } | { type: 'line'; lineId: number } | undefined;

export const getProfileSourceFromKey = (key: string | undefined): ProfileSource => {
	if (!key) {
		return undefined;
	}
	if (key === `${ALTITUDE_PROFILE_KEY_PREFIX}routing`) {
		return { type: 'routing' };
	}
	const match = key.match(/^altitudeProfile:line:(\d+)$/);
	if (match) {
		return { type: 'line', lineId: parseInt(match[1], 10) };
	}
	return undefined;
};

// ── Per-profile settings (persisted) ──────────────────────────────────

export type ProfileXMode = 'distance' | 'time';
export type ProfileSeriesValue = 'none' | 'elevation' | 'slope';
export type ProfileColorMode = 'axis' | 'primary' | 'secondary';
export type ProfileRatioMode = 'auto' | 'fixed';

export interface ProfileSettings {
	primary: ProfileSeriesValue;
	primaryColor: ProfileColorMode;
	secondary: ProfileSeriesValue;
	secondaryColor: ProfileColorMode;
	xMode: ProfileXMode;
	ratioMode: ProfileRatioMode;
	/** Fixed aspect ratio (visible x-range per visible y-range unit). */
	ratioValue?: number;
	showLabel: boolean;
	showStats: boolean;
	blendColors: boolean;
}

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
	primary: 'elevation',
	primaryColor: 'axis',
	secondary: 'none',
	secondaryColor: 'axis',
	xMode: 'distance',
	ratioMode: 'auto',
	ratioValue: undefined,
	showLabel: true,
	showStats: true,
	blendColors: false,
};
