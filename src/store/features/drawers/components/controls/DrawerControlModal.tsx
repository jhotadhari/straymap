/**
 * External dependencies
 */
import { View } from 'react-native';
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { Props as ButtonProps } from 'react-native-paper/lib/typescript/components/Button/Button';
import { useTranslation } from 'react-i18next';
import { Divider, Icon, Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import * as drawerItems from '../../items';
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { DrawerItem } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectControlHandleSide, selectItemKeys } from '../../selectors';
import { addItemKey, removeItemKey, setControlHandleSide } from '../../slice';

const Item: FC<{
	drawerItem: DrawerItem;
}> = ({ drawerItem }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const itemKeysLeft = useAppSelector((state) => selectItemKeys(state, { side: 'left' }));

	const itemKeysRight = useAppSelector((state) => selectItemKeys(state, { side: 'right' }));

	const controlHandleSide = useAppSelector(selectControlHandleSide);

	const { IconComponent, iconSource } = useMemo(() => {
		const IconComponent = get(drawerItem, 'IconComponent');
		const iconSource = IconComponent ? undefined : get(drawerItem, 'iconSource');
		return {
			IconComponent,
			iconSource,
		};
	}, [drawerItem]);

	let isOnSide: false | string = false;
	if (
		(!drawerItem.key && 'left' === controlHandleSide) ||
		itemKeysLeft.includes(drawerItem.key ?? '')
	) {
		isOnSide = 'left';
	} else if (
		(!drawerItem.key && 'right' === controlHandleSide) ||
		itemKeysRight.includes(drawerItem.key ?? '')
	) {
		isOnSide = 'right';
	}

	const handlePress = useMemo(() => {
		const handlePress = (side: string) => {
			const sideOther = 'left' === side ? 'right' : 'left';
			if (side === isOnSide) {
				drawerItem.key &&
					dispatch(
						removeItemKey({
							side,
							itemKey: drawerItem.key,
						})
					);
			} else {
				if (drawerItem.key) {
					dispatch(
						addItemKey({
							side,
							itemKey: drawerItem.key,
						})
					);
				} else {
					dispatch(setControlHandleSide(side));
				}
			}
			if (sideOther === isOnSide) {
				drawerItem.key &&
					dispatch(
						removeItemKey({
							side: sideOther,
							itemKey: drawerItem.key,
						})
					);
			}
		};
		return {
			left: () => handlePress('left'),
			right: () => handlePress('right'),
		};
	}, [isOnSide, drawerItem]);

	const getBtnProps = useCallback(
		(side: string): Partial<ButtonProps> => {
			const disabled = !drawerItem.key && side === isOnSide;
			return {
				buttonColor:
					side === isOnSide
						? theme.colors.errorContainer
						: get(theme.colors, 'successContainer'),
				textColor:
					side === isOnSide
						? theme.colors.onErrorContainer
						: get(theme.colors, 'onSuccessContainer'),
				disabled,
				style: disabled ? { opacity: 0.5 } : undefined,
			};
		},
		[
			isOnSide,
			theme,
			drawerItem,
		]
	);

	return (
		<View
			style={{
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignItems: 'center',
				padding: 5,
				margin: 5,
			}}
		>
			<ButtonHighlight
				onPress={handlePress.left}
				{...getBtnProps('left')}
			>
				<Icon
					source={'left' === isOnSide ? 'minus' : 'plus'}
					size={20}
				/>
			</ButtonHighlight>

			<View
				style={{
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				{IconComponent && <IconComponent color={theme.colors.onBackground} />}
				{iconSource && (
					<Icon
						source={iconSource}
						size={25}
						color={theme.colors.onBackground}
					/>
				)}
				{drawerItem?.label && (
					<Text style={{ marginTop: 4 }}>{t(drawerItem?.label ?? '')}</Text>
				)}
			</View>

			<ButtonHighlight
				onPress={handlePress.right}
				{...getBtnProps('right')}
			>
				<Icon
					source={'right' === isOnSide ? 'minus' : 'plus'}
					size={20}
				/>
			</ButtonHighlight>
		</View>
	);
};

const DrawerControlModal: FC<{
	modalVisible: boolean;
	setModalVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ modalVisible, setModalVisible }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={() => setModalVisible(false)}
			header={t('drawers.drawer', { count: 0 })}
		>
			{Object.values(drawerItems).map((drawerItem: DrawerItem) => (
				<Item
					key={drawerItem.key}
					drawerItem={drawerItem}
				/>
			))}

			<Divider
				bold={true}
				style={{ marginTop: 10, marginBottom: 10 }}
			/>

			<Item
				drawerItem={{
					iconSource: 'cog',
				}}
			/>

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

export default DrawerControlModal;
