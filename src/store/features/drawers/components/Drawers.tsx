/**
 * External dependencies
 */
import { BackHandler, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useCallback, useContext, useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import Drawer from './Drawer';
import useDrawerState from '../hooks/useDrawerState';
import DrawerControlModal from './controls/DrawerControlModal';
import { AppContext } from '../../../../Context';
import { DRAWER_WIDTH } from '../constants';

const Drawers = ({
	height,
	hidden,
}: {
	height: number;
	hidden?: boolean;
}) => {
	const { drawerControlsRef } = useContext(AppContext);

	const translationXLeft = useSharedValue(-DRAWER_WIDTH);

	const translationXRight = useSharedValue(DRAWER_WIDTH);

	const drawerStateLeft = useDrawerState({
		side: 'left',
		translationX: translationXLeft,
		translationXOther: translationXRight,
	});

	const drawerStateRight = useDrawerState({
		side: 'right',
		translationX: translationXRight,
		translationXOther: translationXLeft,
	});

	const backAction = useCallback(() => {
		let bubble = true;
		if (!drawerStateLeft.getIsFullyCollapsed()) {
			drawerStateLeft.expand(false);
			bubble = false;
		}
		if (!drawerStateRight.getIsFullyCollapsed()) {
			drawerStateRight.expand(false);
			bubble = false;
		}
		return !bubble;
	}, [
		drawerStateLeft,
		drawerStateRight,
	]);

	useEffect(() => {
		drawerControlsRef.current = {
			left: {
				translationX: translationXLeft,
				getIsFullyCollapsed: drawerStateLeft.getIsFullyCollapsed,
				expand: drawerStateLeft.expand,
			},
			right: {
				translationX: translationXRight,
				getIsFullyCollapsed: drawerStateRight.getIsFullyCollapsed,
				expand: drawerStateRight.expand,
			},
		};
	}, [
		drawerStateLeft,
		drawerStateRight,
		drawerControlsRef,
		translationXLeft,
		translationXRight,
	]);

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
		return () => backHandler.remove();
	}, [backAction]);

	const [modalVisible, setModalVisible] = useState(false);

	return (
		<View style={styles.absolute}>
			{!hidden && (
				<View style={styles.absolute}>
					<Drawer
						height={height}
						setModalVisible={setModalVisible}
						{...drawerStateLeft}
					/>

					<Drawer
						height={height}
						setModalVisible={setModalVisible}
						{...drawerStateRight}
					/>
				</View>
			)}

			{modalVisible && (
				<DrawerControlModal
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	absolute: { position: 'absolute' },
});

export default Drawers;
