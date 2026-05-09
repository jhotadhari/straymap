/**
 * External dependencies
 */
import {
	Dispatch,
	FC,
	ReactNode,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	View,
	TouchableHighlight,
	Linking,
	ViewStyle,
	LayoutChangeEvent,
	TextStyle,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { List, useTheme, Text, Icon, Menu, IconButtonProps } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DraggableGrid from 'react-native-draggable-grid';
import { get, omit } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	LayerMapsforge,
	MapLayerMapsforgeModule,
	RenderStyleOptionsCollection,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import InfoRowControl from '../../../../../components/generic/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import RadioListItem from '../../../../../components/generic/RadioListItem';
import InfoButton from '../../../../../components/generic/InfoButton';
import IconIcomoon from '../../../../../components/generic/IconIcomoon';
import NameRowControl from '../../../../../components/generic/NameRowControl';
import FileSourceRowControl, {
	AlternativeButtonType,
} from '../../../../../components/FileSourceRowControl';
import MenuItem from '../../../../../components/generic/MenuItem';
import LoadingIndicator from '../../../../../components/generic/LoadingIndicator';
import HintLink from '../../../../../components/generic/HintLink';
import InfoRadioRow from '../../../../../components/generic/InfoRadioRow';
import { runAfterInteractions } from '../../../../../utils';
import {
	MapsforgeProfile,
	LayerConfigOptionsMapsforge,
	RenderStylesCache,
} from '../../types';
import { OptionBase } from '../../../../../types';
import { getNewProfile } from '../../utils';
import { selectElementExpanded, selectIsBusy } from '../../../ui/selectors';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { addBusyKey, removeBusyKey, setElementExpanded } from '../../../ui/uiSlice';
import {
	selectLayers,
	selectMapsforgeProfiles,
	selectMapsforgeProfileTemp,
	selectRenderStylesCache,
} from '../../selectors';
import {
	setMapsforgeProfiles as setMapsforgeProfilesStore,
	setMapsforgeProfileTemp,
	setRenderStylesCache,
} from '../../baseMapSlice';
import { selectAppDirs } from '../../../dirs/selectors';
import { getDirInfoCacheId } from '../../../dirs/utils';
import { removeDirInfoCacheEntry } from '../../../dirs/dirsSlice';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';
import {
	controlIconStyle,
	styleAddItem,
	styleControls,
	styleDraggableGrid,
	styleItemsNone,
	styleModalControls,
} from './LayersControl';

const itemHeight = 50;

const styleLayerCount = { flexGrow: 1 };

const DraggableItem = ({
	item,
	width,
	reverse,
	saveOnChange,
	saveProfiles,
}: {
	item: MapsforgeProfile;
	width: number;
	reverse: boolean;
	saveOnChange?: boolean;
	saveProfiles?: () => void;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const layers = useAppSelector((state) => selectLayers(state, { temp: true }));
	const profiles = useAppSelector((state) => selectMapsforgeProfiles(state, { temp: true }));

	const [isToWide, setIsToWide] = useState(false);

	const themeLabel = useMemo(() => {
		let result = '';
		if (item.theme) {
			const themeArr = item.theme.split('/');
			result = themeArr[themeArr.length - 1];
		}
		return result;
	}, [item?.theme]);

	const layersCount = useMemo(() => {
		let result = layers.filter(
			(lay) =>
				lay.type === 'mapsforge' &&
				get(lay.options as LayerConfigOptionsMapsforge, 'profile') === item.key
		).length;
		if (profiles.length && profiles[0].key === item.key) {
			result =
				result +
				layers.filter(
					(lay) =>
						lay.type === 'mapsforge' &&
						get(lay.options as LayerConfigOptionsMapsforge, 'profile') === 'default'
				).length;
		}
		return result;
	}, [
		layers,
		item.key,
		profiles,
	]);

	const style: ViewStyle = useMemo(
		() => ({
			width,
			height: itemHeight,
			justifyContent: 'space-between',
			alignItems: 'center',
			flexDirection: reverse ? 'row-reverse' : 'row',
			overflow: 'hidden',
			paddingLeft: reverse ? 14 : 24,
			paddingRight: reverse ? 24 : 14,
		}),
		[
			width,
			itemHeight,
			reverse,
		]
	);

	const styleAction: ViewStyle = useMemo(
		() => ({
			padding: 10,
			borderRadius: theme.roundness,
		}),
		[theme]
	);

	const styleName: TextStyle = useMemo(
		() => ({
			textAlign: reverse ? 'right' : 'left',
			marginLeft: 0,
			width: 100,
			...(reverse && { marginRight: 3 }),
		}),
		[theme]
	);

	const handlePress = useCallback(() => dispatch(setMapsforgeProfileTemp(item)), [item]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			if (
				(reverse && event.nativeEvent.layout.x < 0) ||
				(!reverse && event.nativeEvent.layout.x + event.nativeEvent.layout.width > width)
			) {
				setIsToWide(true);
			}
		},
		[reverse]
	);

	// const updateItem = useCallback(
	// 	(newProfile: MapsforgeProfile) => {
	// 		const idx = profiles.findIndex((profile) => profile.key === newProfile?.key);
	// 		if (idx !== -1) {
	// 			const newProfiles = [...profiles];
	// 			newProfiles[idx] = newProfile;
	// 			dispatch(
	// 				setMapsforgeProfilesStore({
	// 					temp: true,
	// 					mapsforgeProfiles: newProfiles,
	// 				})
	// 			);
	// 			if (saveOnChange) {
	// 				saveProfiles();
	// 			}
	// 		}
	// 	},
	// 	[
	// 		profiles,
	// 		saveOnChange,
	// 		saveProfiles,
	// 	]
	// );

	return (
		<View
			style={style}
			key={item.key}
		>
			<Text style={styleName}>{item.name}</Text>

			<Text style={styleLayerCount}>
				{sprintf('%s ' + t('layer', { count: layersCount }), layersCount)}
			</Text>

			{!isToWide && <Text style={reverse ? { marginRight: 10 } : {}}>[{themeLabel}]</Text>}

			<TouchableHighlight
				underlayColor={theme.colors.elevation.level3}
				onPress={handlePress}
				style={styleAction}
				onLayout={handleLayout}
			>
				<Icon
					source="cog"
					size={25}
				/>
			</TouchableHighlight>
		</View>
	);
};

const getDefaultSelectedOpt = (
	profile: MapsforgeProfile,
	opts: OptionBase[],
	defaultRenderStyle: string | null
) => {
	let defaultSelected = null;
	if (profile.renderStyle) {
		defaultSelected = get(
			opts.find((opt) => opt.key === profile.renderStyle),
			'key',
			null
		);
		if (defaultSelected) {
			return defaultSelected;
		}
	}
	return opts.length && defaultRenderStyle
		? get(
				opts.find((opt) => opt.key === defaultRenderStyle),
				'key',
				null
			)
		: null;
};

const LayerCountRow = ({ profile }: { profile: MapsforgeProfile }) => {
	const { t } = useTranslation();
	const layers = useAppSelector((state) => selectLayers(state, { temp: true }));
	const profiles = useAppSelector((state) => selectMapsforgeProfiles(state, { temp: true }));
	const isDefaultProfile = profiles.length && profiles[0].key === profile.key;
	const layersCount = layers.filter(
		(lay) =>
			lay.type === 'mapsforge' &&
			get(lay.options as LayerConfigOptionsMapsforge, 'profile') === profile.key
	).length;
	const layersCountDefault = isDefaultProfile
		? layers.filter(
				(lay) =>
					lay.type === 'mapsforge' &&
					get(lay.options as LayerConfigOptionsMapsforge, 'profile') === 'default'
			).length
		: 0;
	return (
		<InfoRowControl label={t('layer', { count: 0 })}>
			<View style={{ paddingLeft: 12 }}>
				<Text style={{ maxWidth: '80%' }}>
					{sprintf(t('layerSelectedCount', { count: layersCount }), layersCount)}
				</Text>
				{isDefaultProfile && (
					<Text style={{ maxWidth: '80%', marginTop: 10 }}>
						{sprintf(
							t('layerSelectedDefaultCount', { count: layersCountDefault }),
							layersCountDefault
						)}
					</Text>
				)}
			</View>
		</InfoRowControl>
	);
};

const RenderStyleRowControl = ({
	profile,
	updateProfile,
	Info,
	renderStyleOptionsMap,
	renderDefaultStylesMap,
	AlternativeButton,
}: {
	profile: MapsforgeProfile;
	updateProfile: (newProfile: MapsforgeProfile) => void;
	Info?: ReactNode | string;
	AlternativeButton?: ReactNode;
	renderStyleOptionsMap: { [value: string]: RenderStyleOptionsCollection };
	renderDefaultStylesMap: { [value: string]: string | null };
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const renderStyleOptions = profile.theme ? renderStyleOptionsMap[profile.theme] : null;
	const [opts, setOpts] = useState<OptionBase[]>([]);

	useEffect(() => {
		if (profile.theme && renderStyleOptions) {
			setOpts(Object.keys(renderStyleOptions).map((key) => ({ key, label: key })));
		}
	}, [profile.theme, renderStyleOptions]);

	const defaultRenderStyle = profile.theme
		? get(renderDefaultStylesMap, profile.theme, null)
		: null;

	const [selectedOpt, setSelectedOpt] = useState(
		getDefaultSelectedOpt(profile, opts, defaultRenderStyle)
	);
	useEffect(() => {
		if (opts.length && (null === selectedOpt || !opts.find((opt) => opt.key === selectedOpt))) {
			setSelectedOpt(getDefaultSelectedOpt(profile, opts, defaultRenderStyle));
		}
	}, [
		profile,
		opts,
		defaultRenderStyle,
		selectedOpt,
	]);

	const [menuVisible, setMenuVisible] = useState(false);

	useEffect(() => {
		if (selectedOpt) {
			updateProfile({
				...profile,
				renderStyle: selectedOpt,
			});
		}
	}, [selectedOpt]);

	return opts.length > 0 ? (
		<InfoRowControl
			label={t('style')}
			Info={Info}
		>
			{!AlternativeButton && (
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
						[...opts].map((opt) => (
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
			)}

			{AlternativeButton && AlternativeButton}
		</InfoRowControl>
	) : null;
};

const RenderOverlaysRowControl = ({
	profile,
	updateProfile,
	Info,
	label,
	header,
	renderStyleOptionsMap,
	AlternativeButton = null,
}: {
	profile: MapsforgeProfile;
	updateProfile: (newProfile: MapsforgeProfile) => void;
	Info?: ReactNode | string;
	label: string;
	header?: string;
	AlternativeButton?: AlternativeButtonType;
	renderStyleOptionsMap: { [value: string]: RenderStyleOptionsCollection };
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const renderStyleOptions = profile.theme ? renderStyleOptionsMap[profile.theme] : null;
	const [opts, setOpts] = useState<OptionBase[]>([]);
	const [selectedOpts, setSelectedOpts] = useState(profile.renderOverlays);

	useEffect(() => {
		if (profile.theme && profile.renderStyle && renderStyleOptions) {
			const optsMap: { [value: string]: string } = get(
				renderStyleOptions,
				[profile.renderStyle, 'options'],
				{}
			) as { [value: string]: string };
			setOpts(Object.keys(optsMap).map((key) => ({ key, label: optsMap[key] })));
		}
		if (
			!profile.theme ||
			!profile.renderStyle ||
			!get(renderStyleOptions, [profile.renderStyle, 'options'], false)
		) {
			setOpts([]);
		}
	}, [
		profile.theme,
		profile.renderStyle,
		renderStyleOptions,
	]);

	useEffect(() => {
		setSelectedOpts(profile.renderOverlays || []);
	}, [opts]);

	const [modalVisible, setModalVisible] = useState(false);

	useEffect(() => {
		updateProfile({
			...profile,
			renderOverlays: selectedOpts,
		});
	}, [selectedOpts]);

	return opts.length > 0 ? (
		<InfoRowControl
			label={label}
			Info={Info}
		>
			{modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					backgroundBlur={false}
					onDismiss={() => setModalVisible(false)}
					onHeaderBackPress={() => setModalVisible(false)}
					header={header || label}
				>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
						{selectedOpts.length > 0 && selectedOpts.length < opts.length && (
							<ButtonHighlight
								style={{ marginTop: 10, marginBottom: 40 }}
								onPress={() => {
									setSelectedOpts(
										[...opts]
											.filter((opt) => !selectedOpts.includes(opt.key))
											.map((opt) => opt.key)
									);
								}}
								mode="contained"
								buttonColor={get(theme.colors, 'primaryContainer')}
								textColor={get(theme.colors, 'onPrimaryContainer')}
							>
								<Text>{t('select.toggle')}</Text>
							</ButtonHighlight>
						)}

						<ButtonHighlight
							style={{ marginTop: 10, marginBottom: 40, marginLeft: 'auto' }}
							onPress={() => {
								if (selectedOpts.length < opts.length) {
									setSelectedOpts([...opts].map((opt) => opt.key));
								} else {
									setSelectedOpts([]);
								}
							}}
							mode="contained"
							buttonColor={get(theme.colors, 'primaryContainer')}
							textColor={get(theme.colors, 'onPrimaryContainer')}
						>
							<Text>
								{t(
									selectedOpts.length < opts.length ? 'select.all' : 'select.none'
								)}
							</Text>
						</ButtonHighlight>
					</View>

					{opts.length > 0 && (
						<View>
							{[...opts].map((opt) => {
								const isSelected = selectedOpts.includes(opt.key);
								return (
									<RadioListItem
										key={opt.key}
										opt={opt}
										onPress={() => {
											if (isSelected) {
												const newSelectedOpts = [...selectedOpts];
												const index = newSelectedOpts.findIndex(
													(optKey) => optKey === opt.key
												);
												if (index !== -1) {
													newSelectedOpts.splice(index, 1);
												}
												setSelectedOpts(newSelectedOpts);
											} else {
												setSelectedOpts([
													...selectedOpts,
													opt.key,
												]);
											}
										}}
										labelStyle={theme.fonts.bodyMedium}
										labelExtractor={(a) => a.label}
										status={isSelected ? 'checked' : 'unchecked'}
									/>
								);
							})}
						</View>
					)}

					<ButtonHighlight
						style={{ marginTop: 10, marginBottom: 40 }}
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
				{!AlternativeButton && (
					<ButtonHighlight
						disabled={!opts.length}
						style={{ marginTop: 3 }}
						onPress={() => setModalVisible(true)}
					>
						<Text>
							{opts.length === selectedOpts.length
								? t('selected.all')
								: 0 === selectedOpts.length
									? t('selected.none')
									: t(
											selectedOpts
												? sprintf(
														t('selected.count'),
														selectedOpts.length + '/' + opts.length
													)
												: 'selected.none'
										)}
						</Text>
					</ButtonHighlight>
				)}

				{AlternativeButton && <AlternativeButton setModalVisible={setModalVisible} />}
			</View>
		</InfoRowControl>
	) : null;
};

const labelExtractor = (a: { label: string }) => a.label;

const HasLabelsControl: FC<{
	updateProfile: (newProfile: MapsforgeProfile) => void;
}> = ({ updateProfile }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);
	const handleChange = useCallback(
		() =>
			profileTemp &&
			updateProfile({
				...profileTemp,
				hasLabels: !profileTemp.hasLabels,
			}),
		[profileTemp]
	);
	const opt: OptionBase = useMemo(
		() => ({
			label: t('hasLabels'),
			key: 'hasLabels',
		}),
		[t]
	);
	return (
		<InfoRadioRow
			opt={opt}
			onPress={handleChange}
			labelStyle={theme.fonts.bodyMedium}
			labelExtractor={labelExtractor}
			status={profileTemp?.hasLabels ? 'checked' : 'unchecked'}
			radioAlign={'left'}
		/>
	);
};

const HasBuildingsControl: FC<{
	updateProfile: (newProfile: MapsforgeProfile) => void;
}> = ({ updateProfile }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);
	const handleChange = useCallback(
		() =>
			profileTemp &&
			updateProfile({
				...profileTemp,
				hasBuildings: !profileTemp.hasBuildings,
			}),
		[profileTemp]
	);
	const opt: OptionBase = useMemo(
		() => ({
			label: t('hasBuildings'),
			key: 'hasBuildings',
		}),
		[t]
	);
	return (
		<InfoRadioRow
			opt={opt}
			onPress={handleChange}
			labelStyle={theme.fonts.bodyMedium}
			labelExtractor={labelExtractor}
			status={profileTemp?.hasBuildings ? 'checked' : 'unchecked'}
			radioAlign={'left'}
		/>
	);
};

const extensions = ['xml'];

const ResetCacheButton: FC<{
	renderStylesCache: RenderStylesCache;
}> = ({ renderStylesCache }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();

	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);

	const isBusy = useAppSelector(selectIsBusy);
	const appDirs = useAppSelector(selectAppDirs);

	const handlePress = useCallback(() => {
		if (profileTemp && null !== profileTemp.theme && 'string' === typeof profileTemp.theme) {
			dispatch(
				setRenderStylesCache({
					optionsMap: omit(renderStylesCache.optionsMap, profileTemp.theme),
					defaultsMap: omit(renderStylesCache.defaultsMap, profileTemp.theme),
				})
			);
		}
		dispatch(
			removeDirInfoCacheEntry(
				getDirInfoCacheId({
					navDirs: appDirs.mapstyles,
					extensions,
					recursive: true,
				})
			)
		);
	}, [
		profileTemp?.theme,
		appDirs?.mapstyles,
	]);

	return isBusy ? undefined : (
		<TouchableHighlight
			underlayColor={theme.colors.elevation.level3}
			onPress={handlePress}
			// style={{ borderRadius: theme.roundness }}
		>
			<Icon
				source="refresh"
				size={25}
			/>
		</TouchableHighlight>
	);
};

const themeInfoLinks = [
	{
		label: 'hint.link.xmlRenderThemes',
		url: 'https://www.openandromaps.org/en/legend/elevate-mountain-hike-theme',
	},
	{
		label: 'hint.link.xmlRenderThemesModify',
		url: 'https://github.com/mapsforge/mapsforge/blob/master/docs/Rendertheme.md',
	},
];
const styleThemeInfoLink = { marginTop: 10 };
const ThemeInfo: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const styleThemeInfoLinkText = useMemo(() => ({ color: get(theme.colors, 'link') }), [theme]);
	return (
		<View>
			<Text>{t('hint.maps.mapsforgeProfileFile')}</Text>
			{themeInfoLinks.map((link) => (
				<View style={styleThemeInfoLink}>
					<Text>{t(link.label)}</Text>
					<Text
						style={styleThemeInfoLinkText}
						onPress={() => Linking.openURL(link.url)}
					>
						{link.url}
					</Text>
				</View>
			))}
		</View>
	);
};

const ThemeControl: FC<{
	renderStylesCache: RenderStylesCache;
	updateItem: (newProfile: MapsforgeProfile) => void;
}> = ({ renderStylesCache, updateItem }) => {
	const { t } = useTranslation();

	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);

	const isBusy = useAppSelector(selectIsBusy);

	const appDirs = useAppSelector(selectAppDirs);

	const handleSelect = useCallback(
		(selectedOpt: string) => {
			profileTemp &&
				updateItem({
					...profileTemp,
					theme: selectedOpt,
				});
		},
		[profileTemp]
	);

	const initialOptsMap = useMemo(
		() => ({
			[t('builtInThemes') + ':']: [...LayerMapsforge.BUILT_IN_THEMES].map((key) => ({
				key,
				label: key,
			})),
		}),
		[t]
	);

	if (!appDirs?.mapstyles || !profileTemp) {
		return undefined;
	}

	return (
		<FileSourceRowControl
			AlternativeButton={isBusy ? () => <LoadingIndicator /> : undefined}
			label={t('theme')}
			header={t('selectTheme')}
			initialOptsMap={initialOptsMap}
			options={profileTemp}
			optionsKey={'theme'}
			onSelect={handleSelect}
			After={<ResetCacheButton renderStylesCache={renderStylesCache} />}
			extensions={extensions}
			dirs={appDirs.mapstyles}
			Info={<ThemeInfo />}
			filesHeading={sprintf(t('filesIn'), '(.xml)')}
			noFilesHeading={sprintf(t('noFilesIn'), '(.xml)')}
		/>
	);
};

const EditModal: FC<{
	isNewKey: false | string;
	saveOnChange: boolean;
	saveProfiles: () => void;
	setIsNewKey: Dispatch<SetStateAction<false | string>>;
}> = ({ isNewKey, saveOnChange, saveProfiles, setIsNewKey }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();
	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);
	const profiles = useAppSelector((state) => selectMapsforgeProfiles(state, { temp: true }));

	const [modalVisible, setModalVisible] = useState(false);

	useEffect(() => {
		setModalVisible(!!profileTemp);
	}, [profileTemp]);

	const handleDismissModal = useCallback(() => {
		setModalVisible(false);
		dispatch(setMapsforgeProfileTemp(undefined));
		setIsNewKey(false);
		if (saveOnChange) {
			saveProfiles();
		}
	}, [
		saveOnChange,
		saveProfiles,
	]);

	const handleRemoveItem = useCallback(() => {
		const idx = profiles.findIndex((layer) => layer.key === profileTemp?.key);
		if (idx !== -1) {
			const newProfiles = [...profiles];
			newProfiles.splice(idx, 1);
			dispatch(
				setMapsforgeProfilesStore({
					temp: true,
					mapsforgeProfiles: newProfiles,
				})
			);
			handleDismissModal();
		}
	}, [
		handleDismissModal,
		profiles,
		profileTemp?.key,
	]);

	const isBusy = useAppSelector(selectIsBusy);

	const renderStylesCache = useAppSelector(selectRenderStylesCache);

	const hasEditProfileRenderStylesCacheEntry = useMemo(() => {
		return !!(profileTemp?.theme && get(renderStylesCache.optionsMap, profileTemp.theme));
	}, [
		profileTemp?.theme,
		renderStylesCache.optionsMap,
	]);

	useEffect(() => {
		if (profileTemp && profileTemp?.theme && modalVisible) {
			if (!hasEditProfileRenderStylesCacheEntry) {
				const busyKey = 'ProfilesControl' + profileTemp.key;
				dispatch(addBusyKey(busyKey));
				runAfterInteractions(() => {
					MapLayerMapsforgeModule.getRenderThemeOptions(profileTemp?.theme).then(
						(collection: RenderStyleOptionsCollection) => {
							dispatch(
								setRenderStylesCache({
									optionsMap: {
										...renderStylesCache.optionsMap,
										...('string' === typeof profileTemp.theme && {
											[profileTemp.theme]: collection,
										}),
									},
									defaultsMap: {
										...renderStylesCache.defaultsMap,
										...('string' === typeof profileTemp.theme && {
											[profileTemp.theme]: get(
												Object.values(collection).find(
													(obj) => obj.default
												),
												'value',
												null
											),
										}),
									},
								})
							);
							dispatch(removeBusyKey(busyKey));
						}
					);
				});
			}
		}
	}, [
		hasEditProfileRenderStylesCacheEntry,
		profileTemp?.theme,
		modalVisible,
	]);

	const updateItemTemp = useCallback((newProfile: MapsforgeProfile) => {
		dispatch(setMapsforgeProfileTemp(newProfile));
	}, []);

	const handleNameUpdate = useCallback(
		({ name }: { name: string }) => {
			profileTemp &&
				dispatch(
					setMapsforgeProfileTemp({
						...profileTemp,
						name,
					})
				);
		},
		[profileTemp]
	);

	return !profileTemp ? undefined : (
		<ModalWrapper
			visible={modalVisible}
			onLayout={() => setModalVisible(true)} // ???
			onDismiss={handleDismissModal}
			header={
				isNewKey === profileTemp.key
					? t('map.mapsforge.profileAddNewShort')
					: t('map.mapsforge.profileEdit')
			}
		>
			<View>
				<NameRowControl
					item={profileTemp}
					update={handleNameUpdate}
					// Info={isBusy ? undefined : t('hint.nameId')}
					Info={t('hint.nameId')}
				/>

				<LayerCountRow profile={profileTemp} />

				<ThemeControl
					renderStylesCache={renderStylesCache}
					updateItem={updateItemTemp}
				/>

				<RenderStyleRowControl
					AlternativeButton={isBusy ? <LoadingIndicator /> : undefined}
					Info={isBusy ? undefined : t('hint.maps.mapsforgeProfileStyle')}
					profile={profileTemp}
					updateProfile={updateItemTemp}
					renderStyleOptionsMap={renderStylesCache.optionsMap}
					renderDefaultStylesMap={renderStylesCache.defaultsMap}
				/>

				<RenderOverlaysRowControl
					AlternativeButton={isBusy ? () => <LoadingIndicator /> : undefined}
					Info={isBusy ? undefined : t('hint.maps.mapsforgeProfileOverlays')}
					profile={profileTemp}
					updateProfile={updateItemTemp}
					renderStyleOptionsMap={renderStylesCache.optionsMap}
					label={t('overlay', { count: 1 })}
				/>

				<HasLabelsControl updateProfile={updateItemTemp} />

				<HasBuildingsControl updateProfile={updateItemTemp} />

				{/* {!isBusy && ( */}
				<View style={styleModalControls}>
					<ButtonHighlight
						onPress={handleDismissModal}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('ok')}</Text>
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleRemoveItem}
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('map.mapsforge.profileRemove')}</Text>
					</ButtonHighlight>
				</View>
				{/* // )} */}
			</View>
		</ModalWrapper>
	);
};

