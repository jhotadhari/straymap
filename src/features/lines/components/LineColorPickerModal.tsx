/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../store/hooks';
import { setLineColor, setLineRamp } from '../slice';
import { SLOPE_COLOR_RAMP } from '../../routing/constants';
import { PALETTE_COLORS } from '../../../constants';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import MenuItem from '../../../components/generic/wrapper/MenuItem';
import ColorRampGradient from './ColorRampGradient';
import {
	closeLineColorPicker,
	LineColorPickerState,
	subscribeLineColorPicker,
} from '../mapContextMenuSources/lineColorPickerStore';

/**
 * Always-mounted host for the line color picker opened from the map
 * context menu. Lives outside the menu sources so the modal survives the
 * menu closing after its action runs. All options render as uniform
 * rows: a slope-ramp toggle plus one row per palette colour. Selecting a
 * colour dispatches `setLineColor` (and clears any colour ramp) for the
 * line and closes the modal.
 */
const LineColorPickerModal: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const [state, setState] = useState<LineColorPickerState>(null);

	useEffect(() => subscribeLineColorPicker(setState), []);

	const handleSelect = useCallback(
		(color: string) => {
			if (state) {
				dispatch(setLineColor({ lineId: state.lineId, color }));
				// Selecting a palette colour restores solid rendering.
				dispatch(setLineRamp({ lineId: state.lineId, rampKey: null }));
			}
			closeLineColorPicker();
		},
		[dispatch, state]
	);

	const handleToggleRamp = useCallback(() => {
		if (state) {
			dispatch(
				setLineRamp({
					lineId: state.lineId,
					rampKey: state.rampActive ? null : 'slope',
				})
			);
		}
		closeLineColorPicker();
	}, [dispatch, state]);

	return (
		<ModalWrapper
			visible={!!state}
			onDismiss={closeLineColorPicker}
			headerLabel={t('lines.changeColor')}
		>
			{state && (
				<>
					{(state.rampEnabled || state.rampActive) && (
						<MenuItem
							active={state.rampActive}
							onPress={handleToggleRamp}
							IconComponent={() => (
								<View style={styles.rampThumb}>
									<ColorRampGradient ramp={SLOPE_COLOR_RAMP} />
								</View>
							)}
							title={t('lines.colorRamp')}
						/>
					)}
					{PALETTE_COLORS.map((palette) => (
						<MenuItem
							key={palette.bg}
							active={state.selectedColor === palette.bg && !state.rampActive}
							onPress={() => handleSelect(palette.bg)}
							IconComponent={() => (
								<View
									style={[
										styles.colorCircle,
										{ backgroundColor: palette.bg },
									]}
								/>
							)}
						/>
					))}
				</>
			)}
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	rampThumb: {
		width: 8,
		height: 24,
		borderRadius: 2,
		overflow: 'hidden',
	},
	colorCircle: {
		width: 24,
		height: 24,
		borderRadius: 12,
	},
});

export default LineColorPickerModal;
