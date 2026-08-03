/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTitleMode, selectTitleRegex } from '../../selectors';
import { setTitleMode, setTitleRegex } from '../../slice';
import { TitleMode } from '../types';
import { useImportContext } from '../ImportContext';
import { classifyRegex } from '../../../../lib/regexUtils';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import HintLink from '../../../../components/generic/primitives/HintLink';
import { localStyles } from '../styles';
import { sharedStyles } from '../../../../sharedStyles';

const TitleExtractControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { importMode, filename, dirFiles, features } = useImportContext();

	const titleMode = useAppSelector(selectTitleMode);
	const titleRegex = useAppSelector(selectTitleRegex);

	const handleSetTitleMode = useCallback(
		(v: string) => {
			dispatch(setTitleMode(v as TitleMode));
		},
		[dispatch]
	);

	const handleSetTitleRegex = useCallback(
		(v: string) => {
			dispatch(setTitleRegex(v));
		},
		[dispatch]
	);

	const [debouncedTitleRegex, setDebouncedTitleRegex] = useState(titleRegex);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedTitleRegex(titleRegex), 300);
		return () => clearTimeout(timer);
	}, [titleRegex]);

	const titleRegexPreview = useMemo(() => {
		if (titleMode !== 'regex') return null;
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
	}, [debouncedTitleRegex, importMode, filename, dirFiles, t, titleMode]);

	const titleRegexWarning = useMemo(() => {
		if (!titleRegex || titleMode !== 'regex') return false;
		return classifyRegex(titleRegex).dangerous;
	}, [titleRegex, titleMode]);

	const titlePreview = useMemo(() => {
		const sample = importMode === 'file' ? filename : (dirFiles[0]?.name ?? '');
		if (!sample) return null;
		switch (titleMode) {
			case 'none':
				return null;
			case 'filenameWithoutExt':
				return sample.replace(/\.[^.]+$/, '');
			case 'filenameWithExt':
				return sample;
			case 'nameProperty': {
				if (importMode === 'file') {
					const first = features[0];
					if (first?.properties?.name) return first.properties.name;
				}
				return null;
			}
			case 'regex':
				return titleRegexPreview ?? null;
		}
	}, [titleMode, titleRegexPreview, importMode, filename, dirFiles, features]);

	const titleModeOptions = useMemo(
		() => [
			{ key: 'none', label: t('import.titleModeNone') },
			{ key: 'filenameWithoutExt', label: t('import.titleModeFilenameWithoutExt') },
			{ key: 'filenameWithExt', label: t('import.titleModeFilenameWithExt') },
			{ key: 'nameProperty', label: t('import.titleModeNameProperty') },
			{ key: 'regex', label: t('import.titleModeRegex') },
		],
		[t]
	);

	const titleModeAnchorLabel = useMemo(
		() => titleModeOptions.find((o) => o.key === titleMode)?.label ?? '',
		[titleModeOptions, titleMode]
	);

	const hintTitleMode = useMemo(
		() => (
			<View style={sharedStyles.gap}>
				{t('import.hint.titleMode')
					.split('\n\n')
					.map((str, idx) => (
						<Text key={idx}>{str}</Text>
					))}
			</View>
		),
		[t]
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

	return (
		<>
			<InfoLabelRow
				backgroundBlur={true}
				label={t('import.titleMode')}
				Info={hintTitleMode}
			>
				<ButtonHighlightMenuControl
					options={titleModeOptions}
					value={titleMode}
					setValue={handleSetTitleMode}
					compact
					anchorLabel={titleModeAnchorLabel}
				/>
			</InfoLabelRow>

			{titleMode === 'regex' && (
				<>
					<InfoLabelRow
						backgroundBlur={true}
						label={t('import.titleRegex')}
						Info={hintTitleRegex}
					>
						<TextInput
							dense
							value={titleRegex}
							placeholder="^(\\d{8})_"
							maxLength={300}
							onChangeText={handleSetTitleRegex}
							style={localStyles.configInput}
						/>
					</InfoLabelRow>
					{titleRegexWarning && (
						<Text style={localStyles.configPreview}>
							<Icon
								source="alert"
								size={12}
							/>{' '}
							{t('import.regexExpensive')}
						</Text>
					)}
					{titleRegexPreview && (
						<Text style={localStyles.configPreview}>
							{t('import.titlePreview')}: {titleRegexPreview}
						</Text>
					)}
				</>
			)}

			{titlePreview && titleMode !== 'regex' && (
				<Text style={localStyles.configPreview}>
					{t('import.titlePreview')}: {titlePreview}
				</Text>
			)}
		</>
	);
};

export default memo(TitleExtractControl);
