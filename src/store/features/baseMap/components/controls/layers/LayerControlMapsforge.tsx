/**
 * External dependencies
 */
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableHighlight, View } from 'react-native';
import { Icon, Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../../../types';
import { NumericMultiRowControl } from '../../../../../../components/generic/NumericRowControls';
import FileSourceRowControl from '../../../../../../components/FileSourceRowControl';
import InfoRowControl from '../../../../../../components/generic/InfoRowControl';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../../../components/generic/MenuItem';
import { sprintf } from 'sprintf-js';
import HintLink from '../../../../../../components/generic/HintLink';
import { LayerConfigOptionsMapsforge, LayerConfig } from '../../../types';
import { selectAppDirs } from '../../../../dirs/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { setLayerTemp, setMapsforgeProfileTemp } from '../../../baseMapSlice';
import { selectLayerTemp, selectMapsforgeProfiles } from '../../../selectors';

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
				label: 'useFirstOne',
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

	const [selectedOpt, setSelectedOpt] = useState<string | null>(getInitialSelectedOpt());

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

	const contentStyle = useMemo(
		() => ({
			borderColor: theme.colors.outline,
			borderWidth: 1,
		}),
		[theme]
	);

	const handleDismissMenu = useCallback(() => setMenuVisible(false), []);
	const handleOpenMenu = useCallback(() => setMenuVisible(true), []);

	return (
		<InfoRowControl
			label={t('map.mapsforge.profile', { count: 1 })}
			Info={Info}
		>
			<View style={styles.flexRow}>
				<Menu
					contentStyle={contentStyle}
					visible={menuVisible}
					onDismiss={handleDismissMenu}
					anchor={
						<ButtonHighlight
							style={styles.contentBtn}
							onPress={handleOpenMenu}
						>
							<Text>
								{t(
									get(
										opts.find((opt) => opt.key === selectedOpt),
										'label',
										''
									)
								)}
							</Text>
						</ButtonHighlight>
					}
				>
					{[...opts].map((opt, index) => (
						<MenuItem
							key={opt.key}
							onPress={() => {
								setSelectedOpt(opt.key);
								handleDismissMenu();
							}}
							title={t(opt.label)}
							active={opt.key === selectedOpt}
							style={
								'default' === selectedOpt && index === 1
									? {
											borderLeftColor: theme.colors.primary,
											borderLeftWidth: 5,
										}
									: {}
							}
						/>
					))}
				</Menu>

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
			<Text>{t('hint.maps.mapsforgeFile')}</Text>
			<Text style={style}>{'Downloads:'}</Text>
			<HintLink
				label={t('hint.link.openandromapsDownloads')}
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

	const handleMapFileChange = useCallback(
		(selectedOpt: LayerConfigOptionsMapsforge['mapFile']) => {
			dispatch(
				setLayerTemp(
					(layerTemp) =>
						layerTemp &&
						({
							...layerTemp,
							options: {
								...layerTemp.options,
								mapFile: selectedOpt,
							},
						} as LayerConfig)
				)
			);
		},
		[]
	);

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

	const validateZoom = useCallback((val: number) => val >= 0, []);

	if (!layerTemp?.options) {
		return undefined;
	}

	return (
		<View>
			<FileSourceRowControl
				header={t('map.selectFile')}
				label={t('map.file')}
				options={layerTemp.options}
				optionsKey={'mapFile'}
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
				Info={t('hint.maps.mapsforgeProfile')}
			/>

			<NumericMultiRowControl
				label={t('enabled')}
				optKeys={enabledOptions.keys}
				optLabels={enabledOptions.labels}
				options={layerTemp.options}
				setOptions={setOptions}
				validate={validateZoom}
				Info={t('hint.maps.enabled') + '\n\n' + t('hint.maps.zoomGeneralInfo')}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	contentBtn: { marginTop: 3 },
	flexRow: { flexDirection: 'row' },
});

export default LayerControlMapsforge;
