/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
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
import InfoRowControl from '../../../../../../components/generic/InfoRowControl';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import { NumericRowControl } from '../../../../../../components/generic/NumericRowControls';
import ListItemMenuControl from '../../../../../../components/generic/ListItemMenuControl';
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
				label: t('shadingAlgorithms.' + key + '.label'),
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
			label={t('algorithm')}
			Info={t('hint.maps.shadingAlgorithm')}
		>
			{modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					backgroundBlur={false}
					onDismiss={() => setModalVisible(false)}
					onHeaderBackPress={() => setModalVisible(false)}
					header={t('shadingAlgorithm')}
				>
					<InfoRowControl
						label={t('algorithm')}
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
							<Text>{t('shadingAlgorithms.' + shadingAlgoKey + '.info')}</Text>
							{get(algorithmLinks, shadingAlgoKey) && (
								<HintLink
									label={t('More information, read the code') + ':'}
									url={get(algorithmLinks, shadingAlgoKey)}
								/>
							)}
						</View>
					)}

					{shadingAlgorithmsOptionKeys.includes('linearity') && (
						<NumericRowControl
							label={t('shadingOptions.linearity.label')}
							optKey={'linearity'}
							options={algOpts}
							setOptions={setAlgOpts}
							numType="float"
							Info={t('shadingOptions.linearity.hint')}
						/>
					)}

					{shadingAlgorithmsOptionKeys.includes('scale') && (
						<NumericRowControl
							label={t('shadingOptions.scale.label')}
							optKey={'scale'}
							options={algOpts}
							setOptions={setAlgOpts}
							validate={(val) => val > 0}
							numType="float"
							Info={t('shadingOptions.scale.hint')}
						/>
					)}

					{shadingAlgorithmsOptionKeys.includes('heightAngle') && (
						<NumericRowControl
							label={t('shadingOptions.heightAngle.label')}
							optKey={'heightAngle'}
							options={algOpts}
							setOptions={setAlgOpts}
							validate={(val) => val >= 0 && val <= 90}
							Info={t('shadingOptions.heightAngle.hint')}
						/>
					)}

					{shadingAlgorithmsOptionKeys.includes('maxSlope') && (
						<NumericRowControl
							label={t('shadingOptions.maxSlope.label')}
							optKey={'maxSlope'}
							options={algOpts}
							setOptions={setAlgOpts}
							validate={(val) => val > 0 && val < 100}
							numType="float"
							Info={t('shadingOptions.maxSlope.hint')}
						/>
					)}

					{shadingAlgorithmsOptionKeys.includes('minSlope') && (
						<NumericRowControl
							label={t('shadingOptions.minSlope.label')}
							optKey={'minSlope'}
							options={algOpts}
							setOptions={setAlgOpts}
							validate={(val) => val >= 0 && val < 100}
							numType="float"
							Info={t('shadingOptions.minSlope.hint')}
						/>
					)}

					{shadingAlgorithmsOptionKeys.includes('asymmetryFactor') && (
						<NumericRowControl
							label={t('shadingOptions.asymmetryFactor.label')}
							optKey={'asymmetryFactor'}
							options={algOpts}
							setOptions={setAlgOpts}
							validate={(val) => val >= 0 && val <= 1}
							numType="float"
							Info={t('shadingOptions.asymmetryFactor.hint')}
						/>
					)}

					{(shadingAlgorithmsOptionKeys.includes('qualityScale') ||
						shadingAlgorithmsOptionKeys.includes('readingThreadsCount') ||
						shadingAlgorithmsOptionKeys.includes('computingThreadsCount')) && (
						<View>
							<InfoRowControl
								label={
									showAdvanced
										? t('advancedSettingsHide')
										: t('advancedSettingsShow')
								}
								onLabelPress={() => setShowAdvanced(!showAdvanced)}
							/>

							{showAdvanced && (
								<View>
									{shadingAlgorithmsOptionKeys.includes('qualityScale') && (
										<NumericRowControl
											label={t('shadingOptions.qualityScale.label')}
											optKey={'qualityScale'}
											options={algOpts}
											setOptions={setAlgOpts}
											validate={(val) => val >= 0 && val <= 1}
											numType="float"
											Info={t('shadingOptions.qualityScale.hint')}
										/>
									)}

									{shadingAlgorithmsOptionKeys.includes(
										'readingThreadsCount'
									) && (
										<NumericRowControl
											label={t('shadingOptions.readingThreadsCount.label')}
											optKey={'readingThreadsCount'}
											options={algOpts}
											setOptions={setAlgOpts}
											validate={(val) => val > 0 || val === -1}
											Info={t('shadingOptions.readingThreadsCount.hint')}
										/>
									)}

									{shadingAlgorithmsOptionKeys.includes(
										'computingThreadsCount'
									) && (
										<NumericRowControl
											label={t('shadingOptions.computingThreadsCount.label')}
											optKey={'computingThreadsCount'}
											options={algOpts}
											setOptions={setAlgOpts}
											validate={(val) => val > 0 || val === -1}
											Info={t('shadingOptions.computingThreadsCount.hint')}
										/>
									)}
								</View>
							)}
						</View>
					)}

					<ButtonHighlight
						style={{ marginTop: 30 }}
						onPress={() => {
							setModalVisible(false);
						}}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('ok')}</Text>
					</ButtonHighlight>
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

export default HillshadingAlgorithmControl;
