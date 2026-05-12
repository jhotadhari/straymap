/**
 * External dependencies
 */
import { FC, useContext, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../../Context';
import LayersControl from '../../baseMap/components/controls/layers/LayersControl';
import Dashboard from '../../dashboard/components/Dashboard';

const SettingsDashboard: FC = () => {
	const theme = useTheme();

	const { t } = useTranslation();

	const { width } = useSafeAreaFrame();

	const { appInnerHeight } = useContext(AppContext);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	return (
		<View
			style={{
				backgroundColor: theme.colors.background,
				height: appInnerHeight,
				width,
				position: 'absolute',
				zIndex: 9,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			}}
		>

			<ScrollView scrollEnabled={scrollEnabled}>
				<LayersControl
					newLabel={t('map.addNewLayer')}
					setScrollEnabled={setScrollEnabled}
					saveOnChange={false}
					saveOnUnmount={true}
				/>
			</ScrollView>

			<Dashboard
				outerWidth={width}
				// style={{
				// 	// zIndex: 999,
				// }}
			/>
		</View>
	);
};

export default SettingsDashboard;
