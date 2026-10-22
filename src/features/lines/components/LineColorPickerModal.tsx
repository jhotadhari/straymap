/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../store/hooks';
import { setLineColor } from '../slice';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import ColorPaletteInline from '../../../components/generic/controls/ColorPaletteInline';
import {
	closeLineColorPicker,
	LineColorPickerState,
	subscribeLineColorPicker,
} from '../mapContextMenuSources/lineColorPickerStore';

/**
 * Always-mounted host for the line color picker opened from the map
 * context menu. Lives outside the menu sources so the modal survives the
 * menu closing after its action runs. Selecting a swatch dispatches
 * `setLineColor` for the line and closes the modal.
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
			}
			closeLineColorPicker();
		},
		[dispatch, state]
	);

	return (
		<ModalWrapper
			visible={!!state}
			onDismiss={closeLineColorPicker}
			headerLabel={t('lines.changeColor')}
		>
			{state && (
				<ColorPaletteInline
					selectedColor={state.selectedColor}
					onSelect={handleSelect}
				/>
			)}
		</ModalWrapper>
	);
};

export default LineColorPickerModal;
