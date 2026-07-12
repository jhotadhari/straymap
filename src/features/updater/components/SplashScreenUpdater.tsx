/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { BackHandler, StyleSheet, View } from 'react-native';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import SplashScreen from '../../../components/SplashScreen';
import ButtonHighlight from '../../../components/generic/ButtonHighlight';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import packageJson from '../../../../package.json';
import { selectInstalledVersion, selectIsUpdating } from '../selectors';
import { setIsUpdating } from '../slice';

const handleExitApp = () => BackHandler.exitApp();

const FailControls: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const handleProceed = useCallback(() => {
		// dispatch(setInstalledVersion(packageJson.version));
		dispatch(setIsUpdating(false));
	}, [dispatch]);

	return (
		<View>
			<Text style={styles.marginTop}>{t('updater.updaterFail')}</Text>
			<View style={styles.failControlsRow}>
				<ButtonHighlight
					style={styles.failControlsButton}
					onPress={handleProceed}
					mode="contained"
					buttonColor={get(theme.colors, 'primaryContainer')}
					textColor={get(theme.colors, 'onPrimaryContainer')}
				>
					<Text>{t('updater.updaterProceed')}</Text>
				</ButtonHighlight>
				<ButtonHighlight
					style={styles.failControlsButton}
					onPress={handleExitApp}
					mode="contained"
					buttonColor={get(theme.colors, 'primaryContainer')}
					textColor={get(theme.colors, 'onPrimaryContainer')}
				>
					<Text>{t('updater.updaterCloseApp')}</Text>
				</ButtonHighlight>
			</View>
		</View>
	);
};

const UpdateResultRow: FC<{ updatingKey: string; updateResult: { state: string } }> = ({
	updatingKey,
	updateResult,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const styleResult = useMemo(
		() => [
			'success' === updateResult.state && { color: get(theme.colors, 'success') },
			'failed' === updateResult.state && { color: theme.colors.error },
		],
		[theme, updateResult.state]
	);

	return (
		<View style={styles.updateResultRow}>
			<Text>{sprintf(t('updater.updateFrom'), updatingKey) + ': '}</Text>
			<Text style={styleResult}>
				{get(
					{
						success: '✔ ',
						failed: '❌ ',
					},
					updateResult.state,
					''
				) + t('updater.' + updateResult.state)}
			</Text>
		</View>
	);
};

const SplashScreenUpdater: FC = () => {
	const isUpdating = useAppSelector(selectIsUpdating);

	const installedVersionStore = useAppSelector(selectInstalledVersion);

	const { t } = useTranslation();

	const failedResult = useMemo(
		() =>
			'object' === typeof isUpdating &&
			Object.values(isUpdating).find((result) => 'failed' === result.state),
		[isUpdating]
	);

	return (
		<SplashScreen displayLogo={false}>
			{!failedResult && 'isDowngrade' !== isUpdating && (
				<Text>{t('updater.updatingMsg')}</Text>
			)}

			{'object' === typeof isUpdating &&
				Object.keys(isUpdating).map((updatingKey: string) => (
					<UpdateResultRow
						key={updatingKey}
						updatingKey={updatingKey}
						updateResult={get(isUpdating, updatingKey)}
					/>
				))}

			{failedResult && isUpdating && (
				<View style={styles.marginTop}>
					<Text style={styles.marginTop}>
						{t('updater.errorMsg') +
							': ' +
							get(failedResult, 'msg', t('updater.errorMsgFallback'))}
					</Text>
					<FailControls />
				</View>
			)}

			{'isDowngrade' === isUpdating && (
				<View style={styles.marginTop}>
					<Text style={styles.marginTop}>{t('updater.errorDowngrade')}</Text>
					<Text style={styles.marginTop}>
						{sprintf(t('updater.versionLast'), installedVersionStore)}
					</Text>
					<Text style={styles.marginTop}>
						{sprintf(t('updater.versionCurrent'), packageJson.version)}
					</Text>
					<FailControls />
				</View>
			)}
		</SplashScreen>
	);
};

const styles = StyleSheet.create({
	marginTop: {
		marginTop: 10,
	},
	failControlsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	failControlsButton: {
		marginTop: 20,
		marginBottom: 40,
	},
	updateResultRow: {
		marginTop: 10,
		flexDirection: 'row',
	},
});

export default SplashScreenUpdater;
