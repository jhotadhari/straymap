/**
 * External dependencies
 */
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme, TextInput } from 'react-native-paper';
import { debounce } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoRowControl from './InfoRowControl';

const NameRowControl = ({
	item,
	update,
	Info,
}: {
	item: { name: string };
	update: (newItem: { name: string }) => void;
	Info?: ReactNode | string;
}) => {
	const theme = useTheme();
	const [value, setValue] = useState(item.name);

	// Keep latest item/update accessible without recreating the debounced fn.
	const itemRef = useRef(item);
	itemRef.current = item;
	const updateRef = useRef(update);
	updateRef.current = update;

	const doUpdate = useMemo(
		() =>
			debounce((newValue: string) => {
				updateRef.current({
					...itemRef.current,
					name: newValue,
				});
			}, 300),
		[]
	);
	useEffect(() => {
		doUpdate(value);
	}, [value, doUpdate]);

	const overwriteTheme = useMemo(
		() => ({
			fonts: {
				bodyLarge: {
					...theme.fonts.bodySmall,
					fontFamily: 'sans-serif',
				},
			},
		}),
		[theme]
	);

	return (
		<InfoRowControl
			label={'Name/ID'}
			Info={Info}
		>
			<TextInput
				style={styles.input}
				underlineColor="transparent"
				dense={true}
				theme={overwriteTheme}
				onChangeText={setValue}
				value={value}
			/>
		</InfoRowControl>
	);
};

const styles = StyleSheet.create({
	input: { flexGrow: 1 },
});

export default NameRowControl;
