/**
 * External dependencies
 */
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useState } from 'react';

/**
 * Internal dependencies
 */
import Drawer from './Drawer';
import useDrawerState from '../hooks/useDrawerState';
import DrawerControlModal from './controls/DrawerControlModal';

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

export default Drawers;
