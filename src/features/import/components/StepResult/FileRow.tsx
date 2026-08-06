/**
 * External dependencies
 */
import { FC, memo, useMemo } from 'react';
import { View } from 'react-native';
import { Text, useTheme, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import TagBadge from '../../../lines/components/TagBadge';
import { localStyles } from '../styles';
import { ImportFileResult } from '../../types';
import { useAppSelector } from '../../../../store/hooks';
import dayjs from '../../../../lib/dayjs';
import { selectDateTimeFormat } from '../../../general/selectors';
import UnmatchedLines from './UnmatchedLines';

const titleModeLabels: Record<string, string> = {
	none: 'import.titleModeNone',
	filenameWithoutExt: 'import.titleModeFilenameWithoutExt',
	filenameWithExt: 'import.titleModeFilenameWithExt',
	nameProperty: 'import.titleModeNameProperty',
	regex: 'import.titleModeRegex',
};

const FileRow: FC<{ result: ImportFileResult }> = memo(({ result }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dateTimeFormat = useAppSelector(selectDateTimeFormat);

	const errorColor = useMemo(() => theme.colors.error, [theme]);

	const borderColor = useMemo(
		() => (result.success ? theme.colors.outline : errorColor),
		[
			result.success,
			theme,
			errorColor,
		]
	);

	const countsParts = useMemo(() => {
		const parts: string[] = [];
		if (result.overwritten && result.overwritten > 0) {
			if (result.importedCount && result.importedCount > 0) {
				parts.push(sprintf(t('import.resultNewTracks'), result.importedCount));
			}
			parts.push(sprintf(t('import.resultOverwritten'), result.overwritten));
		} else if (result.importedCount && result.importedCount > 0) {
			if (result.mergeMode && result.tracksTotal && result.tracksTotal > 1) {
				parts.push(sprintf(t('import.resultTracksMerged'), result.tracksTotal));
			} else if (result.tracksTotal && result.tracksTotal !== result.importedCount) {
				parts.push(
					sprintf(t('import.resultTracksOf'), result.importedCount, result.tracksTotal)
				);
			} else {
				parts.push(sprintf(t('import.resultSuccess'), result.importedCount));
			}
		}
		if (result.skipped && result.skipped > 0) {
			parts.push(sprintf(t('import.resultSkippedExisting'), result.skipped));
		}
		if (result.skippedGeom && result.skippedGeom > 0) {
			parts.push(sprintf(t('import.resultSkippedGeom'), result.skippedGeom));
		}
		return parts;
	}, [result, t]);

	const countText = useMemo(
		() => (countsParts.length > 0 ? countsParts.join(' \u00b7 ') : undefined),
		[countsParts]
	);

	const titleInfo = useMemo((): string | undefined => {
		if (!result.titleMode || result.titleMode === 'none') return undefined;
		if (result.mergeMode) {
			if (result.titleExtracted && result.titleMode) {
				const modeLabel = t(titleModeLabels[result.titleMode] ?? result.titleMode);
				return sprintf(t('import.resultTitleVia'), result.titleExtracted, modeLabel);
			}
			if (result.titleMode === 'regex' && !result.titleExtracted) {
				return t('import.resultRegexNoMatch');
			}
			return undefined;
		}
		if (result.tracksWithNames !== undefined && result.tracksWithoutNames !== undefined) {
			return sprintf(
				t('import.resultTracksNamed'),
				result.tracksWithNames,
				result.tracksWithoutNames
			);
		}
		return undefined;
	}, [result, t]);

	const dateText = useMemo((): string | undefined => {
		if (!result.dateApplied) return undefined;
		const formatted = dayjs(result.dateApplied).format(dateTimeFormat);
		const label = t('lines.columns.custom_date');
		if (result.datePatternName) {
			return sprintf(t('import.resultDateApplied'), label, formatted, result.datePatternName);
		}
		return sprintf(t('import.resultDateApplied'), label, formatted, result.dateApplied);
	}, [
		result.dateApplied,
		result.datePatternName,
		dateTimeFormat,
		t,
	]);

	const hasTags = result.tags && result.tags.length > 0;

	return (
		<View style={[localStyles.fileRow, { borderBottomColor: borderColor }]}>
			<View style={localStyles.fileRowHeader}>
				<Icon
					size={20}
					source={result.success ? 'check-circle' : 'alert-circle'}
					color={result.success ? get(theme.colors, 'success') : errorColor}
				/>
				<Text
					style={localStyles.fileName}
					numberOfLines={2}
				>
					{result.name}
				</Text>
			</View>

			{result.success ? (
				<>
					{countText && <Text style={localStyles.fileRowCounts}>{countText}</Text>}

					{titleInfo && <Text style={localStyles.fileRowDetail}>{titleInfo}</Text>}

					{/* Should always have at least the 'imported' tag */}
					{result.tagMode && hasTags && (
						<View style={localStyles.fileRowBadges}>
							{result.tags!.map((tag) => (
								<TagBadge
									key={tag.label}
									tag={tag}
								/>
							))}
						</View>
					)}

					{dateText && <Text style={localStyles.fileRowDetail}>{dateText}</Text>}
				</>
			) : (
				<Text style={[localStyles.fileRowCounts, { color: errorColor }]}>
					{sprintf(t('import.resultFailed'), result.error ?? '')}
				</Text>
			)}

			<UnmatchedLines
				unmatchedIds={result.unmatchedIds}
				filename={result.name}
			/>
		</View>
	);
});

export default FileRow;
