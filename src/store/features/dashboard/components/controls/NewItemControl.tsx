/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import rnUuid from 'react-native-uuid';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SegmentedButtons, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { addItem, setEditItemKey } from '../../dashboardSlice';
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import RadioListItem from '../../../../../components/generic/RadioListItem';
import { OptionBase } from '../../../../../types';
import { selectElementsSettings } from '../../selectors';

const SelectType: FC<{
	option: OptionBase;
	onPress: (elementType: string) => void;
}> = ({ option, onPress }) => {
	return (
		<View style={{ marginTop: 10 }}>
			<RadioListItem
				opt={option}
				onPress={() => onPress(option.key)}
				labelExtractor={(a) => a.label}
				// descExtractor={(a) => a.label}
			/>
		</View>
	);
};

const Modal: FC<{
	modalVisible: boolean;
	setModalVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ modalVisible, setModalVisible }) => {
	const { t } = useTranslation();

	const theme = useTheme();

	const elementSettings = useAppSelector(selectElementsSettings);

	const options: OptionBase[] = useMemo(
		() =>
			Object.values(elementSettings).map((element: any) => ({
				key: element.key,
				label: element.label,
			})),
		[elementSettings]
	);

	const [position, setPosition] = useState('bottom');

	const dispatch = useAppDispatch();

	const onPress = useCallback(
		(elementType: string) => {
			setModalVisible(false);
			const newItem = {
				key: rnUuid.v4(),
				elementType,
			};
			dispatch(
				addItem({
					position,
					item: newItem,
				})
			);
			dispatch(setEditItemKey(newItem.key));
		},
		[position]
	);

	return (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={() => {
				setModalVisible(false);
				// setEditElemlent(null);
			}}
			header={t('dashboardElementNew')}
		>
			<SegmentedButtons
				style={{ marginBottom: 20 }}
				value={position}
				onValueChange={setPosition}
				theme={{
					colors: {
						secondaryContainer: theme.colors.primaryContainer,
						textColor: theme.colors.onPrimaryContainer,
					},
				}}
				buttons={[
					{
						value: 'bottom',
						label: t('bottom'),
						icon: 'arrow-down',
					},
					{
						value: 'top',
						label: t('top'),
						icon: 'arrow-up',
					},
				]}
			/>

			{options.map((option) => (
				<SelectType
					key={option.key}
					option={option}
					onPress={onPress}
				/>
			))}
		</ModalWrapper>
	);
};

const NewItemControl: FC<{}> = () => {
	const { t } = useTranslation();

	const [modalVisible, setModalVisible] = useState(false);

	return (
		<View>
			{modalVisible && (
				<Modal
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
				/>
			)}

			<ButtonHighlight
				icon={({ color }) => (
					<MaterialIcons
						name="dashboard-customize"
						size={25}
						color={color}
					/>
				)}
				mode="outlined"
				onPress={() => setModalVisible(true)}
			>
				{t('dashboardElementNew')}
			</ButtonHighlight>
		</View>
	);
};

export default NewItemControl;
