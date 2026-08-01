/**
 * External dependencies
 */
import { FC } from 'react';
import { ScrollView, View } from 'react-native';
import { Text, useTheme, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { localStyles } from './styles';
import { ImportFileResult } from './types';

const StepResult: FC<{
	importResults: ImportFileResult[];
	handleResultDone: () => void;
}> = ({ importResults, handleResultDone }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const buttonPropsAny = useButtonProps({});

	return (
		<View>
			<Text style={localStyles.resultSummary}>
				{sprintf(
					t('lines.importResultPartialSummary'),
					importResults.filter((r) => r.success).length,
					importResults.length
				)}
			</Text>

			<ScrollView
				style={localStyles.featureList}
				horizontal={false}
			>
				{importResults.map((result, idx) => (
					<View
						key={idx}
						style={[
							localStyles.resultRow,
							{ borderColor: theme.colors.outline },
						]}
					>
						<Icon
							source={result.success ? 'check-circle' : 'alert-circle'}
							size={20}
							color={
								result.success ? theme.colors.primary : theme.colors.error
							}
						/>
						<View style={localStyles.resultTextCol}>
							<Text style={localStyles.resultFileName}>{result.name}</Text>
							{result.success ? (
								<Text style={localStyles.resultDetail}>
									{sprintf(
										t('lines.importResultSuccess'),
										result.importedCount ?? 0
									)}
								</Text>
							) : (
								<Text
									style={[
										localStyles.resultDetail,
										{ color: theme.colors.error },
									]}
								>
									{sprintf(
										t('lines.importResultFailed'),
										result.error ?? ''
									)}
								</Text>
							)}
							{result.skippedGeom && result.skippedGeom > 0 && (
								<Text
									style={[
										localStyles.resultDetail,
										{ color: theme.colors.tertiary },
									]}
								>
									{sprintf(
										t('lines.importResultSkippedGeom'),
										result.skippedGeom
									)}
								</Text>
							)}
						</View>
					</View>
				))}
			</ScrollView>

			<View style={localStyles.importControls}>
				<ButtonHighlight
					{...buttonPropsAny}
					onPress={handleResultDone}
				>
					{t('lines.importDone')}
				</ButtonHighlight>
			</View>
		</View>
	);
};

export default StepResult;
