/**
 * External dependencies
 */
import { FC, memo, useEffect, useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Text, Checkbox, useTheme, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import NumericRowControl from '../../../components/generic/controls/NumericRowControl';
import ToggleRowControl from '../../../components/generic/controls/ToggleRowControl';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { localStyles } from './styles';
import { TagMode, OverwriteMode } from './types';
import { queryAllTags } from '../../lines/db/queryFns';
import { classifyRegex } from '../../../lib/regexUtils';
import { useImportContext } from './ImportContext';

const StepPreview: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const {
		importMode,
		features,
		filename,
		selectedIndices,
		dirFiles,
		selectedFileUris,
		mergeMode,
		selectionCount,
		handleToggleFeature,
		handleSelectAllFeatures,
		handleDeselectAllFeatures,
		handleToggleFile,
		handleSelectAllFiles,
		handleDeselectAllFiles,
		handleImport,
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
		overwriteMode,
		setOverwriteMode,
		setMergeMode,
	} = useImportContext();

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

	const tagModeOptions = useMemo(
		() => [
			{ key: 'none', label: t('import.tagNone') },
			{ key: 'existing', label: t('import.tagExisting') },
			{ key: 'regex', label: t('import.tagRegex') },
		],
		[t]
	);

	const overwriteOptions = useMemo(
		() => [
			{ key: 'create', label: t('import.overwriteCreate') },
			{ key: 'skip', label: t('import.overwriteSkip') },
			{ key: 'overwrite', label: t('import.overwriteOverwrite') },
		],
		[t]
	);

	const overwriteInfoNode = useMemo(
		() => <Text>{t('import.overwriteInfo')}</Text>,
		[t]
	);

	const buttonPropsImport = useButtonProps({
		disabled: selectionCount === 0,
	});

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

					<View
						style={[
							localStyles.featureRow,
							localStyles.mergeToggle,
							outlineBorderStyle,
						]}
					>
						<Checkbox
							status={mergeMode ? 'checked' : 'unchecked'}
							onPress={() => setMergeMode((prev) => !prev)}
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

			<View style={localStyles.configSection}>

				{importMode === 'directory' && (
					<NumericRowControl
						label={t('import.fileLimit')}
						value={fileLimit}
						onUpdate={setFileLimit}
						numType="int"
					/>
				)}

				<InfoLabelRow label={t('import.titleRegex')}>
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
				</InfoLabelRow>
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

				<InfoLabelRow label={t('import.tagMode')}>
					<ButtonHighlightMenuControl
						options={tagModeOptions}
						value={tagMode}
						setValue={(v) => setTagMode(v as TagMode)}
						compact
					/>
				</InfoLabelRow>

				{tagMode === 'regex' && (
					<>
						<InfoLabelRow label={t('import.tagRegex')}>
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
						</InfoLabelRow>
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
					</>
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

				<ToggleRowControl
					label={t('import.dryRun')}
					value={dryRun}
					onToggle={() => setDryRun(!dryRun)}
				/>

				<InfoLabelRow
					label={t('import.overwriteMode')}
					Info={overwriteInfoNode}
				>
					<ButtonHighlightMenuControl
						options={overwriteOptions}
						value={overwriteMode}
						setValue={(v) => setOverwriteMode(v as OverwriteMode)}
						compact
					/>
				</InfoLabelRow>
			</View>

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
