/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ColorPicker from 'react-native-wheel-color-picker';
import { sprintf } from 'sprintf-js';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ListItemModalControl from '../../../../../components/generic/controls/ListItemModalControl';
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import FileSourceRowControl from '../../../../../components/generic/controls/FileSourceRowControl';
import { CenterInner } from '../Center';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { initialSettings, setCursor } from '../../slice';
import { selectCursor } from '../../selectors';
import { CursorConfig } from '../../types';
import { selectAppDirs } from '../../../dirs/selectors';

const initialOptsMap = {
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

	const updateCursor = useCallback((options: CursorConfig) => dispatch(setCursor(options)), []);

	const handleSizeUpdate = useCallback(
		(newValue: number) =>
			dispatch(
				setCursor((cursor) => ({
					...cursor,
					size: newValue,
				}))
			),
		[]
	);

	const handleFileSelect = useCallback((newFileSource?: string) => {
		dispatch(
			setCursor((cursor) => ({
				...cursor,
				iconSource: newFileSource ?? initialSettings.cursor.iconSource,
			}))
		);
	}, []);

	const handleColorChange = useCallback((newColor: string) => {
		dispatch(
			setCursor((cursor) => ({
				...cursor,
				color: newColor,
			}))
		);
	}, []);

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
			hasHeaderBackPress={true}
		>
			<FileSourceRowControl
				header={t('selectFile')}
				label={t('file')}
				value={cursorConfig.iconSource}
				onSelect={handleFileSelect}
				initialOptsMap={initialOptsMap}
				extensions={['svg', 'png']}
				dirs={get(appDirs, 'cursor', [])}
				Info={t('appearance.hint.center.file')}
				filesHeading={sprintf(t('filesIn'), '(svg|png)')}
				noFilesHeading={sprintf(t('noFilesIn'), '(svg|png)')}
				hasCustom={true}
			/>

			<NumericRowControl
				label={t('sizePx')}
				value={cursorConfig.size}
				onUpdate={handleSizeUpdate}
				validate={validate}
			/>

			{cursorConfig?.iconSource &&
				!cursorConfig.iconSource.startsWith('/') &&
				!cursorConfig.iconSource.startsWith('content://') && (
					<InfoRowControl label={t('appearance.color')}>
						<ColorPicker
							color={cursorConfig?.color}
							onColorChange={handleColorChange}
						/>
					</InfoRowControl>
				)}

			<InfoRowControl label={t('appearance.preview')}>
				<CenterInner cursor={cursorConfig} />
			</InfoRowControl>
		</ListItemModalControl>
	);
};

export default CenterControl;
