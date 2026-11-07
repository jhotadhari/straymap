import { buildLinePoints, firstTimeIso } from '../utils';

describe('import utils — buildLinePoints', () => {
	const coords: [number, number][] = [
		[8.0, 50.0],
		[8.001, 50.0],
		[8.002, 50.0],
	];

	const times = [
		new Date('2023-01-01T08:00:00Z').getTime(),
		new Date('2023-01-01T08:00:10Z').getTime(),
		new Date('2023-01-01T08:00:20Z').getTime(),
	];

	it('builds rows with derived segment speeds', () => {
		const rows = buildLinePoints(7, coords, times);
		expect(rows).toHaveLength(3);
		expect(rows[0]).toEqual({
			line_id: 7,
			point_index: 0,
			timestamp: times[0],
			speed: null,
		});
		// ~71.5 m per 0.001° of longitude at 50° latitude, over 10 s →
		// ~7.15 m/s for both segments.
		expect(rows[1].speed).toBeCloseTo(7.15, 1);
		expect(rows[2].speed).toBeCloseTo(7.15, 1);
	});

	it('returns [] for missing/misaligned times', () => {
		expect(buildLinePoints(1, coords, null)).toEqual([]);
		expect(buildLinePoints(1, coords, [times[0]])).toEqual([]);
		expect(buildLinePoints(1, coords, [])).toEqual([]);
	});

	it('leaves speed null on zero/negative time gaps', () => {
		const rows = buildLinePoints(1, coords, [
			times[0],
			times[0],
			times[1],
		]);
		expect(rows[1].speed).toBeNull();
		expect(rows[2].speed).not.toBeNull();
	});
});

describe('import utils — firstTimeIso', () => {
	it('returns the ISO string of the first timestamp or null', () => {
		expect(firstTimeIso(null)).toBeNull();
		expect(firstTimeIso([])).toBeNull();
		expect(firstTimeIso([new Date('2023-01-01T08:00:00Z').getTime()])).toBe(
			'2023-01-01T08:00:00.000Z'
		);
	});
});
