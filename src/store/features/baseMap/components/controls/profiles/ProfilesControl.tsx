/**
 * External dependencies
 */
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import {
	View,
	TouchableHighlight,
	ViewStyle,
	LayoutChangeEvent,
	TextStyle,
	Dimensions,
} from 'react-native';
import { List, useTheme, Text, Icon, IconButtonProps } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DraggableGrid from 'react-native-draggable-grid';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { MapLayerMapsforgeModule, RenderStyleOptionsCollection } from 'react-native-mapsforge-vtm';

import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import InfoButton from '../../../../../../components/generic/InfoButton';
import IconIcomoon from '../../../../../../components/generic/IconIcomoon';
import NameRowControl from '../../../../../../components/generic/controls/NameRowControl';
import LoadingIndicator from '../../../../../../components/generic/LoadingIndicator';
import HintLink from '../../../../../../components/generic/HintLink';
import { runAfterInteractions } from '../../../../../../lib/utils';
import { MapsforgeProfile, LayerConfigOptionsMapsforge } from '../../../types';
import { getNewProfile } from '../../../utils';
import { selectElementExpanded, selectIsBusy } from '../../../../ui/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { addBusyKey, removeBusyKey, setElementExpanded } from '../../../../ui/uiSlice';
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
} from '../../../baseMapSlice';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';
import { stylesGeneric } from '../layers/LayersControl';
import RenderOverlaysControl from './RenderOverlaysControl';
import RenderStyleControl from './RenderStyleControl';
import LayerCount from './LayerCount';
import HasBuildingsControl from './HasBuildingsControl';
import HasLabelsControl from './HasLabelsControl';
import ThemeControl from './ThemeControl';

const itemHeight = 50;

const styleLayerCount = { flexGrow: 1 };

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
	}, [saveOnChange, saveProfiles]);

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
	}, [profileTemp?.theme, renderStylesCache.optionsMap]);

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
												undefined
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
					? t('baseMap.mapsforge.profileAddNewShort')
					: t('baseMap.mapsforge.profileEdit')
			}
		>
			<View style={stylesGeneric.modal}>
				<NameRowControl
					item={profileTemp}
					update={handleNameUpdate}
					// Info={isBusy ? undefined : t('hint.nameId')}
					Info={t('baseMap.hint.nameId')}
				/>

				<LayerCount profile={profileTemp} />

				<ThemeControl renderStylesCache={renderStylesCache} />

				<RenderStyleControl
					AlternativeButton={isBusy ? <LoadingIndicator /> : undefined}
					Info={isBusy ? undefined : t('baseMap.hint.mapsforgeProfileStyle')}
				/>

				<RenderOverlaysControl
					AlternativeButton={isBusy ? () => <LoadingIndicator /> : undefined}
					Info={isBusy ? undefined : t('baseMap.hint.mapsforgeProfileOverlays')}
					label={t('baseMap.overlay', { count: 1 })}
				/>

				<HasLabelsControl />

				<HasBuildingsControl />

				<View style={stylesGeneric.modalControls}>
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
						<Text>{t('baseMap.mapsforge.profileRemove')}</Text>
					</ButtonHighlight>
				</View>
			</View>
		</ModalWrapper>
	);
};

const ControlIcon: FC<{
	color: string;
	style: Style;
}> = (props) => (
	<View style={stylesGeneric.controlIcon}>
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
		<View style={{ gap: 16 }}>
			<Text>{t('baseMap.hint.profiles')}</Text>
			<Text
				style={{
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
			...(reverse ? stylesGeneric.itemReverse : stylesGeneric.item),
		}),
		[
			reverse,
			width,
			itemHeight,
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

	return (
		<View
			style={style}
			key={item.key}
		>
			<Text style={styleName}>{item.name}</Text>

			<Text style={styleLayerCount}>
				{sprintf('%s ' + t('baseMap.layerShort', { count: layersCount }), layersCount)}
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

const ProfilesControl = ({
	setScrollEnabled,
	width,
	reverseDraggableItem,
	saveOnChange,
	saveOnUnmount,
	uiStateKey = 'mapsforgeProfilesExpanded',
}: {
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
	width?: number;
	reverseDraggableItem?: boolean;
	saveOnChange: boolean;
	saveOnUnmount: boolean;
	uiStateKey?: string;
}) => {
	const dispatch = useAppDispatch();

	const { width: width_ } = Dimensions.get('window');
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
			height: itemHeight * profiles.length + 8,
		}),
		[profiles]
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
				title={t('baseMap.mapsforge.profile', { count: 0 })}
				left={ControlIcon}
				expanded={expanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
				{profiles.length && (
					<View style={styleAccordion}>
						<DraggableGrid
							style={stylesGeneric.grid}
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
					<Text style={stylesGeneric.itemsNone}>
						{t('baseMap.mapsforge.profilesNone')}
					</Text>
				)}

				<View style={stylesGeneric.controls}>
					<InfoButton
						label={t('baseMap.mapsforge.profile', { count: 0 })}
						headerPlural={true}
						backgroundBlur={true}
						Info={<ControlInfo />}
						buttonProps={infoButtonProps}
					/>

					<ButtonHighlight
						style={stylesGeneric.addItem}
						icon="map-plus"
						mode="outlined"
						onPress={handleAddNewProfile}
					>
						{t('baseMap.mapsforge.profileAddNew')}
					</ButtonHighlight>
				</View>
			</List.Accordion>
		</View>
	);
};

export default ProfilesControl;
