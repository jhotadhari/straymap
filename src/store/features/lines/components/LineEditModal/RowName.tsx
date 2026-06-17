/**
 * External dependencies
 */
import { FC, useCallback, useContext } from 'react';
import { TextInput, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectLineTemp } from '../../selectors';
import { setLineTemp } from '../../slice';
import { LinePartial } from '../../types';

const RowName: FC = () => {
	const dispatch = useAppDispatch();

	const lineTemp = useAppSelector(selectLineTemp);

	const theme = useTheme();

	const { line } = useContext(LineEditModalContext);

	const handleChangeText = useCallback(
		(newVal: string) => {
			if (lineTemp) {
				dispatch(
					setLineTemp({
						...(lineTemp as LinePartial),
						title: newVal,
					})
				);
			}
		},
		[lineTemp]
	);

	return (
		<InfoRowControl
			label={'name'} // ??? translation
			// Info={Info}
		>
			<TextInput
				// style={{ flexGrow: 1 }}
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
				onChangeText={handleChangeText}
				value={lineTemp?.title ?? line?.title ?? ''}
			/>
		</InfoRowControl>
	);
};

export default RowName;
