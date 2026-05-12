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
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControls';
import FileSourceRowControl from '../../../../../components/generic/controls/FileSourceRowControl';
import { CenterInner } from '../Center';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setCursor } from '../../appearanceSlice';
import { selectCursor } from '../../selectors';
import { CursorConfig } from '../../types';
import { selectAppDirs } from '../../../dirs/selectors';

const ColorRowControl = ({
	cursorConfig,
	setOptions,
}: {
	cursorConfig: CursorConfig;
	setOptions: (options: any) => void;
}) => {
	const { t } = useTranslation();

	const handleChange = useCallback(
		(newColor: string) => {
			setOptions({
				...cursorConfig,
				color: newColor,
			});
		},
		[cursorConfig]
	);

	return (
		<InfoRowControl label={t('color')}>
			<ColorPicker
				color={cursorConfig?.color}
				onColorChange={handleChange}
			/>
		</InfoRowControl>
	);
};

const initialOptsMap = {
	[' ']: [
		{
			key: 'target',
			label: 'target',
		},
		{
			key: 'target-variant',
			label: 'target-variant',
		},
	],
};

const CenterControl = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	const cursorConfig = useAppSelector(selectCursor);

	const dispatch = useAppDispatch();

	const updateCursor = useCallback((options: CursorConfig) => dispatch(setCursor(options)), []);

	const handleFileSelect = useCallback(
		(newFileSource: string) =>
			updateCursor({
				...(cursorConfig as CursorConfig),
				iconSource: newFileSource,
			}),
		[cursorConfig]
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
			header={t('cursor')}
			hasHeaderBackPress={true}
		>
			<FileSourceRowControl
				header={t('selectFile')}
				label={t('file')}
				options={cursorConfig as object}
				optionsKey={'iconSource'}
				onSelect={handleFileSelect}
				initialOptsMap={initialOptsMap}
				extensions={['svg', 'png']}
				dirs={get(appDirs, 'cursor', [])}
				Info={t('hint.center.file')}
				filesHeading={sprintf(t('filesIn'), '(svg|png)')}
				noFilesHeading={sprintf(t('noFilesIn'), '(svg|png)')}
				hasCustom={true}
			/>

			<NumericRowControl
				label={t('size [px]')}
				optKey={'size'}
				options={cursorConfig as object}
				setOptions={updateCursor}
				validate={(val) => val >= 0}
			/>

			{cursorConfig?.iconSource &&
				!cursorConfig.iconSource.startsWith('/') &&
				!cursorConfig.iconSource.startsWith('content://') && (
					<ColorRowControl
						cursorConfig={cursorConfig}
						setOptions={updateCursor}
					/>
				)}

			<InfoRowControl label={t('preview')}>
				<CenterInner cursor={cursorConfig} />
			</InfoRowControl>
		</ListItemModalControl>
	);
};

export default CenterControl;
