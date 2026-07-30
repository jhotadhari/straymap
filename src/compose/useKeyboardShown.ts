/**
 * External dependencies
 */
import { useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';

const useKeyboardShown = () => {
	const [keyboardShown, setKeyboardShown] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [keyboardScreenY, setKeyboardScreenY] = useState(0);

	useEffect(() => {
		const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
			setKeyboardShown(true);
			setKeyboardHeight(e.endCoordinates.height);
			setKeyboardScreenY(e.endCoordinates.screenY);
		});
		const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
			setKeyboardShown(false);
			setKeyboardHeight(0);
			setKeyboardScreenY(0);
		});
		return () => {
			showSubscription.remove();
			hideSubscription.remove();
		};
	}, []);

	return useMemo(() => ({
		keyboardShown,
		keyboardHeight,
		keyboardScreenY,
	}), [keyboardShown, keyboardHeight, keyboardScreenY]);
};

export default useKeyboardShown;
