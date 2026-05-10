/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import ListItemMenuControl from './generic/ListItemMenuControl';
import HardwareKeyControl from '../store/features/general/components/controls/HardwareKeyControl';
import { DashboardControl } from './Dashboard';
import UnitPrefControl from '../store/features/general/components/controls/UnitPrefControl';
import HgtControl from '../store/features/general/components/controls/HgtControl';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectLang } from '../store/features/general/selectors';
import { LANGUAGE_NAMES } from '../assets/i18n/i18n';
import { get } from 'lodash-es';
import { setLang } from '../store/features/general/generalSlice';

const LangControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const lang = useAppSelector(selectLang);
	const handleChange = useCallback((newLang: string) => dispatch(setLang(newLang)), []);

	const options = useMemo(
		() => [
			{
				key: 'system',
				label: 'systemSetting',
			},
			...Object.keys(LANGUAGE_NAMES).map((langKey: string) => ({
				key: langKey,
				label: get(LANGUAGE_NAMES, [langKey, 'native'], ''),
			})),
		],
		[]
	);

	return (
		<ListItemMenuControl
			anchorLabel={t('selectLang')}
			anchorLabelAppendSelected={true}
			options={options}
			setValue={handleChange}
			value={lang}
			anchorIcon={({ style, color }) => (
				<MaterialIcons
					style={style}
					name="language"
					size={25}
					color={color}
				/>
			)}
		/>
	);
};

const SettingsGeneral: FC = () => {
	const theme = useTheme();
	const { width } = useSafeAreaFrame();
	const { appInnerHeight } = useContext(AppContext);

	return (
		<ScrollView
			style={{
				backgroundColor: theme.colors.background,
				height: appInnerHeight,
				width,
				position: 'absolute',
				zIndex: 9,
			}}
		>
			<LangControl />

			<HardwareKeyControl />

			<UnitPrefControl />

			<DashboardControl />

			<HgtControl />
		</ScrollView>
	);
};

export default SettingsGeneral;
