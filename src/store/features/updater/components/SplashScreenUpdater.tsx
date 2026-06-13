/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { BackHandler, View } from 'react-native';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import SplashScreen from '../../../../components/SplashScreen';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import packageJson from '../../../../../package.json';
import { selectInstalledVersion, selectIsUpdating } from '../selectors';
import { setIsUpdating } from '../slice';

const FailControls: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	return (
		<View>
			<Text style={{ marginTop: 10 }}>{t('updater.updaterFail')}</Text>
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
				}}
			>
				<ButtonHighlight
					style={{ marginTop: 20, marginBottom: 40 }}
					onPress={() => {
						// dispatch(setInstalledVersion(packageJson.version));
						dispatch(setIsUpdating(false));
					}}
					mode="contained"
					buttonColor={get(theme.colors, 'primaryContainer')}
					textColor={get(theme.colors, 'onPrimaryContainer')}
				>
					<Text>{t('updater.updaterProceed')}</Text>
				</ButtonHighlight>
				<ButtonHighlight
					style={{ marginTop: 20, marginBottom: 40 }}
					onPress={() => BackHandler.exitApp()}
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

const SplashScreenUpdater: FC = () => {
	const isUpdating = useAppSelector(selectIsUpdating);

	const installedVersionStore = useAppSelector(selectInstalledVersion);

	const theme = useTheme();

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
				Object.keys(isUpdating).map((updatingKey: string) => {
					const updateResult = get(isUpdating, updatingKey);
					return (
						<View
							key={updatingKey}
							style={{
								marginTop: 10,
								flexDirection: 'row',
							}}
						>
							<Text>{sprintf(t('updater.updateFrom'), updatingKey) + ': '}</Text>
							<Text
								style={{
									...('success' === updateResult.state && {
										color: get(theme.colors, 'success'),
									}),
									...('failed' === updateResult.state && {
										color: theme.colors.error,
									}),
								}}
							>
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
				})}

			{failedResult && isUpdating && (
				<View style={{ marginTop: 10 }}>
					<Text style={{ marginTop: 10 }}>
						{t('updater.errorMsg') +
							': ' +
							get(failedResult, 'msg', t('updater.errorMsgFallback'))}
					</Text>
					<FailControls />
				</View>
			)}

			{'isDowngrade' === isUpdating && (
				<View style={{ marginTop: 10 }}>
					<Text style={{ marginTop: 10 }}>{t('updater.errorDowngrade')}</Text>
					<Text style={{ marginTop: 10 }}>
						{sprintf(t('updater.versionLast'), installedVersionStore)}
					</Text>
					<Text style={{ marginTop: 10 }}>
						{sprintf(t('updater.versionCurrent'), packageJson.version)}
					</Text>
					<FailControls />
				</View>
			)}
		</SplashScreen>
	);
};

export default SplashScreenUpdater;
