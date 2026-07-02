/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ListItemModalControl from '../../../../../components/generic/controls/ListItemModalControl';
import HgtSourceRowControl from '../../../../../components/generic/controls/HgtSourceRowControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectHgtDirPath } from '../../../baseMap/selectors';
import { setHgtDirPath } from '../../../baseMap/slice';
import { selectAppDirs } from '../../../dirs/selectors';

const HgtControl = () => {
	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	const dispatch = useAppDispatch();

	const hgtDirPath = useAppSelector(selectHgtDirPath);

	const handleSetHgtDirPath = useCallback(
		(options: object) => {
			dispatch(setHgtDirPath(get(options, 'hgtDirPath') || undefined));
		},
		[dispatch]
	);

	return (
		<ListItemModalControl
			anchorLabel={t('dem')}
			anchorIcon={({ color, style }) => (
				<View style={style}>
					<Icon
						source="elevation-rise"
						color={color}
						size={25}
					/>
				</View>
			)}
			header={t('dem')}
		>
			<HgtSourceRowControl
				options={{ hgtDirPath }}
				setOptions={handleSetHgtDirPath}
				optKey={'hgtDirPath'}
				dirs={get(appDirs, 'dem', [])}
				onlyThreeSeconds={true}
			/>
		</ListItemModalControl>
	);
};

export default HgtControl;
