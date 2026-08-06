/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo } from 'react';
import { BackHandler, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import LucideIcons from '@react-native-vector-icons/lucide/static';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { localStyles } from '../styles';
import { ImportFileResult } from '../../types';
import { useImportContext } from '../../ImportContext';
import FileRow from './FileRow';

const StepResult: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { importResults, handleCloseImporter, handleBackToConfiguration } = useImportContext();
	const buttonPropsAny = useButtonProps({});

	// const dryRunBgStyle = useMemo(
	// 	() => ({ backgroundColor: theme.colors.surfaceVariant }),
	// 	[theme]
	// );

	const styleNotice = useMemo(
		() => [
			localStyles.dryRunNotice,
			{
				borderColor: theme.colors.primary,
				borderRadius: theme.roundness,
			},
		],
		[theme]
	);

	const flashListStyle = useMemo(() => ({ paddingBottom: 16 }), []);

	const isDryRun = useMemo(() => importResults.some((r) => r.isDryRun), [importResults]);

	useEffect(() => {
		if (!isDryRun) return;
		const subscription = BackHandler.addEventListener(
			'hardwareBackPress',
			() => {
				handleBackToConfiguration();
				return true;
			}
		);
		return () => subscription.remove();
	}, [isDryRun, handleBackToConfiguration]);

	const summaryText = useMemo(() => {
		const successCount = importResults.filter((r) => r.success).length;
		if (successCount === 0) return t('import.resultAllFailed');
		return sprintf(t('import.resultPartialSummary'), successCount, importResults.length);
	}, [importResults, t]);

	const keyExtractor = useCallback(
		(_result: ImportFileResult, index: number) => String(index),
		[]
	);

	const renderItem: ListRenderItem<ImportFileResult> = useCallback(
		({ item }) => <FileRow result={item} />,
		[]
	);

	return (
		<View style={[localStyles.container, localStyles.flex1]}>
			{isDryRun && (
				<View style={styleNotice}>
					<LucideIcons
						size={20}
						color={theme.colors.onBackground}
						name="triangle-alert"
					/>
					<Text style={localStyles.dryRunNoticeText}>{t('import.resultDryRunNotice')}</Text>
				</View>
			)}

			<View style={localStyles.buttonBar}>
				{isDryRun && (
					<ButtonHighlight
						{...buttonPropsAny}
						onPress={handleBackToConfiguration}
						style={localStyles.flex1}
					>
						{t('import.resultBackToConfiguration')}
					</ButtonHighlight>
				)}
				<ButtonHighlight
					{...buttonPropsAny}
					onPress={handleCloseImporter}
					style={localStyles.flex1}
				>
					{t('import.resultCloseImporter')}
				</ButtonHighlight>
			</View>

			<Text style={localStyles.resultSummary}>{summaryText}</Text>

			<FlashList
				data={importResults}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				contentContainerStyle={flashListStyle}
			/>
		</View>
	);
};

export default memo(StepResult);
