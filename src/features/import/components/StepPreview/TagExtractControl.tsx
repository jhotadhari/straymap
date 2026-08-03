/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { List, Text, Checkbox, TextInput, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTagMode, selectTagRegex } from '../../selectors';
import { setTagMode, setTagRegex } from '../../slice';
import { TagMode } from '../types';
import { useImportContext } from '../ImportContext';
import { classifyRegex } from '../../../../lib/regexUtils';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import HintLink from '../../../../components/generic/primitives/HintLink';
import { queryAllTags } from '../../../lines/db/queryFns';
import { localStyles } from '../styles';
import { sharedStyles } from '../../../../sharedStyles';

const TagExtractControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { importMode, filename, dirFiles, selectedTagIds, setSelectedTagIds } =
		useImportContext();

	const tagMode = useAppSelector(selectTagMode);
	const tagRegex = useAppSelector(selectTagRegex);

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

	const [debouncedTagRegex, setDebouncedTagRegex] = useState(tagRegex);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedTagRegex(tagRegex), 300);
		return () => clearTimeout(timer);
	}, [tagRegex]);

	const { data: allTags } = useQuery({
		queryKey: ['tags'],
		queryFn: queryAllTags,
		enabled: tagMode === 'existing',
		staleTime: 0,
	});

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
	}, [debouncedTagRegex, tagMode, importMode, filename, dirFiles, t]);

	const tagRegexWarning = useMemo(() => {
		if (!tagRegex) return false;
		return classifyRegex(tagRegex).dangerous;
	}, [tagRegex]);

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

	const handleToggleTag = useCallback(
		(tagId: number) =>
			setSelectedTagIds((prev) =>
				prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
			),
		[setSelectedTagIds]
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

	return (
		<>
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
						<Text style={localStyles.configPreview}>
							<Icon
								source="alert"
								size={12}
							/>{' '}
							{t('import.regexExpensive')}
						</Text>
					)}
					{tagRegexPreview && (
						<Text style={localStyles.configPreview}>
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
		</>
	);
};

export default memo(TagExtractControl);
