/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import FileSourceRowControl from '../../../../../../components/generic/controls/FileSourceRowControl';
import HintLink from '../../../../../../components/generic/HintLink';
import { LayerConfig, LayerConfigOptionsRasterMBtiles } from '../../../types';
import { selectAppDirs } from '../../../../dirs/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectLayerTemp } from '../../../selectors';
import { setLayerTemp } from '../../../baseMapSlice';
import NumericRowControlMulti from '../../../../../../components/generic/controls/NumericRowControlMulti';

const extensions = ['mbtiles'];

const MapFileInfo: FC<{}> = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<View>
			<Text>{t('baseMap.hint.mbTilesFile')}</Text>
			<Text
				style={{
					marginTop: 20,
					...theme.fonts.bodyLarge,
				}}
			>
				{'Downloads:'}
			</Text>
			<HintLink
				label={t('.baseMap.link.openandromapsDownloadsRaster')}
				url={'https://www.openandromaps.org/en/downloads/general-maps'}
			/>
		</View>
	);
};

const LayerControlRasterMBTiles: FC<{}> = () => {
	const dispatch = useAppDispatch();
	const layerTemp = useAppSelector(selectLayerTemp) as
		| undefined
		| LayerConfig<LayerConfigOptionsRasterMBtiles>;

	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	const setOptions = useCallback((newOptions: LayerConfigOptionsRasterMBtiles) => {
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

	const handleMapFileChange = useCallback((selectedOpt?: string) => {
		layerTemp &&
			(undefined === selectedOpt ||
				selectedOpt.startsWith('/') ||
				selectedOpt.startsWith('content://')) &&
			dispatch(
				setLayerTemp(
					(layerTemp) =>
						({
							...layerTemp,

							options: {
								...layerTemp?.options,
								mapFile: selectedOpt as LayerConfigOptionsRasterMBtiles['mapFile'],
							},
						}) as LayerConfig
				)
			);
	}, []);

	const validateZoom = useCallback((val: number) => val >= 0, []);

	if (!layerTemp?.options) {
		return undefined;
	}

	return (
		<Fragment>
			<FileSourceRowControl
				header={t('baseMap.selectFile')}
				label={t('baseMap.file')}
				value={layerTemp.options?.mapFile}
				onSelect={handleMapFileChange}
				extensions={extensions}
				dirs={appDirs?.mapfiles ?? []}
				Info={<MapFileInfo />}
				filesHeading={sprintf(t('filesIn'), '(.mbtiles)')}
				noFilesHeading={sprintf(t('noFilesIn'), '(.mbtiles)')}
			/>

			<NumericRowControlMulti
				label={t('enabled')}
				optLabels={['min', 'max']}
				saveOnType={false}
				values={[
					layerTemp?.options?.enabledZoomMin ?? 0,
					layerTemp?.options?.enabledZoomMax ?? 0,
				]}
				onUpdate={(newValues) =>
					setOptions({
						...(layerTemp?.options ?? {}),
						['enabledZoomMin']: newValues[0],
						['enabledZoomMax']: newValues[1],
					})
				}
				validate={validateZoom}
				Info={t('baseMap.hint.enabled') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>
		</Fragment>
	);
};

export default LayerControlRasterMBTiles;
