/**
 * External dependencies
 */
import { FC, Fragment, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableHighlight, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../../../types';
import FileSourceRowControl from '../../../../../../components/generic/controls/FileSourceRowControl';
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
import { sprintf } from 'sprintf-js';
import HintLink from '../../../../../../components/generic/HintLink';
import { LayerConfigOptionsMapsforge, LayerConfig } from '../../../types';
import { selectAppDirs } from '../../../../dirs/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { setLayerTemp, setMapsforgeProfileTemp } from '../../../slice';
import { selectLayerTemp, selectMapsforgeProfiles } from '../../../selectors';
import NumericRowControlMulti from '../../../../../../components/generic/controls/NumericRowControlMulti';
import ListItemMenuControl from '../../../../../../components/generic/controls/ListItemMenuControl';

const ProfileRowControl = ({
	options,
	setOptions,
	Info,
}: {
	options: LayerConfigOptionsMapsforge;
	setOptions: (options: LayerConfigOptionsMapsforge) => void;
	Info?: ReactNode | string;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const profiles = useAppSelector(selectMapsforgeProfiles);

	const dispatch = useAppDispatch();

	const [menuVisible, setMenuVisible] = useState(false);

	const opts: OptionBase[] = useMemo(
		() => [
			{
				key: 'default',
				label: 'baseMap.useFirstOne',
			},
			...[...profiles].map((prof) => {
				const themeArr = prof.theme.split('/');
				return {
					key: prof.key,
					label: [prof.name, '[' + themeArr[themeArr.length - 1] + ']'].join(' '),
				};
			}),
		],
		[profiles]
	);

	const getInitialSelectedOpt = () =>
		get(
			opts.find((opt) => opt.key === options.profile),
			'key',
			'default'
		);

	const [selectedOpt, setSelectedOpt] = useState<string>(getInitialSelectedOpt());

	useEffect(() => {
		setSelectedOpt(getInitialSelectedOpt());
	}, [profiles]);

	useEffect(() => {
		if (selectedOpt) {
			setOptions({
				...options,
				profile: selectedOpt,
			});
		}
	}, [selectedOpt]);

	return (
		<InfoRowControl
			label={t('baseMap.mapsforge.profile', { count: 1 })}
			Info={Info}
		>
			<View style={styles.flexRow}>
				<ListItemMenuControl
					listItemStyle={{
						marginLeft: 0,
						paddingLeft: 10,
					}}
					options={opts}
					value={selectedOpt}
					setValue={(newValue) => {
						setSelectedOpt(newValue);
					}}
					anchorLabel={t(
						get(
							opts.find((opt) => opt.key === selectedOpt),
							'label',
							''
						)
					)}
					menuItemStyle={(idx) => {
						return 'default' === selectedOpt && idx === 1
							? {
									borderLeftColor: theme.colors.primary,
									borderLeftWidth: 5,
								}
							: {};
					}}
				/>

				{'default' !== selectedOpt && (
					<TouchableHighlight
						underlayColor={theme.colors.elevation.level3}
						onPress={() => {
							const newProfileTemp = profiles.find(
								(prof) => prof.key === selectedOpt
							);
							if (newProfileTemp) {
								dispatch(setMapsforgeProfileTemp(newProfileTemp));
							}
						}}
						style={{ padding: 10, borderRadius: theme.roundness }}
					>
						<Icon
							source="cog"
							size={25}
						/>
					</TouchableHighlight>
				)}
			</View>
		</InfoRowControl>
	);
};

const MapFileControlInfo: FC<{}> = ({}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const style = useMemo(
		() => ({
			marginTop: 20,
			...theme.fonts.bodyLarge,
		}),
		[theme]
	);

	return (
		<View>
			<Text>{t('baseMap.hint.mapsforgeFile')}</Text>
			<Text style={style}>{'Downloads:'}</Text>
			<HintLink
				label={t('link.openandromapsDownloads')}
				url={'https://www.openandromaps.org/en/downloads'}
			/>
		</View>
	);
};

const extensions = ['map'];

const LayerControlMapsforge: FC<{}> = ({}) => {
	const dispatch = useAppDispatch();
	const layerTemp = useAppSelector(selectLayerTemp) as
		| undefined
		| LayerConfig<LayerConfigOptionsMapsforge>;

	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	const setOptions = useCallback((newOptions: LayerConfigOptionsMapsforge) => {
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
								mapFile: selectedOpt as LayerConfigOptionsMapsforge['mapFile'],
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
				Info={<MapFileControlInfo />}
				filesHeading={sprintf(t('filesIn'), '(.map)')}
				noFilesHeading={sprintf(t('noFilesIn'), '(.map)')}
				hasCustom={true}
			/>

			<ProfileRowControl
				options={layerTemp.options}
				setOptions={setOptions}
				Info={t('baseMap.hint.mapsforgeProfile')}
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

const styles = StyleSheet.create({
	contentBtn: { marginTop: 3 },
	flexRow: { flexDirection: 'row' },
});

export default LayerControlMapsforge;
