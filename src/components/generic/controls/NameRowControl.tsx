/**
 * External dependencies
 */
import { ReactNode, useEffect, useState } from 'react';
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
	const doUpdate = debounce(() => {
		update({
			...item,
			name: value,
		});
	}, 300);
	useEffect(() => {
		doUpdate();
	}, [value]);

	return (
		<InfoRowControl
			label={'Name/ID'}
			Info={Info}
		>
			<TextInput
				style={styles.input}
				underlineColor="transparent"
				dense={true}
				theme={{
					fonts: {
						bodyLarge: {
							...theme.fonts.bodySmall,
							fontFamily: 'sans-serif',
						},
					},
				}}
				onChangeText={(newVal) => setValue(newVal)}
				value={value}
			/>
		</InfoRowControl>
	);
};

const styles = StyleSheet.create({
	input: { flexGrow: 1 },
});

export default NameRowControl;
