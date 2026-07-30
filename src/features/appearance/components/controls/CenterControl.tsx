/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ColorPaletteInline from '../../../../components/generic/controls/ColorPaletteInline';
import { sprintf } from 'sprintf-js';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ListItemModalControl from '../../../../components/generic/wrapper/ListItemModalControl';
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
import FileSourceRowControl from '../../../../components/generic/controls/FileSourceRowControl';
import { CenterInner } from '../../appOverlays/Center';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { initialSettings, setCursor } from '../../slice';
import { selectCursor } from '../../selectors';
import { selectAppDirs } from '../../../dirs/selectors';

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

const validate = (val: number) => val >= 0 && val <= 1000;

const CenterControl = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	const cursorConfig = useAppSelector(selectCursor);

	const dispatch = useAppDispatch();

	const handleSizeUpdate = useCallback(
		(newValue: number) =>
			dispatch(
				setCursor((cursor) => ({
					...cursor,
					size: newValue,
				}))
			),
		[dispatch]
	);

	const handleFileSelect = useCallback(
		(newFileSource?: string) => {
			dispatch(
				setCursor((cursor) => ({
					...cursor,
					iconSource: newFileSource ?? initialSettings.cursor.iconSource,
				}))
			);
		},
		[
			dispatch,
		]
	);

	const handleColorChange = useCallback(
		(newColor: string) => {
			dispatch(
				setCursor((cursor) => ({
					...cursor,
					color: newColor,
				}))
			);
		},
		[
			dispatch,
		]
	);

	return (
		<ListItemModalControl
			anchorLabel={'Cursor'}
			anchorIcon={({ color, style }) => (
				<View style={style}>
					{!cursorConfig?.iconSource && (
						<Icon
							source="target"
							color={color}
							size={25}
						/>
					)}

					{cursorConfig?.iconSource && (
						<CenterInner
							cursor={{
								...cursorConfig,
								size: 25,
								color: theme.colors.onBackground,
							}}
						/>
					)}
				</View>
			)}
			header={t('appearance.cursor')}
		>
			<FileSourceRowControl
				header={t('selectFile')}
				label={t('file')}
				value={cursorConfig.iconSource}
				onSelect={handleFileSelect}
				initialOptionsByPath={initialOptionsByPath}
				extensions={['svg', 'png']}
				dirs={get(appDirs, 'cursor', [])}
				Info={t('appearance.hint.center.file')}
				filesHeading={sprintf(t('filesIn'), '(svg|png)')}
				noFilesHeading={sprintf(t('noFilesIn'), '(svg|png)')}
			/>

			<NumericRowControl
				label={t('sizePx')}
				value={cursorConfig.size}
				onUpdate={handleSizeUpdate}
				validate={validate}
				Info={t('appearance.hint.center.size')}
			/>

			{cursorConfig?.iconSource &&
				!cursorConfig.iconSource.startsWith('/') &&
				!cursorConfig.iconSource.startsWith('content://') && (
					<InfoLabelRow
						label={t('appearance.color')}
						Info={t('appearance.hint.center.color')}
					>
						<ColorPaletteInline
							selectedColor={cursorConfig?.color}
							onSelect={handleColorChange}
						/>
					</InfoLabelRow>
				)}

			<InfoLabelRow
				label={t('appearance.preview')}
				Info={t('appearance.hint.center.preview')}
			>
				<CenterInner cursor={cursorConfig} />
			</InfoLabelRow>
		</ListItemModalControl>
	);
};

export default CenterControl;