const ControlIcon: FC<{
	color: string;
	style: Style;
}> = (props) => (
	<View style={controlIconStyle}>
		<IconIcomoon
			size={25}
			name="mapsforge_puzzle_only"
			{...props}
		/>
	</View>
);

const ControlInfo: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<View>
			<Text>{t('hint.maps.profiles')}</Text>
			<Text
				style={{
					marginTop: 20,
					...theme.fonts.bodyLarge,
				}}
			>
				{'Render theme downloads:'}
			</Text>
			{[
				{
					label: 'OpenAndroMaps Elevate & Elements by Tobias Kuehn',
					url: 'https://www.openandromaps.org/en/downloads',
				},
				{
					label: 'Outdoor & Desert by Bernard Mai',
					url: 'https://www.maiwolf.de/locus/',
				},
				{
					label: 'Tiramisù by Maki',
					url: 'https://github.com/IgorMagellan/Tiramisu',
				},
				{
					label: 'Alti by jhotadhari. Just a copy of elevate and andromaps_hike with landscape names copy of Desert',
					url: 'https://github.com/jhotadhari/Alti',
				},
			].map(({ label, url }) => (
				<HintLink
					key={url}
					label={label}
					url={url}
				/>
			))}
		</View>
	);
};

const ProfilesControl = ({
	setScrollEnabled,
	width,
	reverseDraggableItem,
	saveOnChange,
	saveOnUnmount,
	newLabel,
	uiStateKey = 'mapsforgeProfilesExpanded',
}: {
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
	width?: number;
	reverseDraggableItem?: boolean;
	saveOnChange: boolean;
	saveOnUnmount: boolean;
	newLabel?: string;
	uiStateKey?: string;
}) => {
	const dispatch = useAppDispatch();

	const { width: width_ } = useSafeAreaFrame();
	width = width ? width : width_;

	const { t } = useTranslation();
	const theme = useTheme();

	const [isNewKey, setIsNewKey] = useState<false | string>(false);

	const layers = useAppSelector((state) => selectLayers(state, { temp: true }));
	const profiles = useAppSelector((state) => selectMapsforgeProfiles(state, { temp: true }));

	const expanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));

	const saveProfiles = useCallback(() => {
		setIsNewKey(false);
		dispatch(
			setMapsforgeProfilesStore({
				temp: false,
			})
		);
	}, []);

	useEffect(() => {
		return saveOnUnmount ? saveProfiles : undefined;
	}, [saveOnUnmount]);

	const renderItem = useCallback(
		(item: MapsforgeProfile) => (
			<View key={item.key}>
				<DraggableItem
					item={item}
					width={width}
					reverse={!!reverseDraggableItem}
					// saveOnChange={saveOnChange}
					// saveProfiles={saveProfiles}
				/>
			</View>
		),
		[
			width,
			reverseDraggableItem,
			// saveOnChange,
			// saveProfiles,
		]
	);

	const handleAccordionPress = useCallback(() => {
		if (expanded) {
			saveProfiles();
		}
		dispatch(
			setElementExpanded({
				key: uiStateKey,
				expanded: !expanded,
			})
		);
	}, [
		expanded,
		saveProfiles,
		uiStateKey,
	]);

	const styleAccordion = useMemo(
		() => ({
			height: itemHeight * layers.length + 8,
			width,
		}),
		[width,layers]
	);

	const handleDragStart = useCallback(() => setScrollEnabled(false), []);

	const handleDragRelease = useCallback(
		(newProfiles: MapsforgeProfile[]) => {
			setScrollEnabled(true);
			dispatch(
				setMapsforgeProfilesStore({
					temp: !saveOnChange,
					mapsforgeProfiles: newProfiles,
				})
			);
		},
		[saveOnChange]
	);

	const infoButtonProps: IconButtonProps = useMemo(
		() => ({
			style: {
				marginTop: 0,
				marginBottom: 0,
				marginLeft: -23,
			},
			icon: 'information-variant',
			mode: 'outlined',
			iconColor: theme.colors.primary,
		}),
		[theme]
	);

	const handleAddNewProfile = useCallback(() => {
		const newProfile = getNewProfile();
		setIsNewKey(newProfile.key);
		dispatch(setMapsforgeProfileTemp(newProfile));
	}, []);

	return (
		<View>
			<EditModal
				saveOnChange={saveOnChange}
				saveProfiles={saveProfiles}
				isNewKey={isNewKey}
				setIsNewKey={setIsNewKey}
			/>

			<List.Accordion
				title={t('map.mapsforge.profile', { count: 0 })}
				left={ControlIcon}
				expanded={expanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
				{profiles.length && (
					<View style={styleAccordion}>
						<DraggableGrid
							style={styleDraggableGrid}
							itemHeight={itemHeight}
							numColumns={1}
							renderItem={renderItem}
							data={profiles}
							onDragStart={handleDragStart}
							onDragRelease={handleDragRelease}
						/>
					</View>
				)}

				{!profiles.length && (
					<Text style={styleItemsNone}>{t('map.mapsforge.profilesNone')}</Text>
				)}

				<View style={styleControls}>
					<InfoButton
						label={t('map.mapsforge.profile', { count: 0 })}
						headerPlural={true}
						backgroundBlur={true}
						Info={<ControlInfo />}
						buttonProps={infoButtonProps}
					/>

					<ButtonHighlight
						style={styleAddItem}
						icon="map-plus"
						mode="outlined"
						onPress={handleAddNewProfile}
					>
						{newLabel}
					</ButtonHighlight>
				</View>
			</List.Accordion>
		</View>
	);
};

export default ProfilesControl;
