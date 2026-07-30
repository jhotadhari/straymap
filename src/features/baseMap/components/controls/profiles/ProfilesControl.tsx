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
	useRef,
	useState,
} from 'react';
import {
	View,
	TouchableHighlight,
	ViewStyle,
	LayoutChangeEvent,
	TextStyle,
	Dimensions,
	StyleSheet,
} from 'react-native';
import { List, useTheme, Text, Icon, IconButtonProps } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Sortable, { SortableFlexDragEndParams } from 'react-native-sortables';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';
import { useRenderStyleOptions } from 'react-native-mapsforge-vtm';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../../../components/generic/wrapper/ModalWrapper';
import InfoButton from '../../../../../components/generic/infoWrapper/InfoButton';
import IconCustom from '../../../../../components/generic/primitives/IconCustom';
import NameRowControl from '../../../../../components/generic/controls/NameRowControl';
import LoadingIndicator from '../../../../../components/generic/primitives/LoadingIndicator';
import HintLink from '../../../../../components/generic/primitives/HintLink';
import { MapsforgeProfile, LayerConfigOptionsMapsforge } from '../../../types';
import { getNewProfile } from '../../../utils';
import { selectElementExpanded } from '../../../../ui/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { setElementExpanded } from '../../../../ui/slice';
import {
	selectLayers,
	selectMapsforgeProfiles,
	selectMapsforgeProfileTemp,
	selectRenderStylesCache,
} from '../../../selectors';
import {
	setMapsforgeProfiles as setMapsforgeProfilesStore,
	setMapsforgeProfileTemp,
	setRenderStylesCache,
} from '../../../slice';
import { sharedStyles } from '../../../../../sharedStyles';
import { sharedStyles as sharedStylesBaseMapControls } from '../sharedDeps';
import useDropIndicatorStyle from '../../../../../compose/useDropIndicatorStyle';
import RenderOverlaysControl from './RenderOverlaysControl';
import RenderStyleControl from './RenderStyleControl';
import LayerCount from './LayerCount';
import HasBuildingsControl from './HasBuildingsControl';
import HasLabelsControl from './HasLabelsControl';
import ThemeControl from './ThemeControl';
import { BUTTON_ICON_SIZE } from '../../../../../constants';
import { useButtonProps } from '../../../../../compose/useButtonProps';

const itemHeight = 50;

const renderLoadingIndicator = () => <LoadingIndicator />;

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
		dispatch,
		setIsNewKey,
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
		dispatch,
	]);

	// Local rather than the global busyKeys/isBusy flag: this only gates two sub-buttons in this
	// modal, not the whole app, so it shouldn't compete with isBusy's "block the splash/whole app"
	// meaning.
	const [isFetchingTheme, setIsFetchingTheme] = useState(false);

	const renderStylesCache = useAppSelector(selectRenderStylesCache);

	const hasEditProfileRenderStylesCacheEntry = useMemo(() => {
		return !!(profileTemp?.theme && get(renderStylesCache.optionsMap, profileTemp.theme));
	}, [profileTemp?.theme, renderStylesCache.optionsMap]);

	const requestedRenderTheme =
		modalVisible && profileTemp?.theme && !hasEditProfileRenderStylesCacheEntry
			? profileTemp.theme
			: undefined;

	const handleRenderThemeError = useCallback(() => {
		setIsFetchingTheme(false);
	}, []);

	const { renderStyleDefaultId, renderStyleOptions } = useRenderStyleOptions({
		renderTheme: requestedRenderTheme,
		onError: handleRenderThemeError,
	});

	// useRenderStyleOptions exposes no loading flag -- when renderTheme changes it resets
	// renderStyleOptions/renderStyleDefaultId to empty in its own effect (a separate render) before
	// the real (possibly also empty, for a theme without a <stylemenu>) result lands in a later
	// render. So an empty array alone can't tell "still loading" apart from "loaded and genuinely
	// empty". Track which render this is for the current requestedRenderTheme instead: tick 1 is
	// the request itself, tick 2 is the hook's internal reset, tick 3+ is the real result.
	const fetchThemeRef = useRef<string | undefined>(undefined);
	const fetchTickRef = useRef(0);

	useEffect(() => {
		if (!requestedRenderTheme || !profileTemp) {
			fetchThemeRef.current = undefined;
			fetchTickRef.current = 0;
			return;
		}

		if (fetchThemeRef.current !== requestedRenderTheme) {
			fetchThemeRef.current = requestedRenderTheme;
			fetchTickRef.current = 1;
			setIsFetchingTheme(true);
			return;
		}

		fetchTickRef.current += 1;
		if (fetchTickRef.current < 3) {
			return;
		}

		dispatch(
			setRenderStylesCache({
				optionsMap: {
					...renderStylesCache.optionsMap,
					[requestedRenderTheme]: renderStyleOptions,
				},
				defaultsMap: {
					...renderStylesCache.defaultsMap,
					[requestedRenderTheme]: renderStyleDefaultId ?? undefined,
				},
			})
		);
		setIsFetchingTheme(false);
	}, [
		requestedRenderTheme,
		profileTemp,
		renderStyleOptions,
		renderStyleDefaultId,
		dispatch,
		renderStylesCache.defaultsMap,
		renderStylesCache.optionsMap,
	]);

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
		[dispatch, profileTemp]
	);

	const handleLayout = useCallback(() => setModalVisible(true), []);

	const buttonProps = useButtonProps({
		isDestructive: true,
	});

	return !profileTemp ? undefined : (
		<ModalWrapper
			visible={modalVisible}
			onLayout={handleLayout}
			onDismiss={handleDismissModal}
			headerLabel={
				isNewKey === profileTemp.key
					? t('baseMap.mapsforge.profileAddNewShort')
					: t('baseMap.mapsforge.profileEdit')
			}
		>
			<View style={sharedStyles.modal}>
				<NameRowControl
					item={profileTemp}
					update={handleNameUpdate}
					// Info={isFetchingTheme ? undefined : t('hint.nameId')}
					Info={t('baseMap.hint.nameId')}
				/>

				<LayerCount profile={profileTemp} />

				<ThemeControl
					renderStylesCache={renderStylesCache}
					isFetchingTheme={isFetchingTheme}
				/>

				<RenderStyleControl
					AlternativeButton={isFetchingTheme ? <LoadingIndicator /> : undefined}
					Info={isFetchingTheme ? undefined : t('baseMap.hint.mapsforgeProfileStyle')}
				/>

				<RenderOverlaysControl
					AlternativeButton={isFetchingTheme ? renderLoadingIndicator : undefined}
					Info={isFetchingTheme ? undefined : t('baseMap.hint.mapsforgeProfileOverlays')}
					label={t('baseMap.overlay', { count: 1 })}
				/>

				<HasLabelsControl />

				<HasBuildingsControl />

				<View style={sharedStyles.modalControlsEnd}>
					<ButtonHighlight
						{...buttonProps}
						onPress={handleRemoveItem}
					>
						{t('baseMap.mapsforge.profileRemove')}
					</ButtonHighlight>
				</View>
			</View>
		</ModalWrapper>
	);
};

