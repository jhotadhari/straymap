/**
 * External dependencies
 */
import { FC, Dispatch, memo, SetStateAction, useEffect, useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Text, Checkbox, useTheme, SegmentedButtons, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { Feature, GeoJsonProperties, LineString } from 'geojson';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { localStyles } from './styles';
import { ImportMode, TagMode } from './types';
import { queryAllTags } from '../../lines/db/queryFns';
import { classifyRegex } from '../../../lib/regexUtils';

const StepPreview: FC<{
	importMode: ImportMode;
	features: Feature<LineString, GeoJsonProperties>[];
	filename: string;
	selectedIndices: Set<number>;
	dirFiles: { uri: string; name: string }[];
	selectedFileUris: Set<string>;
	mergeMode: boolean;
	onToggleMergeMode: () => void;
	selectionCount: number;
	handleToggleFeature: (idx: number) => void;
	handleSelectAllFeatures: () => void;
	handleDeselectAllFeatures: () => void;
	handleToggleFile: (uri: string) => void;
	handleSelectAllFiles: () => void;
	handleDeselectAllFiles: () => void;
	handleImport: () => void;
	buttonPropsImport: Record<string, unknown>;
	fileLimit: number;
	setFileLimit: (n: number) => void;
	titleRegex: string;
	setTitleRegex: (s: string) => void;
	tagMode: TagMode;
	setTagMode: (m: TagMode) => void;
	tagRegex: string;
	setTagRegex: (s: string) => void;
	selectedTagIds: number[];
	setSelectedTagIds: Dispatch<SetStateAction<number[]>>;
	dryRun: boolean;
	setDryRun: (b: boolean) => void;
}> = ({
	importMode,
	features,
	filename,
	selectedIndices,
	dirFiles,
	selectedFileUris,
	mergeMode,
	onToggleMergeMode,
	selectionCount,
	handleToggleFeature,
	handleSelectAllFeatures,
	handleDeselectAllFeatures,
	handleToggleFile,
	handleSelectAllFiles,
	handleDeselectAllFiles,
	handleImport,
	buttonPropsImport,
	fileLimit,
	setFileLimit,
	titleRegex,
	setTitleRegex,
	tagMode,
	setTagMode,
	tagRegex,
	setTagRegex,
	selectedTagIds,
	setSelectedTagIds,
	dryRun,
	setDryRun,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { data: allTags } = useQuery({
		queryKey: ['tags'],
		queryFn: queryAllTags,
		enabled: tagMode === 'existing',
		staleTime: 0,
	});

	const [debouncedTitleRegex, setDebouncedTitleRegex] = useState(titleRegex);
	const [debouncedTagRegex, setDebouncedTagRegex] = useState(tagRegex);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedTitleRegex(titleRegex), 300);
		return () => clearTimeout(timer);
	}, [titleRegex]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedTagRegex(tagRegex), 300);
		return () => clearTimeout(timer);
	}, [tagRegex]);

	const titleRegexPreview = useMemo(() => {
		const sample = importMode === 'file' ? filename : dirFiles[0]?.name ?? '';
		if (!debouncedTitleRegex || !sample) return null;
		try {
			const re = new RegExp(debouncedTitleRegex);
			const match = sample.match(re);
			const extracted = match?.[1];
			if (extracted) return extracted;
		} catch {
			return t('import.regexInvalid');
		}
		return null;
	}, [debouncedTitleRegex, importMode, filename, dirFiles, t]);

	const tagRemedPreview = useMemo(() => {
		const sample = importMode === 'file' ? filename : dirFiles[0]?.name ?? '';
		if (tagMode !== 'regex' || !debouncedTagRegex || !sample) return null;
		try {
			const re = new RegExp(debouncedTagRegex, 'g');
			const labels: string[] = [];
			let match;
			while ((match = re.exec(sample)) !== null) {
				labels.push(match[1] ?? match[0]);
			}
			if (labels.length) return labels.join(', ');
		} catch {
			return t('import.regexInvalid');
		}
		return null;
	}, [debouncedTagRegex, tagMode, importMode, filename, dirFiles, t]);

	const titleRegexWarning = useMemo(() => {
		if (!titleRegex) return false;
		return classifyRegex(titleRegex).dangerous;
	}, [titleRegex]);

	const tagRegexWarning = useMemo(() => {
		if (!tagRegex) return false;
		return classifyRegex(tagRegex).dangerous;
	}, [tagRegex]);

	const outlineBorderStyle = useMemo(
		() => ({ borderColor: theme.colors.outline }),
		[theme]
	);
	const tertiaryColorStyle = useMemo(
		() => ({ color: theme.colors.tertiary }),
		[theme]
	);
	const primaryColorStyle = useMemo(
		() => ({ color: theme.colors.primary }),
		[theme]
	);

	const tagModeButtons = useMemo(
		() => [
			{ value: 'none', label: t('import.tagNone') },
			{ value: 'existing', label: t('import.tagExisting') },
			{ value: 'regex', label: t('import.tagRegex') },
		],
		[t]
	);

	return (
		<View>
			{importMode === 'file' ? (
				<>
					<Text style={localStyles.filename}>{filename}</Text>
					<Text style={localStyles.featureCount}>
						{sprintf(t('import.featureCount'), features.length)}
					</Text>

					<View style={localStyles.selectRow}>
						<ButtonHighlight
							compact
							onPress={handleSelectAllFeatures}
						>
							{t('lines.selectAll')}
						</ButtonHighlight>
						<ButtonHighlight
							compact
							onPress={handleDeselectAllFeatures}
						>
							{t('lines.selectNone')}
						</ButtonHighlight>
					</View>

					<ScrollView
						style={localStyles.featureList}
						horizontal={false}
					>
						{features.map((feature, idx) => (
							<View
								key={idx}
								style={[
									localStyles.featureRow,
									outlineBorderStyle,
								]}
							>
								<Checkbox
									status={
										selectedIndices.has(idx) ? 'checked' : 'unchecked'
									}
									onPress={() => handleToggleFeature(idx)}
								/>
								<Text>
									{feature.properties?.name ??
										sprintf(t('import.trackN'), idx + 1)}
								</Text>
							</View>
						))}
					</ScrollView>

					{/* Merge toggle (single-file only) */}
					<View
						style={[
							localStyles.featureRow,
							localStyles.mergeToggle,
							outlineBorderStyle,
						]}
					>
						<Checkbox
							status={mergeMode ? 'checked' : 'unchecked'}
							onPress={onToggleMergeMode}
						/>
						<Text>{t('import.mergeMode')}</Text>
					</View>
				</>
			) : (
				<>
					<Text style={localStyles.featureCount}>
						{sprintf(t('import.dirFilesFound'), dirFiles.length)}
					</Text>

					<View style={localStyles.selectRow}>
						<ButtonHighlight
							compact
							onPress={handleSelectAllFiles}
						>
							{t('lines.selectAll')}
						</ButtonHighlight>
						<ButtonHighlight
							compact
							onPress={handleDeselectAllFiles}
						>
							{t('lines.selectNone')}
						</ButtonHighlight>
					</View>

					<ScrollView
						style={localStyles.featureList}
						horizontal={false}
					>
						{dirFiles.map((file) => (
							<View
								key={file.uri}
								style={[
									localStyles.featureRow,
									outlineBorderStyle,
								]}
							>
								<Checkbox
									status={
										selectedFileUris.has(file.uri)
											? 'checked'
											: 'unchecked'
									}
									onPress={() => handleToggleFile(file.uri)}
								/>
								<Text>{file.name}</Text>
							</View>
						))}
					</ScrollView>
				</>
			)}

			{/* ---- Import config ---- */}
			<View style={localStyles.configSection}>

				{importMode === 'directory' && (
					<View>
						<Text>{t('import.fileLimit')}</Text>
						<TextInput
							keyboardType="numeric"
							value={fileLimit > 0 ? String(fileLimit) : ''}
							placeholder="0 = all"
							onChangeText={(v) => setFileLimit(parseInt(v, 10) || 0)}
							style={[
								localStyles.configInput,
								outlineBorderStyle,
							]}
						/>
					</View>
				)}

				<View>
					<Text>{t('import.titleRegex')}</Text>
					<TextInput
						value={titleRegex}
						placeholder="/pattern/"
						maxLength={300}
						onChangeText={setTitleRegex}
						style={[
							localStyles.configInput,
							outlineBorderStyle,
						]}
					/>
					{titleRegexWarning && (
						<Text style={[localStyles.configPreview, tertiaryColorStyle]}>
							<Icon source="alert" size={12} color={theme.colors.tertiary} /> {t('import.regexExpensive')}
						</Text>
					)}
					{titleRegexPreview && (
						<Text style={[localStyles.configPreview, primaryColorStyle]}>
							{t('import.titlePreview')}: {titleRegexPreview}
						</Text>
					)}
				</View>

				<View>
					<Text>{t('import.tagMode')}</Text>
					<SegmentedButtons
						value={tagMode}
						onValueChange={(v) => setTagMode(v as TagMode)}
						buttons={tagModeButtons}
					/>
				</View>

				{tagMode === 'regex' && (
					<View>
						<TextInput
							value={tagRegex}
							placeholder="/pattern/g"
							maxLength={300}
							onChangeText={setTagRegex}
							style={[
								localStyles.configInput,
								outlineBorderStyle,
							]}
						/>
						{tagRegexWarning && (
							<Text style={[localStyles.configPreview, tertiaryColorStyle]}>
								<Icon source="alert" size={12} color={theme.colors.tertiary} /> {t('import.regexExpensive')}
							</Text>
						)}
						{tagRemedPreview && (
							<Text style={[localStyles.configPreview, primaryColorStyle]}>
								{t('import.tagPreview')}: {tagRemedPreview}
							</Text>
						)}
					</View>
				)}

				{tagMode === 'existing' && allTags && (
					<ScrollView
						style={localStyles.tagSelectList}
						horizontal={false}
					>
						{allTags.map((tag) => (
							<View
								key={tag.id}
								style={[
									localStyles.featureRow,
									outlineBorderStyle,
								]}
							>
								<Checkbox
									status={
										selectedTagIds.includes(tag.id) ? 'checked' : 'unchecked'
									}
									onPress={() =>
										setSelectedTagIds((prev) =>
											prev.includes(tag.id)
												? prev.filter((id) => id !== tag.id)
												: [...prev, tag.id]
										)
									}
								/>
								<Text>{tag.label ?? `#${tag.id}`}</Text>
							</View>
						))}
					</ScrollView>
				)}

				<View style={[localStyles.featureRow, localStyles.dryRunToggle, outlineBorderStyle]}>
					<Checkbox
						status={dryRun ? 'checked' : 'unchecked'}
						onPress={() => setDryRun(!dryRun)}
					/>
					<Text>{t('import.dryRun')}</Text>
				</View>
			</View>

			{/* ---- import button ---- */}
			<View style={localStyles.importControls}>
				<ButtonHighlight
					{...buttonPropsImport}
					onPress={handleImport}
				>
					{dryRun
						? t('import.dryRunAction')
						: sprintf(t('import.selected'), selectionCount)}
				</ButtonHighlight>
			</View>
		</View>
	);
};

export default memo(StepPreview);
