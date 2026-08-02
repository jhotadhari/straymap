/**
 * External dependencies
 */
import { FC, memo, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Text, useTheme, Icon, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import { localStyles } from './styles';
import { useImportContext } from './ImportContext';

const StepResult: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { importResults, handleResultDone } = useImportContext();
	const buttonPropsAny = useButtonProps({});

	const resultErrorStyle = useMemo(
		() => ({ color: theme.colors.error }),
		[theme]
	);
	const resultTertiaryStyle = useMemo(
		() => ({ color: theme.colors.tertiary }),
		[theme]
	);

	return (
		<ScrollView>
			<Text style={localStyles.resultSummary}>
				{sprintf(
					t('import.resultPartialSummary'),
					importResults.filter((r) => r.success).length,
					importResults.length
				)}
			</Text>

			{importResults.map((result, idx) => (
				<List.Item
					key={idx}
					title={result.name}
					left={(props) => (
						<Icon
							{...props}
							size={20}
							source={result.success ? 'check-circle' : 'alert-circle'}
							color={
								result.success ? theme.colors.primary : theme.colors.error
							}
						/>
					)}
					description={() => (
						<>
							{result.success ? (
								<Text style={localStyles.resultDetail}>
									{sprintf(
										t('import.resultSuccess'),
										result.importedCount ?? 0
									)}
								</Text>
							) : (
								<Text style={[localStyles.resultDetail, resultErrorStyle]}>
									{sprintf(
										t('import.resultFailed'),
										result.error ?? ''
									)}
								</Text>
							)}
							{result.skippedGeom && result.skippedGeom > 0 && (
								<Text
									style={[localStyles.resultDetail, resultTertiaryStyle]}
								>
									{sprintf(
										t('import.resultSkippedGeom'),
										result.skippedGeom
									)}
								</Text>
							)}
							{result.overwritten && result.overwritten > 0 && (
								<Text
									style={[localStyles.resultDetail, resultTertiaryStyle]}
								>
									{sprintf(
										t('import.resultOverwritten'),
										result.overwritten
									)}
								</Text>
							)}
							{result.skipped && result.skipped > 0 && (
								<Text
									style={[localStyles.resultDetail, resultTertiaryStyle]}
								>
									{sprintf(
										t('import.resultSkippedExisting'),
										result.skipped
									)}
								</Text>
							)}
						</>
					)}
				/>
			))}

			<View style={localStyles.importControls}>
				<ButtonHighlight {...buttonPropsAny} onPress={handleResultDone}>
					{t('import.done')}
				</ButtonHighlight>
			</View>
		</ScrollView>
	);
};

export default memo(StepResult);
