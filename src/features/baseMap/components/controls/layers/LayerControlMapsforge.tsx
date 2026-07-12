/**
 * External dependencies
 */
import { FC, Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TouchableHighlight, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../../types';
import FileSourceRowControl from '../../../../../components/generic/controls/FileSourceRowControl';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { sprintf } from 'sprintf-js';
import HintLink from '../../../../../components/generic/HintLink';
import { LayerConfigOptionsMapsforge, LayerConfig } from '../../../types';
import { useLayerTemp } from '../../../hooks/useLayerTemp';
import { selectAppDirs } from '../../../../dirs/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { setLayerTemp, setMapsforgeProfileTemp } from '../../../slice';
import { selectMapsforgeProfiles } from '../../../selectors';
import NumericRowControlMulti from '../../../../../components/generic/controls/NumericRowControlMulti';
import ListItemMenuControl from '../../../../../components/generic/controls/ListItemMenuControl';
import { sharedStyles as globalSharedStyles } from '../../../../../sharedStyles';

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

	const [_menuVisible, _setMenuVisible] = useState(false);

	const opts: OptionBase[] = useMemo(
		() => [
			{
				key: 'default',
				label: 'baseMap.useFirstOne',
			},
			...profiles.map((prof) => {
				const themeLabel = prof.theme ? prof.theme.split('/').slice(-1)[0] : '';
				return {
					key: prof.key,
					label: [prof.name, themeLabel ? '[' + themeLabel + ']' : '']
						.filter(Boolean)
						.join(' '),
				};
			}),
		],
		[profiles]
	);

	const getInitialSelectedOpt = useCallback(
		() =>
			get(
				opts.find((opt) => opt.key === options.profile),
				'key',
				'default'
			),
		[opts, options]
	);

	const [selectedOpt, setSelectedOpt] = useState<string>(getInitialSelectedOpt());

	useEffect(() => {
		setSelectedOpt(getInitialSelectedOpt());
	}, [profiles, getInitialSelectedOpt]);

	// Keep setOptions stable via a ref so the effect below doesn't loop
	// when the parent re-creates the callback.
	const setOptionsRef = useRef(setOptions);
	setOptionsRef.current = setOptions;

	// Keep options in a ref so we can read the latest value without
	// listing it as a dependency — avoids an infinite dispatch loop
	// when selectLayerTemp returns a new options reference each render.
	const optionsRef = useRef(options);
	optionsRef.current = options;

	useEffect(() => {
		if (selectedOpt) {
			setOptionsRef.current({
				...optionsRef.current,
				profile: selectedOpt,
			});
		}
	}, [
		selectedOpt,
	]);

	const styleAction = useMemo(() => ({ padding: 10, borderRadius: theme.roundness }), [theme]);

	const menuItemStyle = useCallback(
		(idx: number) =>
			'default' === selectedOpt && idx === 1
				? {
						borderLeftColor: theme.colors.primary,
						borderLeftWidth: 5,
					}
				: {},
		[selectedOpt, theme]
	);

	const handleEditProfilePress = useCallback(() => {
		const newProfileTemp = profiles.find((prof) => prof.key === selectedOpt);
		if (newProfileTemp) {
			dispatch(setMapsforgeProfileTemp(newProfileTemp));
		}
	}, [
		profiles,
		selectedOpt,
		dispatch,
	]);

	return (
		<InfoRowControl
			label={t('baseMap.mapsforge.profile', { count: 1 })}
			Info={Info}
		>
			<View style={globalSharedStyles.flexRow}>
				<ListItemMenuControl
					listItemStyle={globalSharedStyles.listItem}
					options={opts}
					value={selectedOpt}
					setValue={setSelectedOpt}
					anchorLabel={t(
						get(
							opts.find((opt) => opt.key === selectedOpt),
							'label',
							''
						)
					)}
					menuItemStyle={menuItemStyle}
				/>

				{'default' !== selectedOpt && (
					<TouchableHighlight
						underlayColor={theme.colors.elevation.level3}
						onPress={handleEditProfilePress}
						style={styleAction}
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
			<Text style={style}>{t('downloads') + ':'}</Text>
			<HintLink
				label={t('baseMap.link.openandromapsDownloads')}
				url={'https://www.openandromaps.org/en/downloads'}
			/>
		</View>
	);
};

const extensions = ['map'];
const validateZoom = (val: number) => val >= 0;
const enabledZoomOptLabels = ['min', 'max'];

const LayerControlMapsforge: FC<{}> = ({}) => {
	const dispatch = useAppDispatch();
	const { layerTemp, setOptions } = useLayerTemp<LayerConfigOptionsMapsforge>();

	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

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
									mapFile: selectedOpt as LayerConfigOptionsMapsforge['mapFile'],
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
		return null;
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
				optLabels={enabledZoomOptLabels}
				saveOnType={false}
				values={enabledZoomValues}
				onUpdate={handleEnabledZoomUpdate}
				validate={validateZoom}
				Info={t('baseMap.hint.enabled') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>
		</Fragment>
	);
};

export default LayerControlMapsforge;
