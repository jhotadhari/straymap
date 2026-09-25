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
export type ProfilePrimarySeries = 'elevation';
export type ProfileSecondarySeries = 'none' | 'slope';
export type ProfileColorMode = 'axis' | 'slope';

export interface ProfileSettings {
	primary: ProfilePrimarySeries;
	secondary: ProfileSecondarySeries;
	xMode: ProfileXMode;
	colorMode: ProfileColorMode;
}

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
	primary: 'elevation',
	secondary: 'none',
	xMode: 'distance',
	colorMode: 'axis',
};
