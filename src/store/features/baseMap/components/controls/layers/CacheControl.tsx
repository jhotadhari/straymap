/**
 * External dependencies
 */
import { useCallback, useEffect, useMemo } from 'react';
import { get } from 'lodash-es';
import { View, TextInputProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextInput, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import NumericRowControl from '../../../../../../components/generic/controls/NumericRowControl';
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
import ListItemMenuControl from '../../../../../../components/generic/controls/ListItemMenuControl';
import { OptionBase } from '../../../../../../types';
import { TextInputNativeMultilineControlled } from '../../../../../../components/generic/TextInputNativeMultiline';
import { useAppSelector } from '../../../../../hooks';
import { selectAppDirs } from '../../../../dirs/selectors';
import { sharedStyles } from '../../../../../../sharedStyles';

const renderTextInput = (props: TextInputProps) => (
	<TextInputNativeMultilineControlled {...props} />
);

const validateCacheSize = (val: number) => val >= 0;

const CacheControl = ({
	options,
	setOptions,
	baseDefault,
	cacheDirChild,
}: {
	options: {
		cacheSize?: number;
	};
	setOptions: (options: any) => void;
	baseDefault: string;
	cacheDirChild: string;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const appDirs = useAppSelector(selectAppDirs);

	const externalCacheDir = useMemo(
		() => get(appDirs, ['externalCacheDirs', 0], undefined),
		[appDirs]
	);

	const opts = useMemo(
		() =>
			[
				{
					key: 'internal',
					label: t('internal'),
				},
				...(externalCacheDir && externalCacheDir.length > 0
					? [
							{
								key: externalCacheDir,
								label: t('external'),
							},
						]
					: []),
				...get(appDirs, 'externalCacheDirs', [])
					.map((dir, idx) =>
						externalCacheDir && dir === externalCacheDir
							? false
							: {
									key: dir,
									label: t('external') + ' ' + idx,
								}
					)
					.filter((a) => !!a),
			] as OptionBase[],
		[
			appDirs,
			externalCacheDir,
			t,
		]
	);

	const selectedOpt = opts.find((opt) => opt.key === get(options, 'cacheDirBase'));

	// Reset to default if option is gone.
	useEffect(() => {
		if (appDirs && !selectedOpt) {
			setOptions({
				...options,
				cacheDirBase: baseDefault,
			});
		}
	}, [selectedOpt, appDirs]);

	const cachePath = useMemo(
		() =>
			('internal' === get(selectedOpt, 'key')
				? get(appDirs, ['internalCacheDirs', 0], '')
				: get(selectedOpt, 'key')) +
			'/' +
			cacheDirChild,
		[selectedOpt, appDirs]
	);

	const handleCacheSizeUpdate = useCallback(
		(newValue: number) => {
			setOptions({
				...options,
				cacheSize: newValue,
			});
		},
		[options, setOptions]
	);

	const handleCacheDirBaseChange = useCallback(
		(newValue: string) => {
			setOptions({
				...options,
				cacheDirBase: newValue,
			});
		},
		[options, setOptions]
	);

	const textInputTheme = useMemo(
		() => ({
			fonts: {
				bodyLarge: {
					...theme.fonts.bodySmall,
					fontFamily: 'sans-serif',
				},
			},
		}),
		[theme]
	);

	if (!appDirs) {
		return null;
	}

	return (
		<View style={styles.gap}>
			<NumericRowControl
				label={t('baseMap.cacheSize')}
				onUpdate={handleCacheSizeUpdate}
				value={options?.cacheSize ?? 0}
				validate={validateCacheSize}
				Info={t('baseMap.hint.cache') + '\n\n' + t('baseMap.hint.cacheSize')}
			/>

			<View>
				<InfoRowControl
					label={t('baseMap.cacheDir')}
					Info={t('baseMap.hint.cache') + '\n\n' + t('baseMap.hint.cacheDir')}
				>
					<ListItemMenuControl
						options={opts}
						listItemStyle={sharedStyles.listItem}
						value={get(selectedOpt, 'key')}
						setValue={handleCacheDirBaseChange}
						anchorLabel={get(selectedOpt, 'label', '')}
					/>
				</InfoRowControl>

				<TextInput
					disabled={true}
					multiline={true}
					render={renderTextInput}
					dense={true}
					theme={textInputTheme}
					style={styles.textInput}
					value={cachePath}
				/>
			</View>

			{/* ??? cache size info and clear btn */}
		</View>
	);
};

const styles = StyleSheet.create({
	gap: {
		gap: 24,
	},
	textInput: {
		width: '100%',
		marginTop: -18,
	},
});

export default CacheControl;
