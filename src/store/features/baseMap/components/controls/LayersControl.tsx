/**
 * External dependencies
 */
import {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { View, TouchableHighlight, ViewStyle, LayoutChangeEvent, TextStyle } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { List, useTheme, Text, Icon, IconButtonProps } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DraggableGrid from 'react-native-draggable-grid';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoRowControl from '../../../../../components/generic/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import LayerControlOnlineRasterXYZ from './LayerControlOnlineRasterXYZ';
import LayerControlRasterMBTiles from './LayerControlRasterMBTiles';
import RadioListItem from '../../../../../components/generic/RadioListItem';
import LayerControlHillshading from './LayerControlHillshading';
import InfoButton from '../../../../../components/generic/InfoButton';
import NameRowControl from '../../../../../components/generic/NameRowControl';
// import LayerControlMapsforge from './LayerControlMapsforge';
import { fillLayerConfigOptionsWithDefaults } from '../../utils';
import { LayerOption, LayerConfig } from '../../types';
import { ContextSettingsMaps } from '../../ContextSettingsMaps';
import { getNewLayer } from '../../utils';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectElementExpanded } from '../../../ui/selectors';
import { setElementExpanded } from '../../../ui/uiSlice';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';
import { selectLayers, selectLayerTemp } from '../../selectors';

import { setLayers as setLayersStore, setLayerTemp } from '../../baseMapSlice';

export const mapTypeOptions: LayerOption[] = [
	{
		key: 'online-raster-xyz',
		type: 'base' as LayerOption['type'],
	},
	{
		key: 'mapsforge',
		type: 'base' as LayerOption['type'],
	},
	{
		key: 'raster-MBtiles',
		type: 'base' as LayerOption['type'],
	},
	{
		key: 'hillshading',
		type: 'overlay' as LayerOption['type'],
	},
].map((opt) => ({
	...opt,
	label: 'map.typeDesc.' + opt.key,
}));

const itemHeight = 50;
const labelMinWidth = 90;

const VisibilityControl: FC<{
	style?: ViewStyle;
	layer: LayerConfig;
	updateLayer: (newLayer: LayerConfig) => void;
}> = ({ style, layer, updateLayer }) => {
	const theme = useTheme();

	const handlePress = useCallback(() => {
		updateLayer({
			...layer,
			visible: !layer.visible,
		});
	}, [
		layer,
	]);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.elevation.level3}
			onPress={handlePress}
			style={{ borderRadius: theme.roundness, ...style }}
		>
			<Icon
				source={layer?.visible ? 'eye-outline' : 'eye-off-outline'}
				size={25}
			/>
		</TouchableHighlight>
	);
};

const VisibilityRowControl: FC<{
	layer: LayerConfig;
	updateLayer: (newLayer: LayerConfig) => void;
}> = ({ layer, updateLayer }) => {
	const { t } = useTranslation();
	return (
		<InfoRowControl
			label={t('visibility')}
			Info={t('hint.maps.visibility')}
		>
			<VisibilityControl
				layer={layer}
				updateLayer={updateLayer}
			/>
		</InfoRowControl>
	);
};

