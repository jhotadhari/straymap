/**
 * External dependencies
 */
import React, { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { TouchableHighlight, View } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Icon, Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get, isNumber, set } from 'lodash-es';
import rnUuid from 'react-native-uuid';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../types';
import ListItemModalControl from '../../../../components/generic/controls/ListItemModalControl';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import DraggableGrid from 'react-native-draggable-grid';
import InfoButton from '../../../../components/generic/InfoButton';
import { modalWidthFactor } from '../../../../constants';
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import RadioListItem from '../../../../components/generic/RadioListItem';
import { NumericRowControl } from '../../../../components/generic/controls/NumericRowControls';
import * as dashboardElementComponents from '../elements';
import MenuItem from '../../../../components/generic/MenuItem';
import InfoRowControl, { labelPadding } from '../../../../components/generic/controls/InfoRowControl';
import { DashboardItem } from '../types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectDashboardStyle, selectItems } from '../selectors';
import { setDashboardStyle, setElements } from '../dashboardSlice';
import { selectMapEventRate, selectUnitPrefs } from '../../general/selectors';
import { setMapEventRate } from '../../general/generalSlice';
import Dashboard from './DashboardOld';

const itemHeight = 50;

const elementTypeOptions: OptionBase[] = Object.values(dashboardElementComponents).map((comp) => ({
	key: comp.key,
	label: comp.label,
}));

const styleAlignOptions: OptionBase[] = [
	{
		key: 'center',
		label: 'center',
	},
	{
		key: 'left',
		label: 'left',
	},
	{
		key: 'right',
		label: 'right',
	},
	{
		key: 'around',
		label: 'around',
	},
	{
		key: 'between',
		label: 'between',
	},
	{
		key: 'evenly',
		label: 'evenly',
	},
];

const getNewElement = (): DashboardItem => ({
	key: rnUuid.v4(),
	elementType: '',
});

const DraggableItem = ({
	item,
	width,
	setEditElement,
}: {
	item: DashboardItem;
	width: number;
	setEditElement: Dispatch<SetStateAction<null | DashboardItem>>;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<View
			style={{
				width,
				height: itemHeight,
				justifyContent: 'space-between',
				alignItems: 'center',
				flexDirection: 'row',
				marginLeft: -34,
				paddingLeft: 3,
				paddingRight: 17,
			}}
			key={item.key}
		>
			<View
				style={{
					justifyContent: 'space-between',
					alignItems: 'center',
					flexDirection: 'row',
					flexGrow: 1,
					marginLeft: 5,
					marginRight: 5,
				}}
			>
				<Text>
					[
					{t(
						get(
							elementTypeOptions.find((opt) => opt.key === item.elementType),
							'label',
							''
						)
					)}
					]
				</Text>
			</View>

			<TouchableHighlight
				underlayColor={theme.colors.elevation.level3}
				onPress={() => setEditElement(item)}
				style={{ padding: 10, borderRadius: theme.roundness }}
			>
				<Icon
					source="cog"
					size={25}
				/>
			</TouchableHighlight>
		</View>
	);
};

