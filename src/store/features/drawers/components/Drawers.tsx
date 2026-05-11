/**
 * External dependencies
 */
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import * as drawerItems from '../items';
import Drawer from './Drawer';
import useDrawerState from '../hooks/useDrawerState';
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { DrawerItem } from '../types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectItemKeys } from '../selectors';
import { addItemKey } from '../drawersSlice';

const AddItemModal: FC<{
	modalVisible: boolean;
	setModalVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ modalVisible, setModalVisible }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	// drawerItems as { [itemKey: string]: DrawerItem }

	const itemKeysLeft = useAppSelector((state) => selectItemKeys(state, { side: 'left' }));
	const itemKeysRight = useAppSelector((state) => selectItemKeys(state, { side: 'right' }));

	console.log('debug drawerItems', drawerItems); // debug

	return (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={() => setModalVisible(false)}
			onHeaderBackPress={() => setModalVisible(false)}
			header={t('blaa')}
		>
			{/* <Text>{t('bla bla')}</Text> */}

			{Object.values(drawerItems).map((drawerItem: DrawerItem) => {
				const disabled = !!(
					drawerItem.key &&
					(itemKeysLeft.includes(drawerItem.key) ||
						itemKeysRight.includes(drawerItem.key))
				);

				return (
					drawerItem.key && (
						<View
							key={drawerItem.key}
							style={{
								display: 'flex',
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: 5,
								margin: 5,
								// backgroundColor: '#f00',
							}}
						>
							<ButtonHighlight
								onPress={() => {
									!disabled &&
										drawerItem.key &&
										dispatch(
											addItemKey({
												side: 'left',
												itemKey: drawerItem.key,
											})
										);
								}}
								disabled={disabled}
								mode="outlined"
							>
								<Text>{'<'}</Text>
							</ButtonHighlight>
							<Text style={disabled ? { opacity: 0.5 } : undefined}>
								{t(drawerItem?.label ?? '')}
							</Text>
							<ButtonHighlight
								onPress={() => {
									!disabled &&
										drawerItem.key &&
										dispatch(
											addItemKey({
												side: 'right',
												itemKey: drawerItem.key,
											})
										);
								}}
								disabled={disabled}
								mode="outlined"
							>
								<Text>{'>'}</Text>
							</ButtonHighlight>
						</View>
					)
				);
			})}

			<ButtonHighlight
				style={{ marginTop: 30 }}
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
	);
};

const Drawers = ({
	drawerWidth = 300,
	outerWidth,
	height,
	hidden,
}: {
	drawerWidth?: number;
	outerWidth: number;
	height: number;
	hidden?: boolean;
}) => {
	const translationXLeft = useSharedValue(-drawerWidth);

	const translationXRight = useSharedValue(drawerWidth);

	const drawerStateLeft = useDrawerState({
		side: 'left',
		drawerWidth,
		outerWidth,
		translationX: translationXLeft,
		translationXOther: translationXRight,
	});

	const drawerStateRight = useDrawerState({
		side: 'right',
		drawerWidth,
		outerWidth,
		translationX: translationXRight,
		translationXOther: translationXLeft,
	});

	const [modalVisible, setModalVisible] = useState(false);

	const itemKeysLeft = useAppSelector((state) => selectItemKeys(state, { side: 'left' }));
	const itemKeysRight = useAppSelector((state) => selectItemKeys(state, { side: 'right' }));

	const allItemsEnabled = useMemo(
		() =>
			0 === Object.keys(drawerItems).filter(
				(key) => ! itemKeysLeft.includes(key) && ! itemKeysRight.includes(key)
			).length,
		[itemKeysLeft, itemKeysRight]
	);

	useEffect(() => {
		if (allItemsEnabled) {
			setModalVisible(false);
		}
	}, [allItemsEnabled]);

	return (
		<View style={{ position: 'absolute' }}>
			{!hidden && (
				<View style={{ position: 'absolute' }}>
					<Drawer
						height={height}
						setModalVisible={setModalVisible}
						{...drawerStateLeft}
					/>

					<Drawer
						height={height}
						setModalVisible={setModalVisible}
						showControlHandle={!allItemsEnabled}
						{...drawerStateRight}
					/>
				</View>
			)}

			{modalVisible && (
				<AddItemModal
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
				/>
			)}
		</View>
	);
};

export default Drawers;
