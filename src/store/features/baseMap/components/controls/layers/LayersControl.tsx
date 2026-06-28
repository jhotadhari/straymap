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
	ViewStyle,
	LayoutChangeEvent,
	StyleSheet,
	Dimensions,
} from 'react-native';
import { List, useTheme, Text, Icon, IconButtonProps } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Sortable, { SortableFlexDragEndParams } from 'react-native-sortables';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import RadioListItem from '../../../../../../components/generic/RadioListItem';
import InfoButton from '../../../../../../components/generic/InfoButton';
import NameRowControl from '../../../../../../components/generic/controls/NameRowControl';
import LayerControlMapsforge from './LayerControlMapsforge';
import { LayerOption, LayerConfig } from '../../../types';
import { getNewLayer } from '../../../utils';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectElementExpanded } from '../../../../ui/selectors';
import { setElementExpanded } from '../../../../ui/slice';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';
import { selectLayers, selectLayerTemp } from '../../../selectors';

import { setLayers as setLayersStore, setLayerTemp } from '../../../slice';
import VisibilityControl, { VisibilityRowControl } from './VisibilityControl';
import LayerControlOnlineRasterXYZ from './LayerControlOnlineRasterXYZ';
import LayerControlRasterMBTiles from './LayerControlRasterMBTiles';
import LayerControlHillshading from './LayerControlHillshading';
import { labelMinWidth } from '../../../../../../components/generic/controls/InfoRowControl';
import { sharedStyles } from '../../../../../../sharedStyles';
import { sharedStyles as sharedStylesBaseMapControls } from '../sharedDeps';
import useDropIndicatorStyle from '../../../../../../compose/useDropIndicatorStyle';

export const mapTypeOptions: LayerOption[] = [
	{
		key: 'online-raster-xyz',
		kind: 'base' as LayerOption['kind'],
	},
	{
		key: 'mapsforge',
		kind: 'base' as LayerOption['kind'],
	},
	{
		key: 'raster-MBtiles',
		kind: 'base' as LayerOption['kind'],
	},
	{
		key: 'hillshading',
		kind: 'overlay' as LayerOption['kind'],
	},
].map((opt) => ({
	...opt,
	label: 'map.typeDesc.' + opt.key,
}));

export const itemHeight = 56;

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
			...(reverse
				? sharedStylesBaseMapControls.itemReverse
				: sharedStylesBaseMapControls.item),
		}),
		[
			reverse,
			width,
		]
	);

	const styleVisibility: ViewStyle = useMemo(
		() => ({
			padding: 10,
			flexShrink: 0,
			...(reverse && { marginRight: -10 }),
			...(!reverse && { marginLeft: -10 }),
		}),
		[reverse]
	);

	const styleName: ViewStyle = useMemo(
		() => ({
			alignItems: 'center',
			flexDirection: reverse ? 'row-reverse' : 'row',
			flexGrow: 1,
			flexShrink: 1,
			minWidth: 0,
			gap: 8,
			marginLeft: 5,
			marginRight: 5,
		}),
		[reverse]
	);

	const styleAction: ViewStyle = useMemo(
		() => ({
			padding: 10,
			borderRadius: theme.roundness,
			flexShrink: 0,
		}),
		[theme]
	);

	const handlePress = useCallback(() => dispatch(setLayerTemp(item)), [dispatch, item]);

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

	const updateItem = useCallback(
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
			dispatch,
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
				updateLayer={updateItem}
			/>

			<Sortable.Handle
				mode="draggable"
				style={styleName}
			>
				<Text
					style={styles.itemTitle}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{item.name}
				</Text>
				{!isToWide && (
					<Text
						style={styles.itemType}
						numberOfLines={1}
					>
						[{item.type}]
					</Text>
				)}
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

const OptionSelectType: FC<{
	option: LayerOption;
}> = ({ option }) => {
	const dispatch = useAppDispatch();

	const onPress = useCallback(() => {
		dispatch(
			setLayerTemp(
				(layerTemp) =>
					layerTemp &&
					({
						...layerTemp,
						type: option.key,
					} as LayerConfig)
			)
		);
	}, [dispatch, option]);

	return (
		<RadioListItem
			opt={option}
			onPress={onPress}
			labelExtractor={(a) => a.key}
			descExtractor={(a) => a.label}
		/>
	);
};

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
		dispatch(setLayerTemp(undefined));
		if (saveOnChange) {
			saveLayers();
		}
	}, [
		dispatch,
		saveOnChange,
		saveLayers,
	]);

	const handleRemoveItem = useCallback(() => {
		const idx = layers.findIndex((layer) => layer.key === layerTemp?.key);
		if (idx !== -1) {
			const newLayers = [...layers];
			newLayers.splice(idx, 1);
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
		dispatch,
	]);

	const updateItemTemp = useCallback(
		(newLayer: LayerConfig) => {
			dispatch(setLayerTemp(newLayer));
		},
		[
			dispatch,
		]
	);

	const handleNameUpdate = useCallback(
		({ name }: { name: string }) => {
			dispatch(
				setLayerTemp(
					(layerTemp) =>
						layerTemp &&
						({
							...layerTemp,
							name,
						} as LayerConfig)
				)
			);
		},
		[
			dispatch,
		]
	);

	return !layerTemp ? undefined : (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={handleDismissModal}
			header={layerTemp.type ? t('baseMap.layerEdit') : t('baseMap.addNewLayerShort')}
		>
			{!layerTemp.type && (
				<View>
					<Text style={styles.selectType}>{t('baseMap.selectType')}</Text>
					{[...mapTypeOptions].map((opt: LayerOption) => (
						<OptionSelectType
							key={opt.key}
							option={opt}
						/>
					))}
				</View>
			)}

			{layerTemp.type && (
				<View style={sharedStyles.modal}>
					<View style={styles.modalRowType}>
						<Text style={styles.modalRowTypeLabel}>{t('baseMap.mapType')}:</Text>
						<Text>{layerTemp.type}</Text>
					</View>

					<NameRowControl
						item={layerTemp}
						update={handleNameUpdate}
						Info={t('basemap.hint.nameId')}
					/>

					<VisibilityRowControl
						layer={layerTemp}
						updateLayer={updateItemTemp}
					/>

					{'mapsforge' === layerTemp.type && <LayerControlMapsforge />}

					{'online-raster-xyz' === layerTemp.type && <LayerControlOnlineRasterXYZ />}

					{'hillshading' === layerTemp.type && <LayerControlHillshading />}

					{'raster-MBtiles' === layerTemp.type && <LayerControlRasterMBTiles />}

					<View style={sharedStyles.modalControls}>
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
							<Text>{t('baseMap.layerRemove')}</Text>
						</ButtonHighlight>
					</View>
				</View>
			)}
		</ModalWrapper>
	);
};

