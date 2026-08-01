/**
 * External dependencies
 */
import { FC, Dispatch, SetStateAction } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Text, Checkbox, useTheme, SegmentedButtons } from 'react-native-paper';
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

	const titleRegexPreview = (() => {
		const sample = importMode === 'file' ? filename : dirFiles[0]?.name ?? '';
		if (!titleRegex || !sample) return null;
		try {
			const re = new RegExp(titleRegex);
			const match = sample.match(re);
			const extracted = match?.[1];
			if (extracted) return extracted;
		} catch {
			return t('import.regexInvalid');
		}
		return null;
	})();

	const tagRemedPreview = (() => {
		const sample = importMode === 'file' ? filename : dirFiles[0]?.name ?? '';
		if (tagMode !== 'regex' || !tagRegex || !sample) return null;
		try {
			const re = new RegExp(tagRegex, 'g');
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
	})();

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
									{ borderColor: theme.colors.outline },
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
							{ borderColor: theme.colors.outline },
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
									{ borderColor: theme.colors.outline },
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
								{ borderColor: theme.colors.outline },
							]}
						/>
					</View>
				)}

				<View>
					<Text>{t('import.titleRegex')}</Text>
					<TextInput
						value={titleRegex}
						placeholder="/pattern/"
						onChangeText={setTitleRegex}
						style={[
							localStyles.configInput,
							{ borderColor: theme.colors.outline },
						]}
					/>
					{titleRegexPreview && (
						<Text style={[localStyles.configPreview, { color: theme.colors.primary }]}>
							{t('import.titlePreview')}: {titleRegexPreview}
						</Text>
					)}
				</View>

				<View>
					<Text>{t('import.tagMode')}</Text>
					<SegmentedButtons
						value={tagMode}
						onValueChange={(v) => setTagMode(v as TagMode)}
						buttons={[
							{ value: 'none', label: t('import.tagNone') },
							{ value: 'existing', label: t('import.tagExisting') },
							{ value: 'regex', label: t('import.tagRegex') },
						]}
					/>
				</View>

				{tagMode === 'regex' && (
					<View>
						<TextInput
							value={tagRegex}
							placeholder="/pattern/g"
							onChangeText={setTagRegex}
							style={[
								localStyles.configInput,
								{ borderColor: theme.colors.outline },
							]}
						/>
						{tagRemedPreview && (
							<Text style={[localStyles.configPreview, { color: theme.colors.primary }]}>
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
									{ borderColor: theme.colors.outline },
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

				<View style={[localStyles.featureRow, localStyles.dryRunToggle, { borderColor: theme.colors.outline }]}>
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

export default StepPreview;
