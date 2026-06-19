/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Icon, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectDbPath } from '../selectors';
import ListItemModalControl from '../../../../components/generic/controls/ListItemModalControl';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import { setDbPath } from '../slice';

const RowName: FC = () => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const dbPathSetting = useAppSelector(selectDbPath);

	const [dbPathTemp, setDbPathTemp] = useState(dbPathSetting);

	useEffect(() => {
		setDbPathTemp(dbPathSetting);
	}, [dbPathSetting]);

	const dbPathTempRef = useRef(dbPathTemp);

	useEffect(() => {
		dbPathTempRef.current = dbPathTemp;
	}, [dbPathTemp]);

	useEffect(
		() => () => {
			dbPathTempRef?.current && dispatch(setDbPath(dbPathTempRef?.current));
		},
		[]
	);

	const handleChangeText = useCallback((newVal: string) => {
		setDbPathTemp(newVal);
	}, []);

	return (
		<InfoRowControl
			label={'path'} // ??? translation
			// Info={Info}
		>
			<TextInput
				style={{ maxWidth: 200 }} // ???
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
				value={dbPathTemp}
			/>
		</InfoRowControl>
	);
};

const DBControl: FC = () => {
	const { t } = useTranslation();

	// const dispatch = useAppDispatch();

	// const dbPath = useAppSelector(selectDbPath);

	return (
		<ListItemModalControl
			anchorLabel={t('Database')} // ??? translation
			anchorIcon={({ color }) => (
				<Icon
					source="???"
					size={25}
					color={color}
				/>
			)}
			header={t('Database')} // ??? translation
			hasHeaderBackPress={true}
		>
			{/* <Text>{dbPath}</Text> */}

			<RowName />

			{/* {Object.keys(unitPrefs).map((key) => (
				<UnitControl
					key={key}
					unitKey={key}
					unitPref={unitPrefs[key]}
					onChange={(newPref) => {
						dispatch(
							setUnitPrefs({
								...unitPrefs,
								[key]: newPref,
							})
						);
					}}
				/>
			))} */}
		</ListItemModalControl>
	);
};

export default DBControl;
