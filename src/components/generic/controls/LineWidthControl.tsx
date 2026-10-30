/**
 * External dependencies
 */
import { FC, memo } from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import MenuItem from '../wrapper/MenuItem';
import { LINE_WIDTH_MAX, LINE_WIDTH_MIN, LINE_WIDTH_STEP } from '../../../lib/lineWidth';

/** Preset widths (LINE_WIDTH_MIN..MAX in LINE_WIDTH_STEP increments). */
const WIDTHS: number[] = Array.from(
	{
		length: Math.round((LINE_WIDTH_MAX - LINE_WIDTH_MIN) / LINE_WIDTH_STEP) + 1,
	},
	(_, i) => LINE_WIDTH_MIN + i * LINE_WIDTH_STEP
);

/**
 * Compact line-width picker rendered as a vertical menu of preset widths.
 * The current width is marked active; tapping an entry applies it.
 */
const LineWidthControl: FC<{
	/** Current width, marked active in the list. */
	value?: number;
	/** The feature's default width — its entry gets a "(default)" suffix. */
	defaultValue: number;
	/** Localized suffix appended to the default entry (e.g. "(default)"). */
	defaultSuffix: string;
	/** Called with the width to apply (already within bounds). */
	onApply: (width: number) => void;
}> = ({ value, defaultValue, defaultSuffix, onApply }) => {
	return (
		<View>
			{WIDTHS.map((width) => (
				<MenuItem
					key={width}
					title={
						width === defaultValue
							? `${width} ${defaultSuffix}`
							: String(width)
					}
					active={value === width}
					onPress={() => onApply(width)}
				/>
			))}
		</View>
	);
};

export default memo(LineWidthControl);
