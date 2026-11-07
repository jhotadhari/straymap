/**
 * External dependencies
 */
import { Position } from 'geojson';
import dayjs from '../../lib/dayjs';

/**
 * Internal dependencies
 */
import { haversineDistance } from '../../lib/formatting';
import { LinePointInput } from '../lines/db/actionsLinePoints';
import { DatePattern } from './types';

const MONTH_NAME_MAP: Record<string, string> = {
	jan: 'Jan',
	januar: 'January',
	feb: 'Feb',
	februar: 'February',
	mär: 'Mar',
	märz: 'March',
	mar: 'Mar',
	march: 'March',
	apr: 'Apr',
	april: 'April',
	mai: 'May',
	may: 'May',
	jun: 'Jun',
	juni: 'June',
	jul: 'Jul',
	juli: 'July',
	aug: 'Aug',
	august: 'August',
	sep: 'Sep',
	sept: 'Sep',
	september: 'September',
	okt: 'Oct',
	oktober: 'October',
	nov: 'Nov',
	november: 'November',
	dez: 'Dec',
	dezember: 'December',
};

const normalizeMonthNames = (str: string): string =>
	str.replace(/[A-Za-zäöüß]{2,}/g, (m) => MONTH_NAME_MAP[m.toLowerCase()] ?? m);

/**
 * Tries to extract a date from a filename using the provided patterns in order.
 * Each pattern's regex must contain one capturing group. The captured string is
 * parsed with Day.js using the pattern's format string. Returns an ISO string
 * or null if no pattern matches.
 */
export const extractDateFromFilename = (
	filename: string,
	patterns: DatePattern[]
): string | null => {
	for (const { regex, format } of patterns) {
		if (!regex) continue;
		try {
			const re = new RegExp(regex);
			const match = filename.match(re);
			if (!match?.[1]) continue;
			const captured = normalizeMonthNames(match[1]);
			const parsed = dayjs(captured, format, true);
			if (parsed.isValid()) {
				return parsed.toISOString();
			}
		} catch {
			/* invalid regex — skip */
		}
	}
	return null;
};

export const extractDateWithPattern = (
	filename: string,
	patterns: DatePattern[]
): { date: string | null; patternName: string | null } => {
	for (const { regex, format, label } of patterns) {
		if (!regex) continue;
		try {
			const re = new RegExp(regex);
			const match = filename.match(re);
			if (!match?.[1]) continue;
			const captured = normalizeMonthNames(match[1]);
			const parsed = dayjs(captured, format, true);
			if (parsed.isValid()) {
				return { date: parsed.toISOString(), patternName: label };
			}
		} catch {
			/* invalid regex — skip */
		}
	}
	return { date: null, patternName: null };
};

/**
 * Build line_points rows for one imported line from its coordinates and
 * aligned per-point timestamps.  Segment speed (m/s) is derived from
 * the haversine distance between consecutive points — same model as
 * trackRecording's derived speed.  Returns [] when the times are
 * missing or misaligned (no usable time metadata).
 */
export const buildLinePoints = (
	lineId: number,
	coordinates: Position[],
	times: number[] | null
): LinePointInput[] => {
	if (!times || times.length !== coordinates.length || times.length < 2) {
		return [];
	}
	const rows: LinePointInput[] = [];
	for (let i = 0; i < coordinates.length; i++) {
		let speed: number | null = null;
		if (i > 0) {
			const dtMs = times[i] - times[i - 1];
			if (dtMs > 0) {
				const distM = haversineDistance(
					[coordinates[i - 1][0], coordinates[i - 1][1]],
					[coordinates[i][0], coordinates[i][1]]
				);
				speed = distM / (dtMs / 1000);
			}
		}
		rows.push({
			line_id: lineId,
			point_index: i,
			timestamp: times[i],
			speed,
		});
	}
	return rows;
};

/**
 * ISO string of the first timestamp, or null.  Used as the fallback
 * custom_date for imported lines when no date is extracted from the
 * filename — the track's start time beats the SQL current_timestamp
 * default.
 */
export const firstTimeIso = (times: number[] | null): string | null => {
	if (!times || !times.length) return null;
	return new Date(times[0]).toISOString();
};
