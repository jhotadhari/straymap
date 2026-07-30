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
import FileSourceRowControl from '../../../../../components/generic/controls/FileSourceRowControl';
import HintLink from '../../../../../components/generic/primitives/HintLink';
import { LayerConfig, LayerConfigOptionsRasterMBtiles } from '../../../types';
import { selectAppDirs } from '../../../../dirs/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { selectLayerTemp } from '../../../selectors';
import { setLayerTemp } from '../../../slice';
import NumericRowControlMulti from '../../../../../components/generic/controls/NumericRowControlMulti';

const extensions = ['mbtiles'];
const validateZoom = (val: number) => val >= 0;
const zoomOptLabels = ['min', 'max'];

const MapFileInfo: FC<{}> = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const style = useMemo(
		() => ({
			marginTop: 20,
			...theme.fonts.bodyLarge,
		}),
		[theme]
	);

	return (
		<View>
			<Text>{t('baseMap.hint.mbTilesFile')}</Text>
			<Text style={style}>{t('downloads') + ':'}</Text>
			<HintLink
				label={t('baseMap.link.openandromapsDownloadsRaster')}
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

	const setOptions = useCallback(
		(newOptions: LayerConfigOptionsRasterMBtiles) => {
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
		},
		[
			dispatch,
		]
	);

	const handleMapFileChange = useCallback(
		(selectedOpt?: string) => {
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
									mapFile:
										selectedOpt as LayerConfigOptionsRasterMBtiles['mapFile'],
								},
							}) as LayerConfig
					)
				);
		},
		[dispatch, layerTemp]
	);

	const enabledZoomValues = useMemo(
		() => [layerTemp?.options?.enabledZoomMin ?? 0, layerTemp?.options?.enabledZoomMax ?? 0],
		[layerTemp?.options?.enabledZoomMin, layerTemp?.options?.enabledZoomMax]
	);

	const handleEnabledZoomUpdate = useCallback(
		(newValues: number[]) =>
			setOptions({
				...(layerTemp?.options ?? {}),
				['enabledZoomMin']: newValues[0],
				['enabledZoomMax']: newValues[1],
			}),
		[layerTemp?.options, setOptions]
	);

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
				warningIfUnset={true}
			/>

			<NumericRowControlMulti
				label={t('enabled')}
				optLabels={zoomOptLabels}
				saveOnType={false}
				values={enabledZoomValues}
				onUpdate={handleEnabledZoomUpdate}
				validate={validateZoom}
				Info={t('baseMap.hint.enabled') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>
		</Fragment>
	);
};

// Derive a fallback label from the layer's MBTiles file (filename without path and extension).
export const getPlaceholderLabel = (layer: LayerConfig) => {
	const mapFile = (layer.options as LayerConfigOptionsRasterMBtiles)?.mapFile;
	return mapFile ? mapFile.split('/').pop()?.replace(/\.[^.]*$/, '') || mapFile : undefined;
};

export default LayerControlRasterMBTiles;
