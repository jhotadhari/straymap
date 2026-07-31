/**
 * External dependencies
 */
import { FC, Fragment, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Linking, StyleSheet, View, TextInputProps } from 'react-native';
import { Text, useTheme, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import dayjs from 'dayjs';
import LucideIcons from '@react-native-vector-icons/lucide/static';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../../types';
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import CacheControl from './CacheControl';
import { defaults } from '../../../defaults';
import {
	TextInputNativeMultiline,
	TextInputNativeMultilineControlled,
} from '../../../../../components/generic/primitives/TextInputNativeMultiline';
import { LayerConfig, LayerConfigOptionsOnlineRasterXYZ } from '../../../types';
import { useLayerTemp } from '../../../hooks/useLayerTemp';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { selectLayerTemp } from '../../../selectors';
import { setLayerTemp } from '../../../slice';
import NumericRowControlMulti from '../../../../../components/generic/controls/NumericRowControlMulti';
import { stringifyProp } from '../../../utils';
import ButtonHighlightMenuControl from '../../../../../components/generic/wrapper/ButtonHighlightMenuControl';

interface SourceOption extends OptionBase {
	url?: `http://${string}` | `https://${string}`;
	Attribution?: () => ReactElement;
}

const AttributionGoogle = () => {
	const theme = useTheme();
	const linkStyle = useMemo(() => ({ color: get(theme.colors, 'link') }), [theme]);
	return (
		<View>
			<Image
				source={
					theme.dark
						? require('../../../../../assets/images/google_on_non_white.png')
						: require('../../../../../assets/images/google_on_white.png')
				}
			/>
			<Text
				style={linkStyle}
				onPress={() => Linking.openURL('https://cloud.google.com/maps-platform/terms')}
			>
				&copy; Map data ©{dayjs().format('YYYY')} Google
			</Text>
		</View>
	);
};

export const sourceOptions: SourceOption[] = [
	{
		key: 'OpenStreetMap',
		label: 'OpenStreetMap',
		url: 'https://tile.openstreetmap.org/{Z}/{X}/{Y}.png',
		Attribution: () => {
			const theme = useTheme();
			const linkStyle = useMemo(() => ({ color: get(theme.colors, 'link') }), [theme]);
			return (
				<Text
					style={linkStyle}
					onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}
				>
					&copy; OpenStreetMap contributors
				</Text>
			);
		},
	},
	{
		key: 'OpenTopoMap',
		label: 'OpenTopoMap',
		url: 'https://a.tile.opentopomap.org/{Z}/{X}/{Y}.png',
		Attribution: () => {
			const theme = useTheme();
			const linkStyle = useMemo(() => ({ color: get(theme.colors, 'link') }), [theme]);
			return (
				<View>
					<Text
						style={linkStyle}
						onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}
					>
						&copy; OpenStreetMap contributors
					</Text>
					<Text
						style={linkStyle}
						onPress={() => Linking.openURL('http://viewfinderpanoramas.org')}
					>
						SRTM
					</Text>
					<Text
						style={linkStyle}
						onPress={() => Linking.openURL('https://opentopomap.org')}
					>
						Map style: &copy; OpenTopoMap
					</Text>
					<Text
						style={linkStyle}
						onPress={() =>
							Linking.openURL('https://creativecommons.org/licenses/by-sa/3.0')
						}
					>
						CC-BY-SA
					</Text>
				</View>
			);
		},
	},
	{
		key: 'EsriWorldImagery',
		label: 'Esri World Imagery',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}',
		Attribution: () => (
			<Text>
				Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye,
				Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community
			</Text>
		),
	},
	{
		key: 'EsriWorldStreetMap',
		label: 'Esri World StreetMap',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{Z}/{Y}/{X}',
		Attribution: () => (
			<Text>
				Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN,
				Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012
			</Text>
		),
	},
	{
		key: 'EsriWorldTopoMap',
		label: 'Esri World TopoMap',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{Z}/{Y}/{X}',
		Attribution: () => (
			<Text>
				Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO,
				NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China
				(Hong Kong), and the GIS User Community
			</Text>
		),
	},
	{
		key: 'EsriWorldGrayCanvas',
		label: 'Esri World GrayCanvas',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{Z}/{Y}/{X}',
		Attribution: () => <Text>Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ</Text>,
	},
	{
		key: 'EsriWorldTerrain',
		label: 'Esri World Terrain',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{Z}/{Y}/{X}',
		Attribution: () => (
			<Text>Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS</Text>
		),
	},
	{
		key: 'EsriWorldShadedRelief',
		label: 'Esri World ShadedRelief',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{Z}/{Y}/{X}',
		Attribution: () => <Text>Tiles &copy; Esri &mdash; Source: Esri</Text>,
	},
	{
		key: 'EsriWorldPhysical',
		label: 'Esri World Physical',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{Z}/{Y}/{X}',
		Attribution: () => <Text>Tiles &copy; Esri &mdash; Source: US National Park Service</Text>,
	},
	{
		key: 'EsriOceanBasemap',
		label: 'Esri Ocean Basemap',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{Z}/{Y}/{X}',
		Attribution: () => (
			<Text>
				Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National
				Geographic, DeLorme, NAVTEQ, and Esri
			</Text>
		),
	},
	{
		key: 'EsriNatGeoWorldMap',
		label: 'Esri NatGeo World Map',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{Z}/{Y}/{X}',
		Attribution: () => (
			<Text>
				Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC,
				USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC
			</Text>
		),
	},
	{
		key: 'GoogleRoad',
		label: 'Google Road',
		url: 'https://mt1.google.com/vt/lyrs=r&x={X}&y={Y}&z={Z}',
		Attribution: AttributionGoogle,
	},
	{
		key: 'GoogleHybrid',
		label: 'Google Hybrid',
		url: 'https://mt1.google.com/vt/lyrs=y&x={X}&y={Y}&z={Z}',
		Attribution: AttributionGoogle,
	},
	{
		key: 'GoogleSatellite',
		label: 'Google Satellite',
		url: 'https://mt1.google.com/vt/lyrs=s&x={X}&y={Y}&z={Z}',
		Attribution: AttributionGoogle,
	},
	{
		key: 'custom',
		label: 'custom',
	},
];

