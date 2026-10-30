/**
 * External dependencies
 */
import { FC, useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Popover from 'react-native-popover-view';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLineWidth } from '../../selectors';
import { setLineWidth, DEFAULT_RECORDING_LINE_WIDTH } from '../../slice';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import LineWidthControl from '../../../../components/generic/controls/LineWidthControl';

/**
 * Recording line-width picker: a button showing the current width that
 * opens a popover with the preset `LineWidthControl` menu. Renders only
 * the anchor + popover — wrap it in an InfoLabelRow (settings) or a row
 * (drawer panel) as the caller prefers.
 */
const RecordingLineWidthControl: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const lineWidth = useAppSelector(selectLineWidth);

	const [visible, setVisible] = useState(false);
	const anchorRef = useRef<View>(null);

	const handleApply = useCallback(
		(width: number) => {
			dispatch(setLineWidth(width));
			setVisible(false);
		},
		[dispatch]
	);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { nestedIconColor, ...buttonProps } = useButtonProps({
		mode: 'outlined',
		paddingHorizontal: true,
	});

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
		}),
		[theme]
	);

	return (
		<>
			<View ref={anchorRef}>
				<ButtonHighlight
					{...buttonProps}
					compact
					onPress={() => setVisible(true)}
				>
					{String(lineWidth)}
				</ButtonHighlight>
			</View>
			{anchorRef.current && (
				<Popover
					popoverStyle={popoverStyle}
					arrowSize={arrowSize}
					isVisible={visible}
					onRequestClose={() => setVisible(false)}
					from={anchorRef as React.RefObject<React.Component<{}, {}, any>>}
					animationConfig={animationConfig}
				>
					<LineWidthControl
						value={lineWidth}
						defaultValue={DEFAULT_RECORDING_LINE_WIDTH}
						defaultSuffix={t('trackRecording.lineWidthDefaultSuffix')}
						onApply={handleApply}
					/>
				</Popover>
			)}
		</>
	);
};

const animationConfig = {
	duration: 0,
};
const arrowSize = { height: 0, width: 0 };

export default RecordingLineWidthControl;
