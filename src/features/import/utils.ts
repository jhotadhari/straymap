/**
 * External dependencies
 */
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * Internal dependencies
 */
import { DatePattern } from './slice';

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