const SourceRowControl: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	const layerTemp = useAppSelector(selectLayerTemp) as
		| undefined
		| LayerConfig<LayerConfigOptionsOnlineRasterXYZ>;

	const dispatch = useAppDispatch();

	const [selectedOpt, setSelectedOpt] = useState(
		layerTemp?.options?.url
			? get(
					sourceOptions.find((opt) => opt.url === layerTemp.options?.url),
					'key',
					'custom'
				)
			: sourceOptions[0].key
	);

	const [customUrl, setCustomUrl] = useState<undefined | string>(
		'custom' === selectedOpt ? get(layerTemp?.options, 'url', undefined) : undefined
	);

	let urlIsValid = useMemo(
		() =>
			selectedOpt !== 'custom' ||
			('string' === typeof customUrl &&
				/^https?:\/\//.test(customUrl) &&
				/{X}/.test(customUrl) &&
				/{Y}/.test(customUrl) &&
				/{Z}/.test(customUrl)),
		[selectedOpt, customUrl]
	);

	const warningIcon = useMemo(() => {
		if (selectedOpt !== 'custom' || urlIsValid) return undefined;
		return ({ size }: { size: number }) => (
			<LucideIcons
				size={size}
				color={theme.colors.error}
				name="triangle-alert"
			/>
		);
	}, [
		selectedOpt,
		urlIsValid,
		theme,
	]);

	useEffect(() => {
		if (urlIsValid) {
			dispatch(
				setLayerTemp(
					(layerTemp) =>
						layerTemp &&
						({
							...layerTemp,
							options: {
								...layerTemp.options,
								url:
									selectedOpt === 'custom'
										? customUrl
										: get(
												sourceOptions.find(
													(opt) => opt.key === selectedOpt
												),
												'url',
												''
											),
							},
						} as LayerConfig)
				)
			);
		}
	}, [
		urlIsValid,
		selectedOpt,
		customUrl,
		dispatch,
	]);

	const Attribution: undefined | SourceOption['Attribution'] = useMemo(
		() =>
			'custom' === selectedOpt
				? undefined
				: get(
						sourceOptions.find((opt) => opt.url === layerTemp?.options?.url),
						'Attribution'
					),
		[selectedOpt, layerTemp?.options?.url]
	);

	const renderUrlInput = useCallback(
		(props: TextInputProps) =>
			'custom' === selectedOpt ? (
				<TextInputNativeMultiline {...props} />
			) : (
				<TextInputNativeMultilineControlled {...props} />
			),
		[selectedOpt]
	);

	const urlInputTheme = useMemo(
		() => ({
			fonts: {
				bodyLarge: {
					...theme.fonts.bodySmall,
					fontFamily: 'sans-serif',
				},
			},
		}),
		[theme]
	);

	return (
		<InfoLabelRow
			label={t('baseMap.source')}
			Info={t('baseMap.hint.xyzSource')}
			Below={
				<View style={styles.belowWrapper}>
					<TextInput
						disabled={'custom' !== selectedOpt}
						placeholder="https://...{Z}/{X}/{Y}.png"
						multiline={true}
						render={renderUrlInput}
						dense={true}
						error={!urlIsValid}
						theme={urlInputTheme}
						style={styles.textInput}
						value={
							'custom' === selectedOpt
								? customUrl || ''
								: get(
										sourceOptions.find((opt) => opt.key === selectedOpt),
										'url',
										''
									)
						}
						onChangeText={setCustomUrl}
					/>

					{Attribution && (
						<View style={styles.attributionWrapper}>
							<Attribution />
						</View>
					)}
				</View>
			}
		>
			<ButtonHighlightMenuControl
				options={sourceOptions}
				value={selectedOpt}
				setValue={setSelectedOpt}
				anchorIcon={warningIcon}
				anchorLabel={t(
					get(
						sourceOptions.find((opt) => opt.key === selectedOpt),
						'label',
						''
					)
				)}
			/>
		</InfoLabelRow>
	);
};

