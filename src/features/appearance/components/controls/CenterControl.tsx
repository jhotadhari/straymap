/**
 * External dependencies
 */
import React, { useCallback, useMemo } from 'react';
import { Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import MarkerControl from '../../../../components/generic/controls/MarkerControl';
import { CenterInner } from '../../appOverlays/Center';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { initialSettings, setCursor } from '../../slice';
import { selectCursor } from '../../selectors';
import { selectAppDirs } from '../../../dirs/selectors';
import { EMPTY_STRING_ARRAY } from '../../../../constants';

const CURSOR_ICON_EXTENSIONS = ['svg', 'png'];

const initialOptionsByPath = {
	[' ']: [
		{
			key: 'target',
			label: 'appearance.target',
		},
		{
			key: 'target-variant',
			label: 'appearance.target-variant',
		},
	],
};

/** Renders the cursor config — falls back to the `target` glyph when no
 * source is set (matches the anchor-row fallback icon). */
const CursorPreview = ({
	config,
}: {
	config: { iconSource: string; size: number; color: string };
}) =>
	!config.iconSource ? (
		<Icon
			source="target"
			color={config.color}
			size={config.size}
		/>
	) : (
		<CenterInner cursor={config} />
	);

const CenterControl = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);
	const cursorConfig = useAppSelector(selectCursor);
	const dispatch = useAppDispatch();

	const handleUpdate = useCallback(
		(partial: Partial<{ iconSource: string; size: number; color: string }>) => {
			dispatch(setCursor((cursor) => ({ ...cursor, ...partial })));
		},
		[dispatch]
	);

	const anchorPreviewConfig = useMemo(
		() => ({
			...cursorConfig,
			size: 25,
			color: theme.colors.onBackground,
		}),
		[cursorConfig, theme.colors.onBackground]
	);

	return (
		<MarkerControl
			anchorLabel={'Cursor'}
			header={t('appearance.cursor')}
			config={cursorConfig}
			onUpdate={handleUpdate}
			defaultIconSource={initialSettings.cursor.iconSource}
			initialOptionsByPath={initialOptionsByPath}
			extensions={CURSOR_ICON_EXTENSIONS}
			dirs={appDirs?.cursor ?? EMPTY_STRING_ARRAY}
			PreviewComponent={CursorPreview}
			anchorPreviewConfig={anchorPreviewConfig}
			hintFile={t('appearance.hint.center.file')}
			hintSize={t('appearance.hint.center.size')}
			hintColor={t('appearance.hint.center.color')}
			hintPreview={t('appearance.hint.center.preview')}
			fileRowHeader={t('selectFile')}
			fileRowLabel={t('file')}
			filesHeading={sprintf(t('filesIn'), '(svg|png)')}
			noFilesHeading={sprintf(t('noFilesIn'), '(svg|png)')}
			sizeLabel={t('sizePx')}
			colorLabel={t('appearance.color')}
			previewLabel={t('appearance.preview')}
		/>
	);
};

export default CenterControl;
