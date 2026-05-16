/**
 * External dependencies
 */
import { useEffect, useMemo } from 'react';
import { get } from 'lodash-es';
import { View, TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextInput, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { NumericRowControl } from '../../../../../../components/generic/controls/NumericRowControls';
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
import ListItemMenuControl from '../../../../../../components/generic/controls/ListItemMenuControl';
import { OptionBase } from '../../../../../../types';
import { TextInputNativeMultilineControlled } from '../../../../../../components/generic/TextInputNativeMultiline';
import { useAppSelector } from '../../../../../hooks';
import { selectAppDirs } from '../../../../dirs/selectors';

const CacheControl = ({
	options,
	setOptions,
	baseDefault,
	cacheDirChild,
}: {
	options: object;
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
	}, [
		selectedOpt,
		appDirs,
	]);

	if (!appDirs) {
		return null;
	}

	const cachePath = useMemo(
		() =>
			('internal' === get(selectedOpt, 'key')
				? get(appDirs, ['internalCacheDirs', 0], '')
				: get(selectedOpt, 'key')) +
			'/' +
			cacheDirChild,
		[
			selectedOpt,
			appDirs,
		]
	);

	return (
		<View>
			<NumericRowControl
				label={t('baseMap.cacheSize')}
				optKey={'cacheSize'}
				options={options}
				setOptions={setOptions}
				validate={(val) => val >= 0}
				Info={t('baseMap.hint.cache') + '\n\n' + t('baseMap.hint.cacheSize')}
			/>

			<InfoRowControl
				label={t('baseMap.cacheDir')}
				Info={t('baseMap.hint.cache') + '\n\n' + t('baseMap.hint.cacheDir')}
			>
				<ListItemMenuControl
					options={opts}
					listItemStyle={{
						marginLeft: 0,
						paddingLeft: 10,
					}}
					value={get(selectedOpt, 'key')}
					setValue={(newValue) =>
						setOptions({
							...options,
							cacheDirBase: newValue,
						})
					}
					anchorLabel={get(selectedOpt, 'label', '')}
				/>
			</InfoRowControl>

			<TextInput
				disabled={true}
				multiline={true}
				render={(props: TextInputProps) => (
					<TextInputNativeMultilineControlled {...props} />
				)}
				dense={true}
				theme={{
					fonts: {
						bodyLarge: {
							...theme.fonts.bodySmall,
							fontFamily: 'sans-serif',
						},
					},
				}}
				style={{
					width: '100%',
					marginTop: -18,
					marginBottom: 10,
				}}
				value={cachePath}
			/>

			{/* ??? cache size info and clear btn */}
		</View>
	);
};

export default CacheControl;
