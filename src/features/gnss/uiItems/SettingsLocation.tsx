/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsActive } from '../selectors';
import { setIsActive } from '../slice';
import TrackRecordingControl from '../../trackRecording/components/TrackRecordingControl';
import RecordingLineWidthControl from '../../trackRecording/components/controls/RecordingLineWidthControl';
import GnssCenterControl from '../components/controls/GnssCenterControl';
import GnssMarkerControl from '../components/controls/GnssMarkerControl';
import TrackingDrawerPanelSideControl from '../components/controls/TrackingDrawerPanelSideControl';
import ToggleRowControl from '../../../components/generic/controls/ToggleRowControl';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import ensureLocationPermission from '../../../lib/locationPermission';

/**
 * Uppercase, muted section heading rendered above each settings group —
 * the flat list equivalent of the Material 3 grouped-list look.
 */
const SettingsSectionHeader: FC<{ title: string; first?: boolean }> = ({ title, first }) => {
	const theme = useTheme();

	return (
		<Text
			style={[
				styles.sectionHeader,
				first && styles.sectionHeaderFirst,
				{ color: theme.colors.onSurfaceVariant },
			]}
		>
			{title}
		</Text>
	);
};

/**
 * Location settings, grouped into three flat sections:
 *
 * 1. GNSS & Positioning — enable toggle, auto-center mode, marker config.
 * 2. Track Recording — recording thresholds.
 * 3. Display — drawer panel side and recording line width.
 *
 * Live session actions (start/stop recording) live in the drawer panel,
 * not here — this page only holds configuration.
 */
const SettingsLocation: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { showError } = useContext(ErrorToastContext);

	const isGnssActive = useAppSelector(selectIsActive);

	const handleToggleGnss = useCallback(async () => {
		if (!isGnssActive) {
			const granted = await ensureLocationPermission();
			if (!granted) {
				showError(t('gnss.permissionDenied'));
				return;
			}
			dispatch(setIsActive(true));
			return;
		}
		dispatch(setIsActive(false));
	}, [
		dispatch,
		isGnssActive,
		showError,
		t,
	]);

	return (
		<ScrollView
			style={style}
			contentContainerStyle={styles.content}
		>
			<View>
				<SettingsSectionHeader
					first
					title={t('gnss.sectionGnssPositioning')}
				/>
				<View style={styles.row}>
					<ToggleRowControl
						label={t('gnss.enableGnss')}
						value={isGnssActive}
						onToggle={handleToggleGnss}
						Info={t('gnss.hintGnssLocation')}
					/>
				</View>
				<View style={styles.row}>
					<GnssCenterControl />
				</View>
				<View style={styles.row}>
					<GnssMarkerControl />
				</View>
			</View>
			<View>
				<SettingsSectionHeader title={t('trackRecording.sectionTrackRecording')} />
				<View style={styles.row}>
					<TrackRecordingControl />
				</View>
			</View>
			<View>
				<SettingsSectionHeader title={t('gnss.sectionDisplayDrawer')} />
				<View style={styles.row}>
					<TrackingDrawerPanelSideControl />
				</View>
				<View style={styles.row}>
					<InfoLabelRow
						label={t('trackRecording.lineWidth')}
						Info={t('trackRecording.hintLineWidth')}
					>
						<RecordingLineWidthControl />
					</InfoLabelRow>
				</View>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingBottom: 32,
		paddingHorizontal: 16,
		gap: 20,
	},
	row: {
		paddingVertical: 8,
	},
	sectionHeader: {
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 1,
		textTransform: 'uppercase',
		marginTop: 24,
		marginBottom: 8,
	},
	sectionHeaderFirst: {
		marginTop: 8,
	},
});

export default SettingsLocation;