const validateZoom = (val: number) => val >= 0;
const validateAlpha = (val: number) => val >= 0 && val <= 1;
const zoomOptLabels = ['min', 'max'];

const LayerControlOnlineRasterXYZ: FC<{}> = () => {
	const { layerTemp, setOptions } = useLayerTemp<LayerConfigOptionsOnlineRasterXYZ>();

	const { t } = useTranslation();

	const cacheDirChild = useMemo(
		() => stringifyProp(layerTemp?.options?.url || ''),
		[layerTemp?.options]
	);

	const enabledZoomValues = useMemo(
		() => [layerTemp?.options?.enabledZoomMin ?? 0, layerTemp?.options?.enabledZoomMax ?? 0],
		[layerTemp?.options?.enabledZoomMin, layerTemp?.options?.enabledZoomMax]
	);

	const zoomValues = useMemo(
		() => [layerTemp?.options?.zoomMin ?? 0, layerTemp?.options?.zoomMax ?? 0],
		[layerTemp?.options?.zoomMin, layerTemp?.options?.zoomMax]
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

	const handleZoomUpdate = useCallback(
		(newValues: number[]) =>
			setOptions({
				...(layerTemp?.options ?? {}),
				['zoomMin']: newValues[0],
				['zoomMax']: newValues[1],
			}),
		[layerTemp?.options, setOptions]
	);

	const handleAlphaUpdate = useCallback(
		(newValue: number) =>
			setOptions({
				...(layerTemp?.options ?? {}),
				alpha: newValue,
			}),
		[layerTemp?.options, setOptions]
	);

	return (
		<Fragment>
			<SourceRowControl />

			<NumericRowControlMulti
				label={t('enabled')}
				optLabels={zoomOptLabels}
				saveOnType={false}
				values={enabledZoomValues}
				onUpdate={handleEnabledZoomUpdate}
				validate={validateZoom}
				Info={t('baseMap.hint.enabled') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>

			<NumericRowControlMulti
				label={'Zoom'}
				optLabels={zoomOptLabels}
				saveOnType={false}
				values={zoomValues}
				onUpdate={handleZoomUpdate}
				validate={validateZoom}
				Info={t('baseMap.hint.zoom') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>

			<NumericRowControl
				label={t('opacity')}
				numType={'float'}
				value={layerTemp?.options?.alpha ?? 0}
				onUpdate={handleAlphaUpdate}
				validate={validateAlpha}
				Info={t('baseMap.hint.opacity')}
			/>

			<CacheControl
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				baseDefault={
					defaults.layerConfigOptions['online-raster-xyz'].cacheDirBase as string
				}
				cacheDirChild={cacheDirChild}
			/>
		</Fragment>
	);
};

const styles = StyleSheet.create({
	belowWrapper: {
		marginVertical: 8,
	},
	textInput: { width: '100%' },
	attributionWrapper: { marginTop: 10 },
});

// Derive a fallback label: known source name if matched, otherwise the raw URL.
export const getPlaceholderLabel = (layer: LayerConfig) => {
	const options = layer.options as LayerConfigOptionsOnlineRasterXYZ;
	const url = options?.url;
	if (!url) return undefined;
	const source = sourceOptions.find((opt) => opt.url === url);
	return source && source.key !== 'custom' ? source.label : url;
};

export default LayerControlOnlineRasterXYZ;