const DraggableItem: FC<{
	item: LayerConfig;
	width: number;
	reverse: boolean;
	saveOnChange: boolean;
	saveLayers: () => void;
}> = ({ item, width, reverse, saveOnChange, saveLayers }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const layers = useAppSelector((state) => selectLayers(state, { temp: true }));

	const [isToWide, setIsToWide] = useState(false);

	const style: ViewStyle = useMemo(
		() => ({
			width,
			height: itemHeight,
			justifyContent: 'space-between',
			alignItems: 'center',
			flexDirection: reverse ? 'row-reverse' : 'row',
			paddingLeft: reverse ? 14 : 24,
			paddingRight: reverse ? 24 : 14,
		}),
		[
			width,
			itemHeight,
			reverse,
		]
	);

	const styleVisibility: ViewStyle = useMemo(
		() => ({
			padding: 10,
			...(reverse && { marginRight: -10 }),
			...(!reverse && { marginLeft: -10 }),
		}),
		[reverse]
	);

	const styleName: ViewStyle = useMemo(
		() => ({
			justifyContent: 'space-between',
			alignItems: 'center',
			flexDirection: reverse ? 'row-reverse' : 'row',
			flexGrow: 1,
			marginLeft: 5,
			marginRight: 5,
		}),
		[reverse]
	);

	const styleAction: ViewStyle = useMemo(
		() => ({
			padding: 10,
			borderRadius: theme.roundness,
		}),
		[theme]
	);

	const handlePress = useCallback(() => dispatch(setLayerTemp(item)), [item]);

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

	const updateLayer = useCallback(
		(newLayer: LayerConfig) => {
			const layerIndex = layers.findIndex((layer) => layer.key === newLayer?.key);
			if (layerIndex !== -1) {
				const newLayers = [...layers];
				newLayers[layerIndex] = newLayer;
				dispatch(
					setLayersStore({
						temp: true,
						layers: newLayers,
					})
				);
				if (saveOnChange) {
					saveLayers();
				}
			}
		},
		[
			layers,
			saveOnChange,
			saveLayers,
		]
	);

	return (
		<View
			style={style}
			key={item.key}
		>
			<VisibilityControl
				style={styleVisibility}
				layer={item}
				updateLayer={updateLayer}
			/>

			<View style={styleName}>
				<Text>{item.name}</Text>
				{!isToWide && <Text>[{item.type}]</Text>}
			</View>

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

const OptionSelectType: FC<{
	option: LayerOption;
}> = ({ option }) => {
	const dispatch = useAppDispatch();
	const layerTemp = useAppSelector(selectLayerTemp);

	const onPress = useCallback(() => {
		layerTemp &&
			dispatch(
				setLayerTemp({
					...layerTemp,
					type: option.key,
				})
			);
	}, [layerTemp, option]);

	return (
		<RadioListItem
			opt={option}
			onPress={onPress}
			labelExtractor={(a) => a.key}
			descExtractor={(a) => a.label}
		/>
	);
};

const styleSelectType: TextStyle = { marginBottom: 18 };
const styleModalRowType: ViewStyle = { marginBottom: 10, flexDirection: 'row' };
const styleModalRowTypeLabel: TextStyle = { minWidth: labelMinWidth + 12 };

const EditModal: FC<{
	saveOnChange: boolean;
	saveLayers: () => void;
}> = ({ saveOnChange, saveLayers }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();
	const layerTemp = useAppSelector(selectLayerTemp);
	const layers = useAppSelector((state) => selectLayers(state, { temp: true }));

	const [modalVisible, setModalVisible] = useState(false);

	useEffect(() => {
		setModalVisible(!!layerTemp);
	}, [layerTemp]);

	const handleDismissModal = useCallback(() => {
		setModalVisible(false);

		// update layer

		dispatch(setLayerTemp(undefined));
		if (saveOnChange) {
			saveLayers();
		}
	}, [
		// updateLayer,
		saveOnChange,
		saveLayers,
	]);

	const handleRemoveLayer = useCallback(() => {
		const layerIndex = layers.findIndex((layer) => layer.key === layerTemp?.key);
		if (layerIndex !== -1) {
			const newLayers = [...layers];
			newLayers.splice(layerIndex, 1);
			dispatch(
				setLayersStore({
					temp: true,
					layers: newLayers,
				})
			);
			handleDismissModal();
		}
	}, [
		handleDismissModal,
		layers,
		layerTemp?.key,
	]);

	const updateLayer = useCallback((newLayer: LayerConfig) => {
		dispatch(setLayerTemp(newLayer));
	}, []);

	const handleNameUpdate = useCallback(
		({ name }: { name: string }) => {
			layerTemp &&
				dispatch(
					setLayerTemp({
						...layerTemp,
						name,
					})
				);
		},
		[layerTemp]
	);

	return !layerTemp ? undefined : (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={handleDismissModal}
			header={layerTemp.type ? t('map.layerEdit') : t('map.addNewLayerShort')}
		>
			{!layerTemp.type && (
				<View>
					<Text style={styleSelectType}>{t('map.selectType')}</Text>
					{[...mapTypeOptions].map((opt: LayerOption) => (
						<OptionSelectType
							key={opt.key}
							option={opt}
						/>
					))}
				</View>
			)}

			{layerTemp.type && (
				<View>
					<View style={styleModalRowType}>
						<Text style={styleModalRowTypeLabel}>{t('map.mapType')}:</Text>
						<Text>{layerTemp.type}</Text>
					</View>

					<NameRowControl
						item={layerTemp}
						update={handleNameUpdate}
						Info={t('hint.nameId')}
					/>

					<VisibilityRowControl
						layer={layerTemp}
						updateLayer={updateLayer}
					/>

					{/*
					{'online-raster-xyz' === layerTemp.type && <LayerControlOnlineRasterXYZ />}

					{'mapsforge' === layerTemp.type && <LayerControlMapsforge />}

					{'hillshading' === layerTemp.type && <LayerControlHillshading />}

					{'raster-MBtiles' === layerTemp.type && <LayerControlRasterMBTiles />}
					*/}

					<View
						style={{
							marginTop: 20,
							marginBottom: 40,
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<ButtonHighlight
							onPress={handleDismissModal}
							mode="contained"
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Text>{t('ok')}</Text>
						</ButtonHighlight>

						<ButtonHighlight
							onPress={handleRemoveLayer}
							mode="contained"
							buttonColor={theme.colors.errorContainer}
							textColor={theme.colors.onErrorContainer}
						>
							<Text>{t('map.layerRemove')}</Text>
						</ButtonHighlight>
					</View>
				</View>
			)}
		</ModalWrapper>
	);
};

const controlIconStyle: ViewStyle = {
	marginLeft: 7,
	marginRight: -7,
	justifyContent: 'center',
};

const ControlIcon: FC<{
	color: string;
	style: Style;
}> = (props) => (
	<View style={controlIconStyle}>
		<List.Icon
			{...props}
			icon="layers-triple"
		/>
	</View>
);

const styleDraggableGrid = {
	marginLeft: -40, // revert paper paddingLeft 40
};

const styleLayersNone = { marginLeft: 18, marginBottom: 35 };

const styleControls: ViewStyle = {
	justifyContent: 'space-between',
	flexDirection: 'row',
	marginBottom: 25,
};

const styleAddLayer = { marginRight: 20 };

const LayersControl = ({
	setScrollEnabled,
	width,
	reverseDraggableItem,
	saveOnChange,
	saveOnUnmount,
	newLabel,
	uiStateKey = 'mapLayersExpanded',
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

	const layers = useAppSelector((state) => selectLayers(state, { temp: true }));

	const expanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));

	const saveLayers = useCallback(() => {
		dispatch(
			setLayersStore({
				temp: false,
			})
		);
	}, []);

	useEffect(() => {
		return saveOnUnmount ? saveLayers : undefined;
	}, [saveOnUnmount]);

	const renderItem = useCallback(
		(item: LayerConfig) => (
			<View key={item.key}>
				<DraggableItem
					item={item}
					width={width}
					reverse={!!reverseDraggableItem}
					saveOnChange={saveOnChange}
					saveLayers={saveLayers}
				/>
			</View>
		),
		[
			width,
			reverseDraggableItem,
			saveOnChange,
			saveLayers,
		]
	);

	const handleAccordionPress = useCallback(() => {
		if (expanded) {
			saveLayers();
		}
		dispatch(
			setElementExpanded({
				key: uiStateKey,
				expanded: !expanded,
			})
		);
	}, [
		expanded,
		saveLayers,
		uiStateKey,
	]);

	const styleAccordion = useMemo(
		() => ({
			height: itemHeight * layers.length + 8,
			width,
		}),
		[width]
	);

	const handleDragStart = useCallback(() => setScrollEnabled(false), []);

	const handleDragRelease = useCallback(
		(newLayers: LayerConfig[]) => {
			setScrollEnabled(true);
			dispatch(
				setLayersStore({
					temp: !saveOnChange,
					layers: newLayers,
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

	const handleAddNewLayer = useCallback(() => dispatch(setLayerTemp(getNewLayer())), []);

	return (
		<View>
			<EditModal
				saveOnChange={saveOnChange}
				saveLayers={saveLayers}
			/>

			<List.Accordion
				title={t('map.layer', { count: 0 })}
				left={ControlIcon}
				expanded={expanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
				{layers.length && (
					<View style={styleAccordion}>
						<DraggableGrid
							style={styleDraggableGrid}
							itemHeight={itemHeight}
							numColumns={1}
							renderItem={renderItem}
							data={layers}
							onDragStart={handleDragStart}
							onDragRelease={handleDragRelease}
						/>
					</View>
				)}

				{!layers.length && <Text style={styleLayersNone}>{t('map.layersNone')}</Text>}

				<View style={styleControls}>
					<InfoButton
						label={t('map.layer', { count: 0 })}
						headerPlural={true}
						backgroundBlur={true}
						Info={t('hint.maps.layers')}
						buttonProps={infoButtonProps}
					/>

					<ButtonHighlight
						style={styleAddLayer}
						icon="map-plus"
						mode="outlined"
						onPress={handleAddNewLayer}
					>
						{newLabel}
					</ButtonHighlight>
				</View>
			</List.Accordion>
		</View>
	);
};

export default LayersControl;
