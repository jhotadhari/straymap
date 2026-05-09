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
import {
	View,
	TouchableHighlight,
	ViewStyle,
	LayoutChangeEvent,
	TextStyle,
} from 'react-native';
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
import LayerControlMapsforge from './LayerControlMapsforge';
import { fillLayerConfigOptionsWithDefaults } from '../../../../../utils';
import { LayerConfig } from '../../types';
import { LayerOption } from '../../../../../types';
import { ContextSettingsMaps } from '../../ContextSettingsMaps';
import { getNewLayer } from '../../utils';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectElementExpanded } from '../../../ui/selectors';
import { setElementExpanded } from '../../../ui/uiSlice';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';

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

const VisibilityControl = ({
	item,
	style,
	updateLayer,
}: {
	item: LayerConfig;
	style?: ViewStyle;
	updateLayer: (newLayer: LayerConfig) => void;
}) => {
	const theme = useTheme();

	const handlePress = useCallback(
		() =>
			updateLayer({
				...item,
				visible: !item.visible,
			}),
		[updateLayer, item]
	);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.elevation.level3}
			onPress={handlePress}
			style={{ borderRadius: theme.roundness, ...style }}
		>
			<Icon
				source={item.visible ? 'eye-outline' : 'eye-off-outline'}
				size={25}
			/>
		</TouchableHighlight>
	);
};

const VisibilityRowControl = ({
	item,
	updateLayer,
}: {
	item: LayerConfig;
	updateLayer: (newLayer: LayerConfig) => void;
}) => {
	const { t } = useTranslation();
	return (
		<InfoRowControl
			label={t('visibility')}
			Info={t('hint.maps.visibility')}
		>
			<VisibilityControl
				item={item}
				updateLayer={updateLayer}
			/>
		</InfoRowControl>
	);
};

const DraggableItem = ({
	item,
	width,
	reverse,
}: {
	item: LayerConfig;
	width: number;
	reverse: boolean;
}) => {
	const theme = useTheme();

	const [isToWide, setIsToWide] = useState(false);

	const { setEditLayer, updateLayer } = useContext(ContextSettingsMaps);

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

	const handlePress = useCallback(() => setEditLayer(item), [setEditLayer, item]);

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
			<VisibilityControl
				item={item}
				updateLayer={updateLayer}
				style={styleVisibility}
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
	const { editLayer, updateLayer } = useContext(ContextSettingsMaps);

	const onPress = useCallback(() => {
		editLayer &&
			updateLayer({
				...editLayer,
				type: option.key as string,
				options: fillLayerConfigOptionsWithDefaults(option.key, editLayer.options),
			});
		// setModalDismissable( false );
	}, [editLayer, option]);

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

const EditModal: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	const { editLayer, setEditLayer, updateLayer, layers, setLayers } =
		useContext(ContextSettingsMaps);

	const [modalVisible, setModalVisible] = useState(false);

	useEffect(() => {
		setModalVisible(!!editLayer);
	}, [editLayer]);

	const handleDismissModal = useCallback(() => {
		setModalVisible(false);
		setEditLayer(null);
	}, []);

	const handleRemoveLayer = useCallback(() => {
		const layerIndex = layers.findIndex((layer) => layer.key === editLayer?.key);
		if (layerIndex !== -1) {
			const newLayers = [...layers];
			newLayers.splice(layerIndex, 1);
			setLayers(newLayers);
			handleDismissModal();
		}
	}, [
		handleDismissModal,
		layers,
		editLayer?.key,
	]);

	return !editLayer ? undefined : (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={handleDismissModal}
			header={editLayer.type ? t('map.layerEdit') : t('map.addNewLayerShort')}
		>
			{!editLayer.type && (
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

			{editLayer.type && (
				<View>
					<View style={styleModalRowType}>
						<Text style={styleModalRowTypeLabel}>{t('map.mapType')}:</Text>
						<Text>{editLayer.type}</Text>
					</View>

					<NameRowControl
						item={editLayer}
						update={updateLayer as (newItem: { name: string }) => void}
						Info={t('hint.nameId')}
					/>

					<VisibilityRowControl
						item={editLayer}
						updateLayer={updateLayer}
					/>

					{'online-raster-xyz' === editLayer.type && <LayerControlOnlineRasterXYZ />}

					{'mapsforge' === editLayer.type && <LayerControlMapsforge />}

					{'raster-MBtiles' === editLayer.type && <LayerControlRasterMBTiles />}

					{'hillshading' === editLayer.type && <LayerControlHillshading />}

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
							onPress={() => {
								setEditLayer(null);
								setModalVisible(false);
							}}
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
	newLabel,
	uiStateKey = 'mapLayersExpanded',
}: {
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
	width?: number;
	reverseDraggableItem?: boolean;
	newLabel?: string;
	uiStateKey?: string;
}) => {
	const dispatch = useAppDispatch();

	const { width: width_ } = useSafeAreaFrame();
	width = width ? width : width_;

	const { t } = useTranslation();
	const theme = useTheme();

	const { setEditLayer, layers, setLayers, saveLayers } = useContext(ContextSettingsMaps);

	const expanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));

	const renderItem = useCallback(
		(item: LayerConfig) => (
			<View key={item.key}>
				<DraggableItem
					item={item}
					width={width}
					reverse={!!reverseDraggableItem}
				/>
			</View>
		),
		[width, reverseDraggableItem]
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
			setLayers(newLayers);
		},
		[setLayers]
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

	const handleAddNewLayer = useCallback(() => setEditLayer(getNewLayer()), [setEditLayer]);

	return (
		<View>
			<EditModal />

			<List.Accordion
				title={t('map.layer', { count: 0 })}
				left={ControlIcon}
				expanded={expanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
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