const ControlIcon: (props: { color: string; style: Style }) => ReactNode = (props) => (
	<View style={sharedStyles.controlIcon}>
		<List.Icon
			{...props}
			icon="layers-triple"
		/>
	</View>
);

const LayersControl: FC<{
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
	uiStateKey = 'mapLayersExpanded',
	newLabel,
}) => {
	const dispatch = useAppDispatch();

	const { width: width_ } = Dimensions.get('window');
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
	}, [
		dispatch,
	]);

	useEffect(() => {
		return saveOnUnmount ? saveLayers : undefined;
	}, [saveOnUnmount, saveLayers]);

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
		dispatch,
	]);

	const styleAccordion = useMemo(
		() => ({
			height: itemHeight * layers.length + 8,
			width,
		}),
		[width, layers]
	);

	const handleDragStart = useCallback(() => setScrollEnabled(false), [setScrollEnabled]);

	const handleDragEnd = useCallback(
		({ indexToKey }: SortableFlexDragEndParams) => {
			setScrollEnabled(true);
			const newLayers = indexToKey
				.map((toKey) => layers.find((layer) => layer.key === toKey.replace('.$', '')))
				.filter((a): a is LayerConfig => !!a);
			dispatch(
				setLayersStore({
					temp: !saveOnChange,
					layers: newLayers,
				})
			);
		},
		[
			dispatch,
			saveOnChange,
			setScrollEnabled,
			layers,
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

	const handleAddNewLayer = useCallback(
		() => dispatch(setLayerTemp(getNewLayer())),
		[
			dispatch,
		]
	);

	return (
		<View>
			<EditModal
				saveOnChange={saveOnChange}
				saveLayers={saveLayers}
			/>

			<List.Accordion
				title={t('baseMap.layer', { count: 0 })}
				left={ControlIcon}
				expanded={expanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
				{layers.length > 0 && (
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
							{layers.map((item) => (
								<View key={item.key}>
									<DraggableItem
										item={item}
										width={width}
										reverse={!!reverseDraggableItem}
										saveOnChange={saveOnChange}
										saveLayers={saveLayers}
									/>
								</View>
							))}
						</Sortable.Flex>
					</View>
				)}

				{!layers.length && (
					<Text style={sharedStylesBaseMapControls.itemsNone}>
						{t('baseMap.layersNone')}
					</Text>
				)}

				<View style={sharedStylesBaseMapControls.controls}>
					<InfoButton
						label={t('baseMap.layer', { count: 0 })}
						headerPlural={true}
						backgroundBlur={true}
						Info={t('baseMap.hint.layers')}
						buttonProps={infoButtonProps}
					/>

					<ButtonHighlight
						style={sharedStylesBaseMapControls.addItem}
						icon="map-plus"
						mode="outlined"
						onPress={handleAddNewLayer}
					>
						{newLabel ?? t('baseMap.addNewLayer')}
					</ButtonHighlight>
				</View>
			</List.Accordion>
		</View>
	);
};

export const styles = StyleSheet.create({
	selectType: { marginBottom: 18 },
	itemTitle: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
	itemType: { flexShrink: 0 },
	modalRowTypeLabel: { minWidth: labelMinWidth + 12 },
	modalRowType: { flexDirection: 'row' },
});

export default LayersControl;
