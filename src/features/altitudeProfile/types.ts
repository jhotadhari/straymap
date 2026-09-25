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
