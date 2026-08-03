/**
 * External dependencies
 */
import { FC, Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, PermissionsAndroid, Platform } from 'react-native';
import { List, Text, Checkbox, useTheme, Icon, TextInput } from 'react-native-paper';
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
import DateExtractRowControl from './DateExtractRowControl';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	selectFileLimit,
	selectTitleRegex,
	selectTagMode,
	selectTagRegex,
	selectDryRun,
	selectOverwriteMode,
	selectKeepAppActive,
} from '../selectors';
import {
	setFileLimit,
	setTitleRegex,
	setTagMode,
	setTagRegex,
	setDryRun,
	setOverwriteMode,
	setKeepAppActive,
} from '../slice';
import HintLink from '../../../components/generic/primitives/HintLink';
import { sharedStyles } from '../../../sharedStyles';

const validateFileLimit = (val: number) => val >= 0;

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
		selectedTagIds,
		setSelectedTagIds,
		setMergeMode,
	} = useImportContext();

	const dispatch = useAppDispatch();
	const fileLimit = useAppSelector(selectFileLimit);
	const titleRegex = useAppSelector(selectTitleRegex);
	const tagMode = useAppSelector(selectTagMode);
	const tagRegex = useAppSelector(selectTagRegex);
	const dryRun = useAppSelector(selectDryRun);
	const overwriteMode = useAppSelector(selectOverwriteMode);
	const keepAppActive = useAppSelector(selectKeepAppActive);

	const handleToggleKeepAppActive = useCallback(async () => {
		const next = !keepAppActive;
		if (next && Platform.OS === 'android' && Platform.Version >= 33) {
			try {
				const result = await PermissionsAndroid.request(
					'android.permission.POST_NOTIFICATIONS'
				);
				if (result !== PermissionsAndroid.RESULTS.GRANTED) {
					return;
				}
			} catch {
				return;
			}
		}
		dispatch(setKeepAppActive(next));
	}, [keepAppActive, dispatch]);

	const handleSetFileLimit = useCallback(
		(v: number) => {
			dispatch(setFileLimit(v));
		},
		[dispatch]
	);

	const handleSetTitleRegex = useCallback(
		(v: string) => {
			dispatch(setTitleRegex(v));
		},
		[dispatch]
	);

	const handleSetTagMode = useCallback(
		(v: string) => {
			dispatch(setTagMode(v as TagMode));
		},
		[dispatch]
	);

	const handleSetTagRegex = useCallback(
		(v: string) => {
			dispatch(setTagRegex(v));
		},
		[dispatch]
	);

	const handleToggleDryRun = useCallback(() => {
		dispatch(setDryRun(!dryRun));
	}, [dispatch, dryRun]);

	const handleSetOverwriteMode = useCallback(
		(v: string) => {
			dispatch(setOverwriteMode(v as OverwriteMode));
		},
		[dispatch]
	);

	const handleToggleMergeMode = useCallback(() => {
		setMergeMode((prev) => !prev);
	}, [setMergeMode]);

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
		const sample = importMode === 'file' ? filename : (dirFiles[0]?.name ?? '');
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
	}, [
		debouncedTitleRegex,
		importMode,
		filename,
		dirFiles,
		t,
	]);

	const tagRegexPreview = useMemo(() => {
		const sample = importMode === 'file' ? filename : (dirFiles[0]?.name ?? '');
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
	}, [
		debouncedTagRegex,
		tagMode,
		importMode,
		filename,
		dirFiles,
		t,
	]);

	const titleRegexWarning = useMemo(() => {
		if (!titleRegex) return false;
		return classifyRegex(titleRegex).dangerous;
	}, [titleRegex]);

	const tagRegexWarning = useMemo(() => {
		if (!tagRegex) return false;
		return classifyRegex(tagRegex).dangerous;
	}, [tagRegex]);

	const tertiaryColorStyle = useMemo(() => ({ color: theme.colors.tertiary }), [theme]);
	const primaryColorStyle = useMemo(() => ({ color: theme.colors.primary }), [theme]);

	const buttonPropsSelect = useButtonProps({});

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

	const handleToggleTag = useCallback(
		(tagId: number) =>
			setSelectedTagIds((prev) =>
				prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
			),
		[setSelectedTagIds]
	);

	const overwriteInfoNode = useMemo(() => <Text>{t('import.hint.overwriteMode')}</Text>, [t]);

	const tagModeAnchorLabel = useMemo(
		() => tagModeOptions.find((o) => o.key === tagMode)?.label ?? '',
		[tagModeOptions, tagMode]
	);

	const overwriteAnchorLabel = useMemo(
		() => overwriteOptions.find((o) => o.key === overwriteMode)?.label ?? '',
		[overwriteOptions, overwriteMode]
	);

	const hintTitleRegex = useMemo(
		() => (
			<View style={sharedStyles.gap}>
				<Text>{t('import.hint.titleRegex')}</Text>
				<Text>{t('hint.regex.body')}</Text>
				<HintLink url="https://regexr.com/" />
			</View>
		),
		[t]
	);
	const hintTagRegex = useMemo(
		() => (
			<View style={sharedStyles.gap}>
				<Text>{t('import.hint.tagRegex')}</Text>
				<Text>{t('hint.regex.body')}</Text>
				<HintLink url="https://regexr.com/" />
			</View>
		),
		[t]
	);

	const buttonPropsImport = useButtonProps({
		disabled: selectionCount === 0,
	});

	const fileCount = importMode === 'directory' ? dirFiles.length : features.length;

	return (
		<ScrollView>
			{/* ---------- Config ---------- */}
			<List.Subheader>{t('import.importOptions')}</List.Subheader>

			{importMode === 'directory' && (
				<NumericRowControl
					label={t('import.fileLimit')}
					value={fileLimit}
					onUpdate={handleSetFileLimit}
					numType="int"
					validate={validateFileLimit}
					Info={t('import.hint.fileLimit')}
				/>
			)}

			<InfoLabelRow
				backgroundBlur={true}
				label={t('import.titleRegex')}
				Info={hintTitleRegex}
			>
				<TextInput
					dense
					value={titleRegex}
					placeholder="/pattern/"
					maxLength={300}
					onChangeText={handleSetTitleRegex}
					style={localStyles.configInput}
				/>
			</InfoLabelRow>
			{titleRegexWarning && (
				<Text style={[localStyles.configPreview, tertiaryColorStyle]}>
					<Icon
						source="alert"
						size={12}
						color={theme.colors.tertiary}
					/>{' '}
					{t('import.regexExpensive')}
				</Text>
			)}
			{titleRegexPreview && (
				<Text style={[localStyles.configPreview, primaryColorStyle]}>
					{t('import.titlePreview')}: {titleRegexPreview}
				</Text>
			)}

			<InfoLabelRow
				backgroundBlur={true}
				label={t('import.tagMode')}
				Info={t('import.hint.tagMode')}
			>
				<ButtonHighlightMenuControl
					options={tagModeOptions}
					value={tagMode}
					setValue={handleSetTagMode}
					compact
					anchorLabel={tagModeAnchorLabel}
				/>
			</InfoLabelRow>

			{tagMode === 'regex' && (
				<>
					<InfoLabelRow
						backgroundBlur={true}
						label={t('import.tagRegex')}
						Info={hintTagRegex}
					>
						<TextInput
							mode="outlined"
							dense
							value={tagRegex}
							placeholder="/pattern/g"
							maxLength={300}
							onChangeText={handleSetTagRegex}
							style={localStyles.configInput}
						/>
					</InfoLabelRow>
					{tagRegexWarning && (
						<Text style={[localStyles.configPreview, tertiaryColorStyle]}>
							<Icon
								source="alert"
								size={12}
								color={theme.colors.tertiary}
							/>{' '}
							{t('import.regexExpensive')}
						</Text>
					)}
					{tagRegexPreview && (
						<Text style={[localStyles.configPreview, primaryColorStyle]}>
							{t('import.tagPreview')}: {tagRegexPreview}
						</Text>
					)}
				</>
			)}

			{tagMode === 'existing' && allTags && (
				<View style={localStyles.tagSelectList}>
					{allTags.map((tag) => (
						<List.Item
							key={tag.id}
							title={tag.label ?? `#${tag.id}`}
							left={(props) => (
							<Checkbox
								{...props}
								status={
									selectedTagIds.includes(tag.id) ? 'checked' : 'unchecked'
								}
								onPress={() => handleToggleTag(tag.id)}
								/>
							)}
							onPress={() => handleToggleTag(tag.id)}
						/>
					))}
				</View>
			)}

			<ToggleRowControl
				label={t('import.dryRun')}
				value={dryRun}
				onToggle={handleToggleDryRun}
				Info={t('import.hint.dryRun')}
				innerStyle={sharedStyles.alignStart}
			/>

			<ToggleRowControl
				label={t('import.keepAppActive')}
				value={keepAppActive}
				onToggle={handleToggleKeepAppActive}
				Info={t('import.hint.keepAppActive')}
				innerStyle={sharedStyles.alignStart}
			/>

			<DateExtractRowControl />

			<InfoLabelRow
				backgroundBlur={true}
				label={t('import.overwriteMode')}
				Info={overwriteInfoNode}
			>
				<ButtonHighlightMenuControl
					options={overwriteOptions}
					value={overwriteMode}
					setValue={handleSetOverwriteMode}
					compact
					anchorLabel={overwriteAnchorLabel}
				/>
			</InfoLabelRow>

			{/* ---------- Import button ---------- */}
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

			{/* ---------- File / feature list ---------- */}
			<List.Subheader>
				{importMode === 'file'
					? `${filename}  —  ${sprintf(t('import.featureCount'), features.length)}`
					: sprintf(t('import.dirFilesFound'), fileCount)}
			</List.Subheader>

			<View style={localStyles.selectRow}>
				<ButtonHighlight
					{...buttonPropsSelect}
					onPress={importMode === 'file' ? handleSelectAllFeatures : handleSelectAllFiles}
				>
					{t('lines.selectAll')}
				</ButtonHighlight>
				<ButtonHighlight
					{...buttonPropsSelect}
					onPress={
						importMode === 'file' ? handleDeselectAllFeatures : handleDeselectAllFiles
					}
				>
					{t('lines.selectNone')}
				</ButtonHighlight>
			</View>

			{importMode === 'file'
				? features.map((feature, idx) => (
						<List.Item
							key={idx}
							title={feature.properties?.name ?? sprintf(t('import.trackN'), idx + 1)}
							left={(props) => (
								<Checkbox
									{...props}
									status={selectedIndices.has(idx) ? 'checked' : 'unchecked'}
									onPress={() => handleToggleFeature(idx)}
								/>
							)}
							onPress={() => handleToggleFeature(idx)}
						/>
					))
				: dirFiles.map((file) => (
						<List.Item
							key={file.uri}
							title={file.name}
							left={(props) => (
								<Checkbox
									{...props}
									status={
										selectedFileUris.has(file.uri) ? 'checked' : 'unchecked'
									}
									onPress={() => handleToggleFile(file.uri)}
								/>
							)}
							onPress={() => handleToggleFile(file.uri)}
						/>
					))}

			{importMode === 'file' && (
				<List.Item
					title={t('import.mergeMode')}
					left={(props) => (
						<Checkbox
							{...props}
							status={mergeMode ? 'checked' : 'unchecked'}
							onPress={handleToggleMergeMode}
						/>
					)}
					onPress={handleToggleMergeMode}
				/>
			)}

			<View style={localStyles.bottomSpacer} />
		</ScrollView>
	);
};

export default memo(StepPreview);
