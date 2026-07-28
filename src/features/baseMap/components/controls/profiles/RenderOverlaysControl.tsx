/**
 * External dependencies
 */
import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../../../components/generic/wrapper/ModalWrapper';
import RadioListItem from '../../../../../components/generic/wrapper/RadioListItem';
import { AlternativeButtonType } from '../../../../../components/generic/controls/FileSourceRowControl';
import { MapsforgeProfile } from '../../../types';
import { OptionBase } from '../../../../../types';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { setMapsforgeProfileTemp } from '../../../slice';
import { selectMapsforgeProfileTemp, selectRenderStylesCache } from '../../../selectors';
import { useButtonProps } from '../../../../../compose/useButtonProps';

const labelExtractor = (a: OptionBase) => a.label;

const Option: FC<{
	opt: OptionBase;
	setOverlays: (newRenderOverlays: string[]) => void;
}> = ({ opt, setOverlays }) => {
	const theme = useTheme();
	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);
	const isSelected = profileTemp?.renderOverlays?.includes(opt.key);

	const handlePress = useCallback(() => {
		if (!profileTemp) {
			return;
		}

		if (isSelected) {
			const newSelectedOpts = [...profileTemp.renderOverlays];
			const index = newSelectedOpts.findIndex((optKey) => optKey === opt.key);
			if (index !== -1) {
				newSelectedOpts.splice(index, 1);
			}
			setOverlays(newSelectedOpts);
		} else {
			setOverlays([...profileTemp.renderOverlays, opt.key]);
		}
	}, [
		profileTemp,
		isSelected,
		opt.key,
		setOverlays,
	]);

	return (
		<RadioListItem
			key={opt.key}
			opt={opt}
			onPress={handlePress}
			labelStyle={theme.fonts.bodyMedium}
			labelExtractor={labelExtractor}
			status={isSelected ? 'checked' : 'unchecked'}
		/>
	);
};

const ControlModal: FC<{
	modalVisible: boolean;
	setModalVisible: Dispatch<SetStateAction<boolean>>;
	label: string;
	header?: string;
	opts: OptionBase[];
}> = ({ modalVisible, setModalVisible, label, header, opts }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();
	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);

	const handleToggleSelection = useCallback(() => {
		dispatch(
			setMapsforgeProfileTemp((profileTemp) => {
				return {
					...(profileTemp ?? {}),
					renderOverlays: [...opts]
						.filter((opt) => !profileTemp?.renderOverlays?.includes(opt.key))
						.map((opt) => opt.key),
				} as MapsforgeProfile;
			})
		);
	}, [dispatch, opts]);

	const handleSelectAllNone = useCallback(() => {
		dispatch(
			setMapsforgeProfileTemp((profileTemp) => {
				let newOverlays: string[] = [];
				if (profileTemp && profileTemp.renderOverlays.length < opts.length) {
					newOverlays = opts.map((opt) => opt.key);
				}
				return {
					...(profileTemp ?? {}),
					renderOverlays: newOverlays,
				} as MapsforgeProfile;
			})
		);
	}, [dispatch, opts]);

	const setOverlays = useCallback(
		(newRenderOverlays: string[]) => {
			dispatch(
				setMapsforgeProfileTemp(
					(profileTemp) =>
						({
							...(profileTemp ?? {}),
							renderOverlays: newRenderOverlays,
						}) as MapsforgeProfile
				)
			);
		},
		[
			dispatch,
		]
	);

	const handleDismissModal = useCallback(() => setModalVisible(false), [setModalVisible]);

	const buttonProps = useButtonProps({});

	return !modalVisible ? undefined : (
		<ModalWrapper
			visible={modalVisible}
			backgroundBlur={false}
			onDismiss={handleDismissModal}
			headerLabel={header || label}
		>
			<View style={styles.modalControlsTop}>
				{profileTemp &&
				profileTemp.renderOverlays.length > 0 &&
				profileTemp.renderOverlays.length < opts.length ? (
					<ButtonHighlight
						{...buttonProps}
						onPress={handleToggleSelection}
					>
						{t('baseMap.select.toggle')}
					</ButtonHighlight>
				) : (
					<View />
				)}

				<ButtonHighlight
					{...buttonProps}
					onPress={handleSelectAllNone}
				>
					{t(
						profileTemp && profileTemp.renderOverlays.length < opts.length
							? 'baseMap.select.all'
							: 'baseMap.select.none'
					)}
				</ButtonHighlight>
			</View>

			{opts.map((opt) => (
				<Option
					key={opt.key}
					opt={opt}
					setOverlays={setOverlays}
				/>
			))}
		</ModalWrapper>
	);
};

const RenderOverlaysControl: FC<{
	Info?: ReactNode | string;
	label: string;
	header?: string;
	AlternativeButton?: AlternativeButtonType;
}> = ({ Info, label, header, AlternativeButton = null }) => {
	const { t } = useTranslation();

	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);

	const [modalVisible, setModalVisible] = useState(false);

	const renderStyleOptionsMap = useAppSelector(selectRenderStylesCache).optionsMap;

	const renderStyleOptions = useMemo(() => {
		return profileTemp?.theme ? renderStyleOptionsMap[profileTemp.theme] : undefined;
	}, [profileTemp?.theme, renderStyleOptionsMap]);

	const opts = useMemo(() => {
		if (profileTemp && profileTemp.theme && profileTemp.renderStyle && renderStyleOptions) {
			const overlays =
				renderStyleOptions.find((opt) => opt.value === profileTemp.renderStyle)?.overlays ??
				[];
			return overlays.map((overlay) => ({ key: overlay.value, label: overlay.label }));
		}
		return [];
	}, [
		renderStyleOptions,
		profileTemp,
	]);

	const handleOpenModal = useCallback(() => setModalVisible(true), []);

	const buttonProps = useButtonProps({
		disabled: !opts.length,
	});

	if (!opts.length && !AlternativeButton) {
		return undefined;
	}

	return (
		<InfoLabelRow
			label={label}
			Info={Info}
		>
			{modalVisible && (
				<ControlModal
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
					label={label}
					header={header}
					opts={opts}
				/>
			)}

			<View style={styles.content}>
				{!AlternativeButton && (
					<ButtonHighlight
						{...buttonProps}
						onPress={handleOpenModal}
					>
						{profileTemp &&
							(opts.length === profileTemp.renderOverlays.length
								? t('baseMap.selected.all')
								: 0 === profileTemp.renderOverlays.length
									? t('baseMap.selected.none')
									: t(
											profileTemp.renderOverlays
												? sprintf(
														t('baseMap.selected.count'),
														profileTemp.renderOverlays.length +
															'/' +
															opts.length
													)
												: 'baseMap.selected.none'
										))}
					</ButtonHighlight>
				)}

				{AlternativeButton && <AlternativeButton setModalVisible={setModalVisible} />}
			</View>
		</InfoLabelRow>
	);
};

const styles = StyleSheet.create({
	content: { flexDirection: 'row', alignItems: 'center' },
	contentBtn: { marginTop: 3 },
	modalControlsTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
		marginBottom: 40,
	},
	modalControls: {
		marginTop: 10,
		marginBottom: 40,
	},
	leftAuto: { marginLeft: 'auto' },
});

export default RenderOverlaysControl;
