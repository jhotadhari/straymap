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
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import RadioListItem from '../../../../../../components/generic/RadioListItem';
import { AlternativeButtonType } from '../../../../../../components/generic/controls/FileSourceRowControl';
import { MapsforgeProfile } from '../../../types';
import { OptionBase } from '../../../../../../types';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { setMapsforgeProfileTemp } from '../../../baseMapSlice';
import { selectMapsforgeProfileTemp, selectRenderStylesCache } from '../../../selectors';

const Option: FC<{
	opt: OptionBase;
	setOverlays: (newRenderOverlays: string[]) => void;
}> = ({ opt, setOverlays }) => {
	const theme = useTheme();
	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);
	const isSelected = profileTemp?.renderOverlays?.includes(opt.key);

	return (
		<RadioListItem
			key={opt.key}
			opt={opt}
			onPress={() => {
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
			}}
			labelStyle={theme.fonts.bodyMedium}
			labelExtractor={(a) => a.label}
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
	}, [opts]);

	const handleSelectAllNone = useCallback(() => {
		dispatch(
			setMapsforgeProfileTemp((profileTemp) => {
				let newOverlays: string[] = [];
				if (profileTemp && profileTemp.renderOverlays.length < opts.length) {
					newOverlays = [...opts].map((opt) => opt.key);
				}
				return {
					...(profileTemp ?? {}),
					renderOverlays: newOverlays,
				} as MapsforgeProfile;
			})
		);
	}, [opts]);

	const setOverlays = useCallback((newRenderOverlays: string[]) => {
		dispatch(
			setMapsforgeProfileTemp(
				(profileTemp) =>
					(({
                        ...(profileTemp ?? {}),
                        renderOverlays: newRenderOverlays
                    }) as MapsforgeProfile)
			)
		);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	return !modalVisible ? undefined : (
		<ModalWrapper
			visible={modalVisible}
			backgroundBlur={false}
			onDismiss={handleDismissModal}
			header={header || label}
		>
			<View style={styles.modalControlsTop}>
				{profileTemp &&
					profileTemp.renderOverlays.length > 0 &&
					profileTemp.renderOverlays.length < opts.length && (
						<ButtonHighlight
							onPress={handleToggleSelection}
							mode="contained"
							buttonColor={get(theme.colors, 'primaryContainer')}
							textColor={get(theme.colors, 'onPrimaryContainer')}
						>
							<Text>{t('baseMap.select.toggle')}</Text>
						</ButtonHighlight>
					)}

				<ButtonHighlight
					style={styles.leftAuto}
					onPress={handleSelectAllNone}
					mode="contained"
					buttonColor={get(theme.colors, 'primaryContainer')}
					textColor={get(theme.colors, 'onPrimaryContainer')}
				>
					<Text>
						{t(
							profileTemp && profileTemp.renderOverlays.length < opts.length
								? 'baseMap.select.all'
								: 'baseMap.select.none'
						)}
					</Text>
				</ButtonHighlight>
			</View>

			{[...opts].map((opt) => (
				<Option
					key={opt.key}
					opt={opt}
					setOverlays={setOverlays}
				/>
			))}

			<ButtonHighlight
				style={styles.modalControls}
				onPress={handleDismissModal}
				mode="contained"
				buttonColor={get(theme.colors, 'successContainer')}
				textColor={get(theme.colors, 'onSuccessContainer')}
			>
				<Text>{t('ok')}</Text>
			</ButtonHighlight>
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
			const optsMap: { [value: string]: string } = get(
				renderStyleOptions,
				[profileTemp.renderStyle, 'options'],
				{}
			) as { [value: string]: string };
			return Object.keys(optsMap).map((key) => ({ key, label: optsMap[key] }));
		}
		return [];
	}, [
		profileTemp?.theme,
		profileTemp?.renderStyle,
		renderStyleOptions,
	]);

	const handleOpenModal = useCallback(() => setModalVisible(true), []);

	if (!opts.length && !AlternativeButton) {
		return undefined;
	}

	return (
		<InfoRowControl
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
						disabled={!opts.length}
						style={styles.contentBtn}
						onPress={handleOpenModal}
					>
						{profileTemp && (
							<Text>
								{opts.length === profileTemp.renderOverlays.length
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
											)}
							</Text>
						)}
					</ButtonHighlight>
				)}

				{AlternativeButton && <AlternativeButton setModalVisible={setModalVisible} />}
			</View>
		</InfoRowControl>
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
