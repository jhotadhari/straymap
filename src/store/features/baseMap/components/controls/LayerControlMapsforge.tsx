/**
 * External dependencies
 */
import {
	Dispatch,
	FC,
	ReactNode,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { TouchableHighlight, View } from 'react-native';
import { Icon, Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { debounce, get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../../types';
import { NumericMultiRowControl } from '../../../../../components/generic/NumericRowControls';
import FileSourceRowControl from '../../../../../components/FileSourceRowControl';
import InfoRowControl from '../../../../../components/generic/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../../components/generic/MenuItem';
import { sprintf } from 'sprintf-js';
import HintLink from '../../../../../components/generic/HintLink';
import {
	LayerConfigOptionsMapsforge,
	MapsforgeProfile,
	LayerConfig,
	LayerConfigOptionsAny,
} from '../../types';
import { selectAppDirs } from '../../../dirs/selectors';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setLayerTemp, setMapsforgeProfileTemp } from '../../baseMapSlice';
import { ContextSettingsMaps } from '../../ContextSettingsMaps';
import { selectLayerTemp, selectMapsforgeProfiles } from '../../selectors';
import { fillLayerConfigOptionsWithDefaults } from '../../utils';

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

	const opts: OptionBase[] = useMemo( () => [
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
	], [profiles] );

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

	return (
		<InfoRowControl
			label={t('map.mapsforge.profile', { count: 1 })}
			Info={Info}
		>
			<View style={{ flexDirection: 'row' }}>
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
										opts.find((opt) => opt.key === selectedOpt),
										'label',
										''
									)
								)}
							</Text>
						</ButtonHighlight>
					}
				>
					{opts &&
						[...opts].map((opt, index) => (
							<MenuItem
								key={opt.key}
								onPress={() => {
									setSelectedOpt(opt.key);
									setMenuVisible(false);
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
								// updateItem( newEditProfile );
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

const LayerControlMapsforge: FC<{}> = ({}) => {

	const dispatch = useAppDispatch();
	const layerTemp = useAppSelector(selectLayerTemp);

	const { t } = useTranslation();
	const theme = useTheme();

	const appDirs = useAppSelector(selectAppDirs);

	const setOptions = useCallback(
		(newOptions: LayerConfigOptionsMapsforge) => {
			dispatch(
				setLayerTemp({
					...layerTemp,
					options: newOptions,
				} as LayerConfig)
			);
		},
		[layerTemp]
	);

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
				onSelect={(selectedOpt) =>
					setOptions({
						...layerTemp.options,
						mapFile: selectedOpt,
					})
				}
				extensions={['map']}
				dirs={get(appDirs, 'mapfiles', [])}
				Info={
					<View>
						<Text>{t('hint.maps.mapsforgeFile')}</Text>
						<Text
							style={{
								marginTop: 20,
								...theme.fonts.bodyLarge,
							}}
						>
							{'Downloads:'}
						</Text>
						<HintLink
							label={t('hint.link.openandromapsDownloads')}
							url={'https://www.openandromaps.org/en/downloads'}
						/>
					</View>
				}
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
				optKeys={['enabledZoomMin', 'enabledZoomMax']}
				optLabels={['min', 'max']}
				options={layerTemp.options}
				setOptions={setOptions}
				validate={(val) => val >= 0}
				Info={t('hint.maps.enabled') + '\n\n' + t('hint.maps.zoomGeneralInfo')}
			/>
		</View>
	);
};

export default LayerControlMapsforge;
