/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get, invert } from 'lodash-es';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { LayerHillshading, ShadingAlgorithmOptions } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import { OptionBase } from '../../../../../../types';
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import NumericRowControl from '../../../../../../components/generic/controls/NumericRowControl';
import ListItemMenuControl from '../../../../../../components/generic/controls/ListItemMenuControl';
import { styles as mdStyles } from '../../../../../../markdown/styles';
import HintLink from '../../../../../../components/generic/HintLink';
import { LayerConfigOptionsHillshading, LayerConfig } from '../../../types';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { setLayerTemp } from '../../../baseMapSlice';
import { selectLayerTemp } from '../../../selectors';

const algorithmLinks = {
	CLASY_ADAPTIVE:
		'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/AdaptiveClasyHillShading.java',
	CLASY_STANDARD:
		'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/StandardClasyHillShading.java',
	CLASY_SIMPLE:
		'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/SimpleClasyHillShading.java',
	CLASY_HALF_RES:
		'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/HalfResClasyHillShading.java',
	CLASY_HI_RES:
		'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/HiResClasyHillShading.java',
	SIMPLE: 'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/SimpleShadingAlgorithm.java',
	DIFFUSE_LIGHT:
		'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/DiffuseLightShadingAlgorithm.java',
};

const HillshadingAlgorithmControl: FC<{}> = () => {
	const dispatch = useAppDispatch();

	const layerTemp = useAppSelector(selectLayerTemp) as
		| undefined
		| LayerConfig<LayerConfigOptionsHillshading>;

	const setOptions = useCallback((newOptions: LayerConfigOptionsHillshading) => {
		dispatch(
			setLayerTemp(
				(layerTemp) =>
					layerTemp &&
					({
						...layerTemp,
						options: newOptions,
					} as LayerConfig)
			)
		);
	}, []);

	const options = layerTemp?.options ?? {};

	const { t } = useTranslation();
	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState(false);
	const [algoInfo, setAlgoInfo] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);

	const opts: OptionBase[] = useMemo(
		() =>
			Object.keys(LayerHillshading.shadingAlgorithms).map((key) => ({
				key: LayerHillshading.shadingAlgorithms[key],
				label: t('baseMap.shadingAlgorithms.' + key + '.label'),
			})),
		[
			t,
		]
	);

	const handleShadingAlgorithmChange = useCallback((newValue?: string) => {
		dispatch(
			setLayerTemp(
				(layerTemp) =>
					layerTemp &&
					({
						...layerTemp,
						options: {
							...layerTemp.options,
							shadingAlgorithm: newValue,
						},
					} as LayerConfig)
			)
		);
	}, []);

	const [algOpts, setAlgOpts] = useState<ShadingAlgorithmOptions>(
		options.shadingAlgorithmOptions || ({} as ShadingAlgorithmOptions)
	);

	useEffect(() => {
		if (algOpts) {
			setOptions({
				...options,
				shadingAlgorithmOptions: algOpts,
			});
		}
	}, [algOpts]);

	const shadingAlgoKey = get(
		invert(LayerHillshading.shadingAlgorithms),
		options?.shadingAlgorithm || '',
		''
	);

	const shadingAlgorithmsOptionKeys = get(
		LayerHillshading.shadingAlgorithmsOptionKeys,
		shadingAlgoKey,
		[]
	) as string[];

	const toggleAlgoInfo = useCallback(() => setAlgoInfo((algoInfo) => !algoInfo), []);

	return (
		<InfoRowControl
			label={t('baseMap.algorithm')}
			Info={t('baseMap.hint.shadingAlgorithm')}
		>
			{modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					backgroundBlur={false}
					onDismiss={() => setModalVisible(false)}
					header={t('baseMap.shadingAlgorithm')}
				>
					<View style={styles.content}>
						<InfoRowControl
							label={t('baseMap.algorithm')}
							onLabelPress={toggleAlgoInfo}
						>
							<ListItemMenuControl
								options={opts}
								listItemStyle={{
									marginLeft: 0,
									paddingLeft: 10,
								}}
								value={layerTemp?.options?.shadingAlgorithm}
								setValue={handleShadingAlgorithmChange}
								anchorLabel={get(
									opts.find((opt) => opt.key === options.shadingAlgorithm),
									'label',
									''
								)}
							/>
						</InfoRowControl>

						{algoInfo && shadingAlgoKey && (
							<View
								style={{
									...get(mdStyles(theme), 'blockquote'),
									marginTop: -10,
									marginBottom: 20,
									paddingVertical: 10,
									marginLeft: 0,
								}}
							>
								<Text>
									{t('baseMap.shadingAlgorithms.' + shadingAlgoKey + '.info')}
								</Text>
								{get(algorithmLinks, shadingAlgoKey) && (
									<HintLink
										label={t('More information, read the code') + ':'} // ??? missing translation
										url={get(algorithmLinks, shadingAlgoKey)}
									/>
								)}
							</View>
						)}

						{shadingAlgorithmsOptionKeys.includes('linearity') && (
							<NumericRowControl
								label={t('baseMap.shadingOptions.linearity.label')}
								value={algOpts?.linearity ?? 0}
								onUpdate={(newValue) => {
									setAlgOpts((algOpts) => ({ ...algOpts, linearity: newValue }));
								}}
								numType="float"
								Info={t('baseMap.shadingOptions.linearity.hint')}
							/>
						)}

						{shadingAlgorithmsOptionKeys.includes('scale') && (
							<NumericRowControl
								label={t('baseMap.shadingOptions.scale.label')}
								value={algOpts?.scale ?? 0}
								onUpdate={(newValue) => {
									setAlgOpts((algOpts) => ({ ...algOpts, scale: newValue }));
								}}
								validate={(val) => val > 0}
								numType="float"
								Info={t('baseMap.shadingOptions.scale.hint')}
							/>
						)}

						{shadingAlgorithmsOptionKeys.includes('heightAngle') && (
							<NumericRowControl
								label={t('baseMap.shadingOptions.heightAngle.label')}
								value={algOpts?.heightAngle ?? 0}
								onUpdate={(newValue) => {
									setAlgOpts((algOpts) => ({
										...algOpts,
										heightAngle: newValue,
									}));
								}}
								validate={(val) => val >= 0 && val <= 90}
								Info={t('baseMap.shadingOptions.heightAngle.hint')}
							/>
						)}

						{shadingAlgorithmsOptionKeys.includes('maxSlope') && (
							<NumericRowControl
								label={t('baseMap.shadingOptions.maxSlope.label')}
								value={algOpts?.maxSlope ?? 0}
								onUpdate={(newValue) => {
									setAlgOpts((algOpts) => ({ ...algOpts, maxSlope: newValue }));
								}}
								validate={(val) => val > 0 && val < 100}
								numType="float"
								Info={t('baseMap.shadingOptions.maxSlope.hint')}
							/>
						)}

						{shadingAlgorithmsOptionKeys.includes('minSlope') && (
							<NumericRowControl
								label={t('baseMap.shadingOptions.minSlope.label')}
								value={algOpts?.minSlope ?? 0}
								onUpdate={(newValue) => {
									setAlgOpts((algOpts) => ({ ...algOpts, minSlope: newValue }));
								}}
								validate={(val) => val >= 0 && val < 100}
								numType="float"
								Info={t('baseMap.shadingOptions.minSlope.hint')}
							/>
						)}

						{shadingAlgorithmsOptionKeys.includes('asymmetryFactor') && (
							<NumericRowControl
								label={t('baseMap.shadingOptions.asymmetryFactor.label')}
								value={algOpts?.asymmetryFactor ?? 0}
								onUpdate={(newValue) => {
									setAlgOpts((algOpts) => ({
										...algOpts,
										asymmetryFactor: newValue,
									}));
								}}
								validate={(val) => val >= 0 && val <= 1}
								numType="float"
								Info={t('baseMap.shadingOptions.asymmetryFactor.hint')}
							/>
						)}

						{(shadingAlgorithmsOptionKeys.includes('qualityScale') ||
							shadingAlgorithmsOptionKeys.includes('readingThreadsCount') ||
							shadingAlgorithmsOptionKeys.includes('computingThreadsCount')) && (
							<Fragment>
								<InfoRowControl
									label={
										showAdvanced
											? t('advancedSettingsHide')
											: t('advancedSettingsShow')
									}
									onLabelPress={() => setShowAdvanced(!showAdvanced)}
								/>

								{showAdvanced && (
									<Fragment>
										{shadingAlgorithmsOptionKeys.includes('qualityScale') && (
											<NumericRowControl
												label={t(
													'baseMap.shadingOptions.qualityScale.label'
												)}
												value={algOpts?.qualityScale ?? 0}
												onUpdate={(newValue) => {
													setAlgOpts((algOpts) => ({
														...algOpts,
														qualityScale: newValue,
													}));
												}}
												validate={(val) => val >= 0 && val <= 1}
												numType="float"
												Info={t('baseMap.shadingOptions.qualityScale.hint')}
											/>
										)}

										{shadingAlgorithmsOptionKeys.includes(
											'readingThreadsCount'
										) && (
											<NumericRowControl
												label={t(
													'baseMap.shadingOptions.readingThreadsCount.label'
												)}
												value={algOpts?.readingThreadsCount ?? 0}
												onUpdate={(newValue) => {
													setAlgOpts((algOpts) => ({
														...algOpts,
														readingThreadsCount: newValue,
													}));
												}}
												validate={(val) => val > 0 || val === -1}
												Info={t(
													'baseMap.shadingOptions.readingThreadsCount.hint'
												)}
											/>
										)}

										{shadingAlgorithmsOptionKeys.includes(
											'computingThreadsCount'
										) && (
											<NumericRowControl
												label={t(
													'baseMap.shadingOptions.computingThreadsCount.label'
												)}
												value={algOpts?.computingThreadsCount ?? 0}
												onUpdate={(newValue) => {
													setAlgOpts((algOpts) => ({
														...algOpts,
														computingThreadsCount: newValue,
													}));
												}}
												validate={(val) => val > 0 || val === -1}
												Info={t(
													'baseMap.shadingOptions.computingThreadsCount.hint'
												)}
											/>
										)}
									</Fragment>
								)}
							</Fragment>
						)}

						<ButtonHighlight
							style={styles.controls}
							onPress={() => {
								setModalVisible(false);
							}}
							mode="contained"
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Text>{t('ok')}</Text>
						</ButtonHighlight>
					</View>
				</ModalWrapper>
			)}

			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<ButtonHighlight
					style={{ marginTop: 3 }}
					onPress={() => setModalVisible(true)}
				>
					<Text>
						{t(
							layerTemp?.options?.shadingAlgorithm
								? get(
										opts.find(
											(opt) =>
												opt.key === layerTemp?.options?.shadingAlgorithm
										),
										'label',
										''
									)
								: 'selected.none'
						)}
					</Text>
				</ButtonHighlight>
			</View>
		</InfoRowControl>
	);
};

const styles = StyleSheet.create({
	content: {
		gap: 32,
	},
	controls: {
		marginBottom: 40,
	},
});

export default HillshadingAlgorithmControl;
