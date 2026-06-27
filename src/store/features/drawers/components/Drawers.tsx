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
	const { drawerControlsRef } = useContext(AppContext);

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
				getIsFullyCollapsed: drawerStateLeft.getIsFullyCollapsed,
				expand: drawerStateLeft.expand,
			},
			right: {
				getIsFullyCollapsed: drawerStateRight.getIsFullyCollapsed,
				expand: drawerStateRight.expand,
			},
		};
	}, [
		drawerStateLeft,
		drawerStateRight,
		drawerControlsRef,
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