const StyleControlFontSize = ({
	editElement,
	updateElement,
}: {
	editElement: null | DashboardItem;
	updateElement: (newElement: DashboardItem) => void;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const [menuVisible, setMenuVisible] = useState(false);

	const [numVal, setNumVal] = useState(
		isNumber(get(editElement, ['style', 'fontSize']))
			? get(editElement, ['style', 'fontSize'])
			: theme.fonts.bodyMedium.fontSize
	);

	const opts = [
		{
			key: 'default',
			label: 'default',
		},
		{
			key: 'custom',
			label: 'custom',
		},
	];

	const activeOpt =
		'default' === get(editElement, ['style', 'fontSize'])
			? opts.find((opt) => opt.key === 'default')
			: opts.find((opt) => opt.key === 'custom');

	return (
		<View>
			<InfoRowControl
				label={t('fontSize')}
				Info={t('hint.dashboard.item.fontSize')}
			>
				<Menu
					contentStyle={{
						borderColor: theme.colors.outline,
						borderWidth: 1,
					}}
					visible={menuVisible}
					onDismiss={() => setMenuVisible(false)}
					anchor={
						<ButtonHighlight
							style={{ marginTop: 3, alignItems: 'flex-start' }}
							onPress={() => setMenuVisible(true)}
						>
							<Text>{t(get(activeOpt, 'label', ''))}</Text>
						</ButtonHighlight>
					}
				>
					{[...opts].map((opt) => (
						<MenuItem
							key={opt.key}
							onPress={() => {
								setMenuVisible(false);
								const newEditElement = { ...editElement };
								set(
									newEditElement,
									['style', 'fontSize'],
									'default' === opt.key ? opt.key : numVal
								);
								updateElement(newEditElement as DashboardItem);
							}}
							title={t(opt.label)}
							active={activeOpt ? opt.key === activeOpt.key : false}
						/>
					))}
				</Menu>
			</InfoRowControl>

			{activeOpt && 'custom' === activeOpt.key && (
				<NumericRowControl
					optKey={'fontSize'}
					options={get(editElement, 'style', {})}
					setOptions={(newStyle) => {
						const newEditElement = {
							...editElement,
							style: newStyle,
						};
						updateElement(newEditElement as DashboardItem);
						setNumVal(newStyle['fontSize']);
					}}
					validate={(val) => val > 0}
				/>
			)}
		</View>
	);
};

const StyleControl = ({
	editElement,
	updateElement,
}: {
	editElement: null | DashboardItem;
	updateElement: (newElement: DashboardItem) => void;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const presetStyle = () => {
		if (!editElement?.style) {
			const newEditElement = {
				...editElement,
				style: {
					fontSize: 'default',
					minWidth: get(
						dashboardElementComponents,
						[editElement?.elementType || '', 'defaultMinWidth'],
						75
					),
				},
			};
			updateElement(newEditElement as DashboardItem);
		}
	};
	useEffect(() => presetStyle(), []);
	useEffect(() => presetStyle(), [editElement?.style]);

	return editElement?.style ? (
		<View>
			<StyleControlFontSize
				editElement={editElement}
				updateElement={updateElement}
			/>
			<NumericRowControl
				label={t('minWidth')}
				optKey={'minWidth'}
				options={get(editElement, 'style', {})}
				setOptions={(newStyle) => {
					const newEditElement = {
						...editElement,
						style: newStyle,
					};
					updateElement(newEditElement as DashboardItem);
				}}
				validate={(val) => val >= 0}
				Info={t('hint.dashboard.item.minWidth')}
			/>
		</View>
	) : null;
};

const DashboardControl = () => {
	const { width } = useSafeAreaFrame();
	const theme = useTheme();
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const dashboardElements = useAppSelector(state => selectItems( state, { position: 'bottom'} ));
	const dashboardStyle = useAppSelector(selectDashboardStyle);
	const mapEventRate = useAppSelector(selectMapEventRate);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const [menuVisible, setMenuVisible] = useState(false);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	const [dashboardElementsEdit, setDashboardElementsEdit] =
		useState<DashboardItem[]>(dashboardElements);
	const dashboardElementsEditRef = useRef(dashboardElementsEdit);
	useEffect(() => {
		dashboardElementsEditRef.current = dashboardElementsEdit;
	}, [dashboardElementsEdit]);
	const saveElements = () => {
		dispatch(setElements(dashboardElementsEditRef.current));
	};
	useEffect(() => saveElements, []); // Save on unmount.

	const [editElement, setEditElement] = useState<null | DashboardItem>(null);

	const [modalVisible, setModalVisible] = useState(false);

	useEffect(() => {
		setModalVisible(!!editElement);
	}, [editElement]);

	const updateElement = (newElement: DashboardItem) => {
		if (editElement && editElement.key === newElement.key) {
			setEditElement((editElement: null | DashboardItem) =>
				editElement ? { ...editElement, ...newElement } : null
			);
		}
		const itemIndex = dashboardElementsEdit.findIndex((item) => item.key === newElement.key);
		if (-1 !== itemIndex) {
			const newElements = [...dashboardElementsEdit];
			newElements[itemIndex] = newElement;
			setDashboardElementsEdit(newElements);
		} else {
			const newElements = [...dashboardElementsEdit, newElement];
			setDashboardElementsEdit(newElements);
		}
	};

	const renderItem = (item: DashboardItem) => (
		<View key={item.key}>
			<DraggableItem
				item={item}
				setEditElement={setEditElement}
				width={width * modalWidthFactor}
			/>
		</View>
	);

	const ControlComponent =
		editElement && editElement?.elementType && '' !== editElement.elementType
			? get(dashboardElementComponents, [editElement.elementType as string, 'ControlComponent'])
			: null;

	return (
		<View>
			{editElement && (
				<ModalWrapper
					visible={modalVisible}
					scrollEnabled={scrollEnabled}
					backgroundBlur={false}
					onDismiss={() => {
						setModalVisible(false);
						setEditElement(null);
					}}
					header={
						editElement.elementType
							? sprintf(
									t('edit"X"'),
									t(
										get(
											elementTypeOptions.find(
												(opt) => opt.key === editElement.elementType
											),
											'label',
											''
										)
									)
								)
							: t('dashboardElementNew')
					}
				>
					{!editElement.elementType && (
						<View>
							<Text style={{ marginBottom: 18 }}>
								{sprintf(t('selectXType'), t('dashboardElement'))}
							</Text>

							{[...elementTypeOptions].map((opt: OptionBase, index: number) => {
								const onPress = () => {
									updateElement({
										...editElement,
										elementType: opt.key,
									});
									if ('lineBreak' === opt.key) {
										setEditElement(null);
										setModalVisible(false);
									}
								};
								return (
									<RadioListItem
										key={opt.key}
										opt={opt}
										onPress={onPress}
										labelExtractor={(a) => a.key}
										descExtractor={(a) => a.label}
									/>
								);
							})}
						</View>
					)}

					{editElement.elementType && (
						<View>
							{ControlComponent && (
								<ControlComponent
									editElement={editElement}
									updateElement={updateElement}
									unitPrefs={unitPrefs}
								/>
							)}

							{get(dashboardElementComponents, [
								editElement.elementType as string,
								'hasStyleControl',
							]) && (
								<StyleControl
									editElement={editElement}
									updateElement={updateElement}
								/>
							)}
						</View>
					)}

					{editElement.elementType && (
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
									setEditElement(null);
									setModalVisible(false);
								}}
								mode="contained"
								buttonColor={get(theme.colors, 'successContainer')}
								textColor={get(theme.colors, 'onSuccessContainer')}
							>
								<Text>{t('ok')}</Text>
							</ButtonHighlight>

							<ButtonHighlight
								onPress={() => {
									const layerIndex = dashboardElementsEdit.findIndex(
										(element) => element.key === editElement.key
									);
									if (layerIndex !== -1) {
										const newElements = [...dashboardElementsEdit];
										newElements.splice(layerIndex, 1);
										setDashboardElementsEdit(newElements);
										setEditElement(null);
										setModalVisible(false);
									}
								}}
								mode="contained"
								buttonColor={theme.colors.errorContainer}
								textColor={theme.colors.onErrorContainer}
							>
								<Text>{sprintf(t('removeX'), t('element', { count: 1 }))}</Text>
							</ButtonHighlight>
						</View>
					)}
				</ModalWrapper>
			)}

			<ListItemModalControl
				scrollEnabled={scrollEnabled}
				anchorLabel={t('dashboard')}
				anchorIcon={({ color, style }) => (
					<MaterialIcons
						style={style}
						name="dashboard"
						size={25}
						color={color}
					/>
				)}
				header={t('dashboard')}
				hasHeaderBackPress={true}
				belowModal={
					<View
						style={{
							width,
							marginTop: 20,
							borderColor: theme.colors.outline,
							borderWidth: 1,
							borderRadius: theme.roundness,
							position: 'absolute',
							bottom: 0,
						}}
					>
						<Dashboard
							outerWidth={width}
						/>
					</View>
				}
			>
				<View>
					<Text style={{ ...labelPadding }}>{t('dashboardElement', { count: 0 })}</Text>
					<View
						style={{
							height: itemHeight * dashboardElementsEdit.length + 8,
							width: width * modalWidthFactor,
						}}
					>
						<DraggableGrid
							itemHeight={itemHeight}
							numColumns={1}
							renderItem={renderItem}
							data={dashboardElementsEdit.filter((el) => !!el.key)}
							onDragStart={() => setScrollEnabled(false)}
							onDragRelease={(newElements: DashboardItem[]) => {
								setScrollEnabled(true);
								setDashboardElementsEdit(newElements);
							}}
						/>
					</View>
				</View>

				{!dashboardElementsEdit.length && (
					<Text style={{ marginLeft: 18, marginBottom: 35 }}>
						{t('dashboardElementsNone')}
					</Text>
				)}

				<View
					style={{
						justifyContent: 'space-between',
						flexDirection: 'row',
						marginBottom: 25,
						// width: width * modalWidthFactor,
					}}
				>
					<InfoButton
						label={t('dashboardElement', { count: 0 })}
						headerPlural={true}
						backgroundBlur={false}
						Info={t('hint.dashboard.elements')}
						buttonProps={{
							style: { marginTop: 0, marginBottom: 0 },
							icon: 'information-variant',
							mode: 'outlined',
							iconColor: theme.colors.primary,
						}}
					/>

					<ButtonHighlight
						// style={ { marginRight: 20 } }
						icon={({ color }) => (
							<MaterialIcons
								name="dashboard-customize"
								size={25}
								color={color}
							/>
						)}
						mode="outlined"
						onPress={() => setEditElement(getNewElement())}
					>
						{t('dashboardElementNew')}
					</ButtonHighlight>
				</View>

				<NumericRowControl
					label={t('fontSize')}
					optKey={'fontSize'}
					options={dashboardStyle}
					setOptions={({ fontSize }) => {
						dispatch(
							setDashboardStyle({
								...dashboardStyle,
								fontSize,
							})
						);
					}}
					validate={(val) => val >= 0}
					Info={t('hint.dashboard.fontSize')}
				/>

				<InfoRowControl
					label={t('alignment')}
					Info={t('hint.dashboard.alignment')}
					style={{ marginTop: 0, marginBottom: 0 }}
				>
					<Menu
						contentStyle={{
							borderColor: theme.colors.outline,
							borderWidth: 1,
						}}
						visible={menuVisible}
						onDismiss={() => setMenuVisible(false)}
						anchor={
							<ButtonHighlight
								style={{ marginTop: 3, alignItems: 'flex-start' }}
								onPress={() => setMenuVisible(true)}
							>
								<Text>
									{t(
										get(
											styleAlignOptions.find(
												(opt) => opt.key === dashboardStyle.align
											),
											'label',
											''
										)
									)}
								</Text>
							</ButtonHighlight>
						}
					>
						{styleAlignOptions &&
							[...styleAlignOptions].map((opt) => (
								<MenuItem
									key={opt.key}
									onPress={() => {
										setMenuVisible(false);
										dispatch(
											setDashboardStyle({
												...dashboardStyle,
												align: opt.key,
											})
										);
									}}
									title={t(opt.label)}
									active={opt.key === dashboardStyle.align}
								/>
							))}
					</Menu>
				</InfoRowControl>

				<NumericRowControl
					label={t('updateRate')}
					optKey={'mapEventRate'}
					options={{ mapEventRate }}
					setOptions={({ mapEventRate }) => {
						dispatch(setMapEventRate(mapEventRate));
					}}
					validate={(val) => val >= 0}
					Info={t('hint.dashboard.updateRate')}
				/>
			</ListItemModalControl>
		</View>
	);
};

export default DashboardControl;
