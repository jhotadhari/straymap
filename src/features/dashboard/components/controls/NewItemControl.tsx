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

const labelExtractor = (a: OptionBase) => a.label;

const SelectType: FC<{
	option: OptionBase;
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
				// descExtractor={(a) => a.label}
			/>
		</View>
	);
});

const Modal: FC<{
	modalVisible: boolean;
	setModalVisible: Dispatch<SetStateAction<boolean>>;
}> = memo(({ modalVisible, setModalVisible }) => {
	const { t } = useTranslation();

	const options: OptionBase[] = useMemo(() => {
		const elementsMap = featureRegistry.getDashboardWidgets();
		return Object.values(elementsMap).map((element: any) => ({
			key: element.key,
			label: element.label,
		}));
	}, []);

	const { position } = useContext(ControlContext);

	// const [position, setPosition] = useState('bottom');

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
			{options.map((option) => (
				<SelectType
					key={option.key}
					option={option}
					onPress={onPress}
				/>
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
});

export default NewItemControl;
