/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	SetStateAction,
	memo,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import rnUuid from 'react-native-uuid';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { useAppDispatch } from '../../../../store/hooks';
import { addItem, setEditItemKey } from '../../slice';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import RadioListItem from '../../../../components/generic/wrapper/RadioListItem';
import { OptionBase } from '../../../../types';
import { featureRegistry } from '../../../FeatureRegistry';
import { ControlContext } from '../../ControlContext';
import { DashboardWidget } from '../../types';
import { getCategoryLabelKey, groupWidgetsByCategory } from '../../utils/widgetCategories';

const labelExtractor = (a: OptionBase) => a.label;
const descExtractor = (a: OptionBase & { desc?: string }) => a.desc ?? null;

interface DashboardWidgetOption extends OptionBase {
	desc?: string;
}

const SelectType: FC<{
	option: DashboardWidgetOption;
	onPress: (elementType: string) => void;
}> = memo(({ option, onPress }) => {
	const handlePress = useCallback(() => onPress(option.key), [onPress, option.key]);

	return (
		<View style={styles.optionRow}>
			<RadioListItem
				opt={option}
				onPress={handlePress}
				labelExtractor={labelExtractor}
				translateLabel={true}
				descExtractor={descExtractor}
				translateDesc={true}
			/>
		</View>
	);
});

const Modal: FC<{
	modalVisible: boolean;
	setModalVisible: Dispatch<SetStateAction<boolean>>;
}> = memo(({ modalVisible, setModalVisible }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const groups = useMemo(() => {
		const widgets = Object.values(featureRegistry.getDashboardWidgets()) as DashboardWidget[];
		return groupWidgetsByCategory(widgets);
	}, []);

	const { position } = useContext(ControlContext);

	const dispatch = useAppDispatch();

	const onPress = useCallback(
		(elementType: string) => {
			setModalVisible(false);
			const newItem: {
				key: string;
				elementType: string;
				showLabel?: boolean;
				showIcon?: boolean;
			} = {
				key: rnUuid.v4(),
				elementType,
				...(elementType === 'spacer' && {
					showLabel: false,
					showIcon: false,
				}),
			};
			position &&
				dispatch(
					addItem({
						position,
						item: newItem,
					})
				);
			dispatch(setEditItemKey(newItem.key));
		},
		[
			position,
			dispatch,
			setModalVisible,
		]
	);

	const handleDismiss = useCallback(() => {
		setModalVisible(false);
	}, [setModalVisible]);

	return (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={handleDismiss}
			headerLabel={t('dashboard.dashboardItemNew')}
		>
			{groups.map(({ category, widgets }) => (
				<View
					key={category}
					style={styles.categoryBlock}
				>
					<Text
						style={[
							styles.categoryHeading,
							{ color: theme.colors.primary },
						]}
					>
						{t(getCategoryLabelKey(category), { defaultValue: category })}
					</Text>
					{widgets.map((widget) => (
						<SelectType
							key={widget.key}
							option={{
								key: widget.key,
								label: widget.label,
								desc: widget.desc,
							}}
							onPress={onPress}
						/>
					))}
				</View>
			))}
		</ModalWrapper>
	);
});

const renderNewItemIcon = ({ color }: { color: string }) => (
	<MaterialIcons
		name="dashboard-customize"
		size={25}
		color={color}
	/>
);

const NewItemControl: FC<{}> = memo(() => {
	const { t } = useTranslation();

	const buttonProps = useButtonProps({});

	const [modalVisible, setModalVisible] = useState(false);

	const handleOpenModal = useCallback(() => setModalVisible(true), [setModalVisible]);

	return (
		<View>
			{modalVisible && (
				<Modal
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
				/>
			)}

			<ButtonHighlight
				{...buttonProps}
				icon={renderNewItemIcon}
				onPress={handleOpenModal}
			>
				{t('dashboard.dashboardItemNew')}
			</ButtonHighlight>
		</View>
	);
});

const styles = StyleSheet.create({
	optionRow: { marginTop: 10 },
	categoryBlock: { marginBottom: 8 },
	categoryHeading: {
		fontSize: 16,
		fontWeight: '600',
		marginTop: 14,
		marginBottom: 2,
	},
});

export default NewItemControl;
