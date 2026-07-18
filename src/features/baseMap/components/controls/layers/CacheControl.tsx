/**
 * External dependencies
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { get } from 'lodash-es';
import { View, TextInputProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import ToggleRowControl from '../../../../../components/generic/controls/ToggleRowControl';
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ListItemMenuControl from '../../../../../components/generic/wrapper/ListItemMenuControl';
import { OptionBase } from '../../../../../types';
import { TextInputNativeMultilineControlled } from '../../../../../components/generic/primitives/TextInputNativeMultiline';
import { useAppSelector } from '../../../../../store/hooks';
import { selectAppDirs } from '../../../../dirs/selectors';
import { sharedStyles } from '../../../../../sharedStyles';
import ButtonHighlight from '../../../../../components/generic/primitives/ButtonHighlight';
import { FsModule } from '../../../../../nativeModules';
import { resolveCacheDirBase } from '../../../utils';
import { CacheDir } from '../../../../dirs/types';
import { logError } from '../../../../../lib/utils';

const renderTextInput = (props: TextInputProps) => (
	<TextInputNativeMultilineControlled {...props} />
);

const validateCacheSize = (val: number) => val >= 0;

const CacheControl = ({
	options,
	setOptions,
	baseDefault,
	cacheDirChild,
	treatAsBoolean = false,
}: {
	options: {
		cacheSize?: number;
	};
	setOptions: (options: any) => void;
	baseDefault: string;
	cacheDirChild: string;
	treatAsBoolean?: false | number;
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

	// Keep options and setOptions in refs so the effect below doesn't loop
	// when the parent selector returns a new options reference each render.
	const optionsRef = useRef(options);
	optionsRef.current = options;
	const setOptionsRef = useRef(setOptions);
	setOptionsRef.current = setOptions;

	// Reset to default if option is gone.
	useEffect(() => {
		if (appDirs && !selectedOpt) {
			setOptionsRef.current({
				...optionsRef.current,
				cacheDirBase: baseDefault,
			});
		}
	}, [
		selectedOpt,
		appDirs,
		baseDefault,
	]);

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
			cacheDirChild,
		]
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

	const handleUseCacheToggle = useCallback(() => {
		const currentSize = options?.cacheSize ?? 0;
		setOptions({
			...options,
			cacheSize: currentSize > 0 ? 0 : (treatAsBoolean as number),
		});
	}, [
		options,
		setOptions,
		treatAsBoolean,
	]);

	const [cacheCurrentFormatted, setCacheCurrentFormatted] = useState<string>('');

	const resolvedBaseDir = useMemo(
		() =>
			resolveCacheDirBase(
				get(options, 'cacheDirBase'),
				get(appDirs, ['internalCacheDirs', 0], undefined)
			),
		[options, appDirs]
	);

	const mountedRef = useRef(true);
	useEffect(() => {
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const updateCacheInfo = useCallback(() => {
		FsModule.getCacheInfo()
			.then((cacheDirs) => {
				if (!mountedRef.current) return;
				const dirs = cacheDirs as CacheDir[];
				const dir = dirs.find((d) => d.path === resolvedBaseDir);
				const cache = dir?.caches?.find((c) => c.basename === cacheDirChild);
				setCacheCurrentFormatted(cache?.readableSize ?? '');
			})
			.catch((err) => {
				if (!mountedRef.current) return;
				logError('CacheControl.updateCacheInfo', err);
				setCacheCurrentFormatted('');
			});
	}, [resolvedBaseDir, cacheDirChild]);

	useEffect(() => {
		if ((options?.cacheSize ?? 0) > 0 && appDirs) {
			updateCacheInfo();
		}
	}, [
		updateCacheInfo,
		options?.cacheSize,
		appDirs,
	]);

	const handleClearCache = useCallback(() => {
		FsModule.deleteDir(cachePath)
			.then(() => {
				updateCacheInfo();
			})
			.catch((err) => {
				logError('CacheControl.handleClearCache', err);
				updateCacheInfo();
			});
	}, [cachePath, updateCacheInfo]);

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
			{treatAsBoolean !== false ? (
				<ToggleRowControl
					label={t('baseMap.useCache')}
					value={(options?.cacheSize ?? 0) > 0}
					onToggle={handleUseCacheToggle}
					innerStyle={sharedStyles.alignStart}
					Info={t('baseMap.hint.cache') + '\n\n' + t('baseMap.hint.cacheSize')}
				/>
			) : (
				<NumericRowControl
					label={t('baseMap.cacheSize')}
					onUpdate={handleCacheSizeUpdate}
					value={options?.cacheSize ?? 0}
					validate={validateCacheSize}
					Info={t('baseMap.hint.cache') + '\n\n' + t('baseMap.hint.cacheSize')}
				/>
			)}

			{(options?.cacheSize ?? 0) > 0 && (
				<View>
					<InfoLabelRow
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
					</InfoLabelRow>

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
			)}

			<InfoLabelRow
				label={t('baseMap.cacheSizeCurrent')}
				innerStyle={styles.clearRowInner}
			>
				<Text>{cacheCurrentFormatted || '0 KB'}</Text>

				<ButtonHighlight
					mode="outlined"
					compact={true}
					disabled={!cacheCurrentFormatted}
					onPress={handleClearCache}
				>
					{t('baseMap.cacheClear')}
				</ButtonHighlight>
			</InfoLabelRow>
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
	clearRowInner: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingLeft: 8,
	},
});

export default CacheControl;
