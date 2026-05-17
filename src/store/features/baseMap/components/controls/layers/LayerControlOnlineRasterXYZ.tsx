/**
 * External dependencies
 */
import { FC, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Linking, View, TextInputProps } from 'react-native';
import { Text, Menu, useTheme, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../../../components/generic/MenuItem';
import { OptionBase } from '../../../../../../types';
import {
	NumericMultiRowControl,
	NumericRowControl,
} from '../../../../../../components/generic/controls/NumericRowControls';
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
import CacheControl from './CacheControl';
import { stringifyProp } from '../../../../../../lib/utils';
import { defaults } from '../../../../../../constants';
import {
	TextInputNativeMultiline,
	TextInputNativeMultilineControlled,
} from '../../../../../../components/generic/TextInputNativeMultiline';
import { LayerConfig, LayerConfigOptionsOnlineRasterXYZ } from '../../../types';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectLayerTemp } from '../../../selectors';
import { setLayerTemp } from '../../../baseMapSlice';

interface SourceOption extends OptionBase {
	url?: `http://${string}` | `https://${string}`;
	Attribution?: () => ReactElement;
}

const AttributionGoogle = () => {
	const theme = useTheme()
	return <View>
		<Image
			source={
				theme.dark
					? require('../../../../../../assets/images/google_on_non_white.png')
					: require('../../../../../../assets/images/google_on_white.png')
			}
		/>
		<Text
			style={{ color: get(theme.colors, 'link') }}
			onPress={() => Linking.openURL('https://cloud.google.com/maps-platform/terms')}
		>
			&copy; Map data ©{dayjs().format('YYYY')} Google
		</Text>
	</View>
};

export const sourceOptions: SourceOption[] = [
	{
		key: 'OpenStreetMap',
		label: 'OpenStreetMap',
		url: 'https://tile.openstreetmap.org/{Z}/{X}/{Y}.png',
		Attribution: () => {
			const theme = useTheme()
			return <Text
				style={{ color: get(theme.colors, 'link') }}
				onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}
			>
				&copy; OpenStreetMap contributors
			</Text>
		},
	},
	{
		key: 'OpenTopoMap',
		label: 'OpenTopoMap',
		url: 'https://a.tile.opentopomap.org/{Z}/{X}/{Y}.png',
		Attribution: () => {
			const theme = useTheme();
			return <View>
				<Text
					style={{ color: get(theme.colors, 'link') }}
					onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}
				>
					&copy; OpenStreetMap contributors
				</Text>
				<Text
					style={{ color: get(theme.colors, 'link') }}
					onPress={() => Linking.openURL('http://viewfinderpanoramas.org')}
				>
					SRTM
				</Text>
				<Text
					style={{ color: get(theme.colors, 'link') }}
					onPress={() => Linking.openURL('https://opentopomap.org')}
				>
					Map style: &copy; OpenTopoMap
				</Text>
				<Text
					style={{ color: get(theme.colors, 'link') }}
					onPress={() =>
						Linking.openURL('https://creativecommons.org/licenses/by-sa/3.0')
					}
				>
					CC-BY-SA
				</Text>
			</View>
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

	const [menuVisible, setMenuVisible] = useState(false);

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

	return (
		<InfoRowControl
			label={t('baseMap.source')}
			Info={t('baseMap.hint.xyzSource')}
			Below={
				<View
					style={{
						marginTop: -18,
						marginBottom: 10,
					}}
				>
					<TextInput
						disabled={'custom' !== selectedOpt}
						placeholder="https://...{Z}/{X}/{Y}.png"
						multiline={true}
						render={(props: TextInputProps) =>
							'custom' === selectedOpt ? (
								<TextInputNativeMultiline {...props} />
							) : (
								<TextInputNativeMultilineControlled {...props} />
							)
						}
						dense={true}
						error={!urlIsValid}
						theme={{
							fonts: {
								bodyLarge: {
									...theme.fonts.bodySmall,
									fontFamily: 'sans-serif',
								},
							},
						}}
						style={{ width: '100%' }}
						value={
							'custom' === selectedOpt
								? customUrl || ''
								: get(
										sourceOptions.find((opt) => opt.key === selectedOpt),
										'url',
										''
									)
						}
						onChangeText={(newUrl) => setCustomUrl(newUrl)}
					/>

					{Attribution && (
						<View style={{ marginTop: 10 }}>
							<Attribution/>
						</View>
					)}
				</View>
			}
		>
			<Menu
				contentStyle={{
					borderColor: theme.colors.outline,
					borderWidth: 1,
				}}
				visible={menuVisible}
				onDismiss={() => setMenuVisible(false)}
				anchor={
					<ButtonHighlight
						style={{ marginTop: 3 }}
						onPress={() => setMenuVisible(true)}
					>
						<Text>
							{t(
								get(
									sourceOptions.find((opt) => opt.key === selectedOpt),
									'label',
									''
								)
							)}
						</Text>
					</ButtonHighlight>
				}
			>
				{sourceOptions &&
					[...sourceOptions].map((opt) => (
						<MenuItem
							key={opt.key}
							onPress={() => {
								setSelectedOpt(opt.key);
								setMenuVisible(false);
							}}
							title={t(opt.label)}
							active={opt.key === selectedOpt}
						/>
					))}
			</Menu>
		</InfoRowControl>
	);
};

const LayerControlOnlineRasterXYZ: FC<{}> = () => {
	const dispatch = useAppDispatch();
	const layerTemp = useAppSelector(selectLayerTemp) as
		| undefined
		| LayerConfig<LayerConfigOptionsOnlineRasterXYZ>;

	const { t } = useTranslation();

	const enabledOptions = useMemo(() => {
		const options = [
			{
				key: 'enabledZoomMin',
				label: 'min',
			},
			{
				key: 'enabledZoomMax',
				label: 'max',
			},
		];
		return {
			keys: options.map((opt) => opt.key),
			labels: options.map((opt) => opt.label),
		};
	}, []);

	const zoomOptions = useMemo(() => {
		const options = [
			{
				key: 'zoomMin',
				label: 'min',
			},
			{
				key: 'zoomMax',
				label: 'max',
			},
		];
		return {
			keys: options.map((opt) => opt.key),
			labels: options.map((opt) => opt.label),
		};
	}, []);

	const validateZoom = useCallback((val: number) => val >= 0, []);

	const cacheDirChild = useMemo(
		() => stringifyProp(layerTemp?.options?.url || ''),
		[layerTemp?.options]
	);

	const setOptions = useCallback((newOptions: LayerConfigOptionsOnlineRasterXYZ) => {
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

	return (
		<View>
			<SourceRowControl />

			<NumericMultiRowControl
				label={t('enabled')}
				optKeys={enabledOptions.keys}
				optLabels={enabledOptions.labels}
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				validate={validateZoom}
				Info={t('baseMap.hint.enabled') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>

			<NumericMultiRowControl
				label={'Zoom'}
				optKeys={zoomOptions.keys}
				optLabels={zoomOptions.labels}
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				validate={validateZoom}
				Info={t('baseMap.hint.zoom') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>

			<NumericRowControl
				label={t('opacity')}
				optKey={'alpha'}
				numType={'float'}
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				validate={(val) => val >= 0 && val <= 1}
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
		</View>
	);
};

export default LayerControlOnlineRasterXYZ;