const ControlIcon: (props: { color: string; style: Style }) => ReactNode = (props) => (
	<View style={sharedStyles.controlIcon}>
		<IconCustom
			size={25}
			name="mapsforge_puzzle_only"
			{...props}
		/>
	</View>
);

const themeDownloadLinks = [
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
];

const ControlInfo: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<View style={styles.controlInfo}>
			<Text>{t('baseMap.hint.profiles')}</Text>
			<Text style={theme.fonts.bodyLarge}>{t('renderThemeDownloads') + ':'}</Text>
			{themeDownloadLinks.map(({ label, url }) => (
				<HintLink
					key={url}
					label={label}
					url={url}
				/>
			))}
		</View>
	);
};

const DraggableItem = ({
	item,
	width,
	reverse,
}: {
	item: MapsforgeProfile;
	width: number;
	reverse: boolean;
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
			...(reverse
				? sharedStylesBaseMapControls.itemReverse
				: sharedStylesBaseMapControls.item),
		}),
		[
			reverse,
			width,
		]
	);

	const styleAction: ViewStyle = useMemo(
		() => ({
			padding: 10,
			borderRadius: theme.roundness,
			flexShrink: 0,
		}),
		[theme]
	);

	const styleName: TextStyle = useMemo(
		() => ({
			textAlign: reverse ? 'right' : 'left',
			flexGrow: 1,
			flexShrink: 1,
			minWidth: 0,
		}),
		[reverse]
	);

	const styleHandle: ViewStyle = useMemo(
		() => ({
			flexDirection: reverse ? 'row-reverse' : 'row',
			alignItems: 'center',
			flexGrow: 1,
			flexShrink: 1,
			minWidth: 0,
			gap: 8,
		}),
		[reverse]
	);

	const styleMeta: ViewStyle = useMemo(
		() => ({
			flexDirection: reverse ? 'row-reverse' : 'row',
			alignItems: 'center',
			flexShrink: 0,
			gap: 8,
		}),
		[reverse]
	);

	const handlePress = useCallback(
		() => dispatch(setMapsforgeProfileTemp(item)),
		[dispatch, item]
	);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			if (
				(reverse && event.nativeEvent.layout.x < 0) ||
				(!reverse && event.nativeEvent.layout.x + event.nativeEvent.layout.width > width)
			) {
				setIsToWide(true);
			}
		},
		[reverse, width]
	);

	return (
		<View
			style={style}
			key={item.key}
		>
			<Sortable.Handle
				mode="draggable"
				style={styleHandle}
			>
				<Text
					style={styleName}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{item.name}
				</Text>

				<View style={styleMeta}>
					<Text numberOfLines={1}>
						{sprintf(
							'%s ' + t('baseMap.layerShort', { count: layersCount }),
							layersCount
						)}
					</Text>

					{!isToWide && (
						<Text
							style={reverse ? styles.themeLabelReverse : undefined}
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							[{themeLabel}]
						</Text>
					)}
				</View>
			</Sortable.Handle>

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

const ProfilesControl: FC<{
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
	width?: number;
	reverseDraggableItem?: boolean;
	saveOnChange: boolean;
	saveOnUnmount: boolean;
	uiStateKey?: string;
	newLabel?: string;
}> = ({
	setScrollEnabled,
	width,
	reverseDraggableItem,
	saveOnChange,
	saveOnUnmount,
	uiStateKey = 'mapsforgeProfilesExpanded',
	newLabel,
}) => {
	const dispatch = useAppDispatch();

	const { width: width_ } = Dimensions.get('window');
	width = width ? width : width_;

	const { t } = useTranslation();
	const theme = useTheme();

	const [isNewKey, setIsNewKey] = useState<false | string>(false);

	const profiles = useAppSelector((state) => selectMapsforgeProfiles(state, { temp: true }));

	const expanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));

	const saveProfiles = useCallback(() => {
		setIsNewKey(false);
		dispatch(
			setMapsforgeProfilesStore({
				temp: false,
			})
		);
	}, [
		dispatch,
	]);

	useEffect(() => {
		return saveOnUnmount ? saveProfiles : undefined;
	}, [saveOnUnmount, saveProfiles]);

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
		dispatch,
	]);

	const styleAccordion = useMemo(
		() => ({
			height: itemHeight * profiles.length + 8,
		}),
		[profiles]
	);

	const handleDragStart = useCallback(() => setScrollEnabled(false), [setScrollEnabled]);

	const handleDragEnd = useCallback(
		({ indexToKey }: SortableFlexDragEndParams) => {
			setScrollEnabled(true);
			const newProfiles = indexToKey
				.map((toKey) => profiles.find((profile) => profile.key === toKey.replace('.$', '')))
				.filter((a): a is MapsforgeProfile => !!a);
			dispatch(
				setMapsforgeProfilesStore({
					temp: !saveOnChange,
					mapsforgeProfiles: newProfiles,
				})
			);
		},
		[
			dispatch,
			saveOnChange,
			profiles,
			setScrollEnabled,
		]
	);

	const dropIndicatorStyle = useDropIndicatorStyle();

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
	}, [
		dispatch,
	]);

	const buttonProps = useButtonProps({
		mode: 'outlined',
		textColor: theme.colors.primary,
	});

	return (
		<View>
			<EditModal
				saveOnChange={saveOnChange}
				saveProfiles={saveProfiles}
				isNewKey={isNewKey}
				setIsNewKey={setIsNewKey}
			/>

			<List.Accordion
				title={t('baseMap.mapsforge.profile', { count: 0 })}
				left={ControlIcon}
				expanded={expanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
				{profiles.length && (
					<View style={[styleAccordion, sharedStylesBaseMapControls.grid]}>
						<Sortable.Flex
							itemEntering={null}
							gap={0}
							padding={0}
							sortEnabled={true}
							customHandle={true}
							showDropIndicator={true}
							dropIndicatorStyle={dropIndicatorStyle}
							flexDirection="column"
							reorderTriggerOrigin="touch"
							alignItems="center"
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
						>
							{profiles.map((item) => (
								<View key={item.key}>
									<DraggableItem
										item={item}
										width={width}
										reverse={!!reverseDraggableItem}
									/>
								</View>
							))}
						</Sortable.Flex>
					</View>
				)}

				{!profiles.length && (
					<Text style={sharedStylesBaseMapControls.itemsNone}>
						{t('baseMap.mapsforge.profilesNone')}
					</Text>
				)}

				<View style={sharedStylesBaseMapControls.controls}>
					<InfoButton
						label={t('baseMap.mapsforge.profile', { count: 0 })}
						headerPlural={true}
						backgroundBlur={true}
						Info={<ControlInfo />}
						buttonProps={infoButtonProps}
					/>

					<ButtonHighlight
						{...buttonProps}
						onPress={handleAddNewProfile}
						icon={AddIcon}
					>
						{newLabel ?? t('baseMap.mapsforge.profileAddNew')}
					</ButtonHighlight>
				</View>
			</List.Accordion>
		</View>
	);
};

const AddIcon: IconSource = () => {
	const theme = useTheme();
	return (
		<IconCustom
			name="mapsforge_puzzle_plus"
			size={BUTTON_ICON_SIZE}
			color={theme.colors.primary}
		/>
	);
};

const styles = StyleSheet.create({
	controlInfo: { gap: 16 },
	themeLabelReverse: { marginRight: 10 },
});

export default ProfilesControl;
