/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import LoadingIndicator from '../../../../components/generic/primitives/LoadingIndicator';
import TagBadge from '../../../lines/components/TagBadge';
import CreateTagModal from '../../../lines/components/CreateTagModal';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTagMode, selectTagRegexes } from '../../selectors';
import { setTagMode, addTagRegex, removeTagRegex, setTagRegexes } from '../../slice';
import { TagMode } from '../types';
import { useImportContext } from '../ImportContext';
import { classifyRegex, getRegexWarnings } from '../../../../lib/regexUtils';
import { queryAllTags, invalidateTagsTable } from '../../../lines/db/queryFns';
import { featureRegistry } from '../../../FeatureRegistry';
import { Tag } from '../../../lines/types';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { sharedStyles } from '../../../../sharedStyles';
import { localStyles } from '../styles';

const TagExtractModal: FC<{ visible: boolean; onDismiss: () => void }> = ({
	visible,
	onDismiss,
}) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const queryClient = useQueryClient();
	const { importMode, filename, dirFiles, selectedTagIds, setSelectedTagIds } =
		useImportContext();

	const tagMode = useAppSelector(selectTagMode);
	const tagRegexes = useAppSelector(selectTagRegexes);

	const buttonProps = useButtonProps({ style: styles.createTagBtn });

	const handleSetTagMode = useCallback(
		(v: string) => {
			dispatch(setTagMode(v as TagMode));
		},
		[dispatch]
	);

	// -- tag list state --
	const [allTags, setAllTags] = useState<Tag[]>([]);
	const [loadingTags, setLoadingTags] = useState(false);
	const [createModalVisible, setCreateModalVisible] = useState(false);

	const systemTagLabels = useMemo(() => featureRegistry.getSystemTagLabels(), []);

	const refreshAvailableTags = useCallback(async () => {
		const result = await queryAllTags();
		setAllTags(result);
	}, []);

	const loadTags = useCallback(async () => {
		setLoadingTags(true);
		try {
			await refreshAvailableTags();
		} catch {
			// silently ignore
		} finally {
			setLoadingTags(false);
		}
	}, [refreshAvailableTags]);

	const tagsLoadedRef = useRef(false);
	useEffect(() => {
		if (visible && tagMode === 'existing' && !tagsLoadedRef.current) {
			loadTags();
			tagsLoadedRef.current = true;
		}
		if (tagMode !== 'existing') {
			tagsLoadedRef.current = false;
		}
	}, [
		visible,
		tagMode,
		loadTags,
	]);

	const handleToggleTag = useCallback(
		(tagId: number) =>
			setSelectedTagIds((prev) =>
				prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
			),
		[setSelectedTagIds]
	);

	const handleTagCreated = useCallback(
		async (tag: Tag) => {
			await queryClient.invalidateQueries({ queryKey: ['tags'] });
			invalidateTagsTable(queryClient);
			await refreshAvailableTags();
			setSelectedTagIds((prev) => [...prev, tag.id]);
		},
		[
			queryClient,
			refreshAvailableTags,
			setSelectedTagIds,
		]
	);

	// -- regex state --
	const [localRegexes, setLocalRegexes] = useState<string[]>(tagRegexes);
	const debounceRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
	const tagRegexesRef = useRef(tagRegexes);
	tagRegexesRef.current = tagRegexes;

	const tagRegexesLenRef = useRef(tagRegexes.length);

	useEffect(() => {
		if (tagRegexes.length !== tagRegexesLenRef.current) {
			tagRegexesLenRef.current = tagRegexes.length;
			setLocalRegexes(tagRegexes);
		}
	}, [tagRegexes]);

	useEffect(() => {
		const ref = debounceRef.current;
		return () => Object.values(ref).forEach(clearTimeout);
	}, []);

	const handleChangeRegex = useCallback(
		(idx: number, value: string) => {
			setLocalRegexes((prev) => {
				const next = [...prev];
				next[idx] = value;
				return next;
			});
			if (debounceRef.current[idx]) clearTimeout(debounceRef.current[idx]);
			debounceRef.current[idx] = setTimeout(() => {
				const updated = [...tagRegexesRef.current];
				updated[idx] = value;
				dispatch(setTagRegexes(updated));
			}, 300);
		},
		[dispatch]
	);

	const handleAddRegex = useCallback(() => {
		dispatch(addTagRegex(''));
	}, [dispatch]);

	const handleRemoveRegex = useCallback(
		(idx: number) => {
			if (debounceRef.current[idx]) {
				clearTimeout(debounceRef.current[idx]);
				delete debounceRef.current[idx];
			}
			dispatch(removeTagRegex(idx));
		},
		[dispatch]
	);

	// -- regex previews --
	const sampleName = useMemo(
		() => (importMode === 'file' ? filename : (dirFiles[0]?.name ?? '')),
		[
			importMode,
			filename,
			dirFiles,
		]
	);

	const tagModeOptions = useMemo(
		() => [
			{ key: 'none', label: t('import.tagNone') },
			{ key: 'existing', label: t('import.tagExisting') },
			{ key: 'regex', label: t('import.tagRegex') },
		],
		[t]
	);

	const tagModeAnchorLabel = useMemo(
		() => tagModeOptions.find((o) => o.key === tagMode)?.label ?? '',
		[tagModeOptions, tagMode]
	);

	const getRegexWarning = useCallback(
		(pattern: string): { message: string; isError: boolean } | null => {
			const msg = getRegexWarnings(pattern, {
				checkCaptureGroup: true,
				checkEmptyCaptureGroup: true,
			});
			if (!msg) return null;
			return { message: t(msg.key), isError: msg.isError };
		},
		[t]
	);
	const getRegexPreview = useCallback(
		(pattern: string): string | null => {
			if (!pattern || !sampleName || !classifyRegex(pattern).valid) return null;
			try {
				const re = new RegExp(pattern, 'g');
				const labels: string[] = [];
				let match;
				while ((match = re.exec(sampleName)) !== null) {
					if (match[0] === '') { re.lastIndex++; continue; }
					labels.push(match[1] ?? match[0]);
				}
				return labels.length ? labels.join(', ') : null;
			} catch {
				return null;
			}
		},
		[sampleName]
	);

	const handleDismiss = useCallback(() => {
		// flush any pending debounced regexes
		Object.values(debounceRef.current).forEach(clearTimeout);
		dispatch(setTagRegexes(localRegexes));
		onDismiss();
	}, [
		localRegexes,
		dispatch,
		onDismiss,
	]);

	const styleRegexWarning = useMemo(
		() => [localStyles.configPreview, { color: theme.colors.error }],
		[theme]
	);

	return (
		<>
			<ModalWrapper
				visible={visible}
				onDismiss={handleDismiss}
				headerLabel={t('import.tagMode')}
				innerStyle={styles.modalInner}
			>
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

				{tagMode === 'none' && <Text>{t('import.tagModeNoneText')}</Text>}

				{tagMode === 'existing' && (
					<View style={styles.tagList}>
						<Divider style={styles.divider} />

						<ButtonHighlight
							{...buttonProps}
							icon="tag-plus-outline"
							onPress={() => setCreateModalVisible(true)}
						>
							{t('lines.tagsCreate')}
						</ButtonHighlight>

						{loadingTags ? (
							<LoadingIndicator />
						) : allTags.length === 0 ? (
							<Text>{t('lines.tagsNoTags')}</Text>
						) : (
							allTags.map((tag) => {
								const isSystemTag = systemTagLabels.includes(tag.label ?? '');
								const isImported = tag.label === 'imported';
								const isChecked = isImported || selectedTagIds.includes(tag.id);
								return (
									<ToggleRowControl
										key={tag.id}
										label={tag.label ?? ''}
										labelNode={<TagBadge tag={tag} />}
										value={isChecked}
										onToggle={
											isSystemTag ? () => {} : () => handleToggleTag(tag.id)
										}
										disabled={isSystemTag}
									/>
								);
							})
						)}
					</View>
				)}

				{tagMode === 'regex' && (
					<View style={styles.regexList}>
						<Divider style={styles.divider} />

						<Text>{t('import.tagModeRegexText')}</Text>

						{localRegexes.map((pattern, idx) => {
							const preview = getRegexPreview(pattern);
							const warning = getRegexWarning(pattern);
							return (
								<View key={idx}>
									<View style={sharedStyles.flexRowCenter}>
										<TextInput
											underlineColor="transparent"
											dense
											error={!!warning}
											value={pattern}
											placeholder="(\w+)"
											maxLength={300}
											onChangeText={(v) => handleChangeRegex(idx, v)}
											style={sharedStyles.flex1}
										/>
										<View style={styles.regexDelete}>
											<IconButtonHighlight
												icon="delete-outline"
												onPress={() => handleRemoveRegex(idx)}
												size={20}
											/>
										</View>
									</View>
									{warning && (
										<Text
											style={
												warning.isError
													? styleRegexWarning
													: localStyles.configPreview
											}
										>
											{warning.message}
										</Text>
									)}
									{preview && (
										<Text style={localStyles.configPreview}>
											{t('import.titlePreview')}: {preview}
										</Text>
									)}
								</View>
							);
						})}
						<View style={sharedStyles.modalControlsEnd}>
							<ButtonHighlight
								{...buttonProps}
								icon="plus"
								onPress={handleAddRegex}
							>
								{t('import.addTagRegex')}
							</ButtonHighlight>
						</View>
					</View>
				)}
			</ModalWrapper>

			<CreateTagModal
				visible={createModalVisible}
				onDismiss={() => setCreateModalVisible(false)}
				onCreated={handleTagCreated}
			/>
		</>
	);
};

export default memo(TagExtractModal);

const styles = StyleSheet.create({
	modalInner: { gap: 16, marginTop: 16 },
	tagList: { gap: 16 },
	regexList: {
		gap: 16,
	},
	divider: { marginTop: 16 },
	createTagBtn: { marginVertical: 16 },
	regexDelete: {
		marginRight: -8,
		marginVertical: -4,
	},
});
