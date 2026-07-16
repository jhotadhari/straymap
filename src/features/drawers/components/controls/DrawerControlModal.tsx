/**
 * External dependencies
 */
import { StyleSheet, View } from 'react-native';
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { Props as ButtonProps } from 'react-native-paper/lib/typescript/components/Button/Button';
import { useTranslation } from 'react-i18next';
import { Divider, Icon, Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../../../FeatureRegistry';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { DrawerPanel } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectControlHandleSide, selectItemKeys, selectShowSettingsHandle } from '../../selectors';
import {
	addItemKey,
	removeItemKey,
	setControlHandleSide,
	setShowSettingsHandle,
} from '../../slice';
import { sharedStyles } from '../../../../sharedStyles';

const settingsDrawerItem: DrawerPanel = {
	iconSource: 'cog',
	label: 'drawers.settingsHandle',
};

const Item: FC<{
	drawerItem: DrawerPanel;
}> = ({ drawerItem }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const itemKeysLeft = useAppSelector((state) => selectItemKeys(state, { side: 'left' }));

	const itemKeysRight = useAppSelector((state) => selectItemKeys(state, { side: 'right' }));

	const controlHandleSide = useAppSelector(selectControlHandleSide);

	const showSettingsHandle = useAppSelector(selectShowSettingsHandle);

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
		(!drawerItem.key && showSettingsHandle && 'left' === controlHandleSide) ||
		itemKeysLeft.includes(drawerItem.key ?? '')
	) {
		isOnSide = 'left';
	} else if (
		(!drawerItem.key && showSettingsHandle && 'right' === controlHandleSide) ||
		itemKeysRight.includes(drawerItem.key ?? '')
	) {
		isOnSide = 'right';
	}

	const handlePress = useMemo(() => {
		const handlePress = (side: string) => {
			const sideOther = 'left' === side ? 'right' : 'left';
			if (side === isOnSide) {
				if (drawerItem.key) {
					dispatch(
						removeItemKey({
							side,
							itemKey: drawerItem.key,
						})
					);
				} else {
					dispatch(setShowSettingsHandle(false));
				}
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
					dispatch(setShowSettingsHandle(true));
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
	}, [
		dispatch,
		isOnSide,
		drawerItem,
	]);

	const getBtnProps = useCallback(
		(side: string): Partial<ButtonProps> => {
			return {
				buttonColor:
					side === isOnSide
						? theme.colors.errorContainer
						: get(theme.colors, 'successContainer'),
				textColor:
					side === isOnSide
						? theme.colors.onErrorContainer
						: get(theme.colors, 'onSuccessContainer'),
			};
		},
		[
			isOnSide,
			theme,
		]
	);

	return (
		<View style={styles.itemRow}>
			<ButtonHighlight
				onPress={handlePress.left}
				{...getBtnProps('left')}
			>
				<Icon
					source={'left' === isOnSide ? 'minus' : 'plus'}
					size={20}
				/>
			</ButtonHighlight>

			<View style={styles.iconWrapper}>
				{IconComponent && <IconComponent color={theme.colors.onBackground} />}
				{iconSource && (
					<Icon
						source={iconSource}
						size={25}
						color={theme.colors.onBackground}
					/>
				)}
				{drawerItem?.label && (
					<Text style={styles.label}>{t(drawerItem?.label ?? '')}</Text>
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
	const closeModal = useCallback(() => setModalVisible(false), [setModalVisible]);

	const allDrawerItems = useMemo(() => featureRegistry.getDrawerPanels(), []);

	return (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={closeModal}
			header={t('drawers.drawer', { count: 0 })}
		>
			{(Object.values(allDrawerItems) as DrawerPanel[]).map((drawerItem) => (
				<Item
					key={drawerItem.key}
					drawerItem={drawerItem}
				/>
			))}

			<Divider
				bold={true}
				style={styles.divider}
			/>

			<Item drawerItem={settingsDrawerItem} />
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	itemRow: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 5,
		margin: 5,
	},
	iconWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	label: { marginTop: 4 },
	disabled: sharedStyles.disabled,
	divider: { marginTop: 10, marginBottom: 10 },
	okButton: { marginTop: 30 },
});

export default DrawerControlModal;
