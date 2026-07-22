/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import LucideIcons from '@react-native-vector-icons/lucide/static';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectAppDirs } from '../../../dirs/selectors';
import { selectDbPath } from '../../selectors';
import { dbExtension } from '../../constants';
import useDirsInfo from '../../../dirs/hooks/useDirsInfo';
import { getDirInfoCacheId } from '../../../dirs/utils';
import { addDirInfoCacheEntry } from '../../../dirs/slice';
import { NavChild, DirInfoMap } from '../../../dirs/types';
import { FsModule } from '../../../../nativeModules';
import LoadingIndicator from '../../../../components/generic/primitives/LoadingIndicator';
import { logError } from '../../../../lib/utils';
import { styles } from './sharedDeps';
import RowDatabaseFile from './RowDatabaseFile';
import RowCreateNew from './RowCreateNew';
import Badge from '../../../../components/generic/primitives/Badge';

const extensions = [dbExtension];

const isScopedStorage = Platform.OS === 'android' && (Platform.Version as number) >= 30;

const DatabaseFileList: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const appDirs = useAppSelector(selectAppDirs);
	const dbPath = useAppSelector(selectDbPath);

	const navDirs = useMemo(() => appDirs.databases ?? [], [appDirs.databases]);

	console.log('debug navDirs', navDirs); // debug
	console.log('debug appDirs', appDirs); // debug

	const { dirsInfo, isLoading } = useDirsInfo({
		navDirs,
		extensions,
		recursive: true,
	});

	const dirInfoCacheId = useMemo(
		() =>
			getDirInfoCacheId({
				navDirs,
				extensions,
				recursive: true,
			}),
		[navDirs]
	);

	const invalidateCache = useCallback(async () => {
		try {
			const results = await Promise.all(
				navDirs.map((navDir) => FsModule.getInfo(navDir, extensions, true))
			);
			let newInfos: DirInfoMap = {};
			navDirs.forEach((navDir, i) => {
				if (results[i]) {
					newInfos[navDir] = results[i] as any;
				}
			});
			dispatch(addDirInfoCacheEntry({ id: dirInfoCacheId, entry: newInfos }));
		} catch (err: any) {
			logError('DatabaseFileList.invalidateCache', err);
		}
	}, [
		dispatch,
		dirInfoCacheId,
		navDirs,
	]);

	const filesByDir = useMemo(() => {
		const result: Record<string, NavChild[]> = {};
		if (!dirsInfo) return result;

		navDirs.forEach((dir) => {
			const dirInfo = dirsInfo[dir];
			result[dir] =
				dirInfo?.navChildren?.filter((child) => child.isFile && child.canRead) ?? [];
		});

		return result;
	}, [dirsInfo, navDirs]);

	const fileNamesByDir = useMemo(() => {
		const result: Record<string, Set<string>> = {};
		Object.entries(filesByDir).forEach(([dir, files]) => {
			result[dir] = new Set(
				files.map((f) => {
					const parts = f.name.split('/');
					return (parts[parts.length - 1] || f.name).toLowerCase();
				})
			);
		});
		return result;
	}, [filesByDir]);

	const badgeColor = useMemo(
		() => ({
			bg: theme.colors.primary,
			fg: theme.colors.onPrimary,
			border: theme.colors.primary,
		}),
		[theme]
	);
	const styleNotice = useMemo(
		() => [
			styles.notice,
			{
				borderColor: theme.colors.primary,
			},
		],
		[theme]
	);

	if (isLoading) {
		return (
			<View style={[styles.container, style]}>
				<LoadingIndicator />
			</View>
		);
	}

	return (
		<View style={[styles.container, style]}>
			<View style={styleNotice}>
				<LucideIcons
					size={20}
					color={theme.colors.onBackground}
					name="triangle-alert"
				/>
				<Text>{t('dbLoader.willRequireReload')}</Text>
			</View>

			{navDirs.map((dir, idx) => {
				const files = filesByDir[dir] ?? [];

				const isPublic =
					appDirs.externalMediaDirs.some((d) => dir.startsWith(d)) ||
					(!isScopedStorage && appDirs.externalFileDirs.some((d) => dir.startsWith(d)));

				return (
					<View key={dir}>
						<View style={styles.dirHeading}>
							<Text>{idx + 1}:</Text>
							<Text style={styles.flexShrink1}>{dir}</Text>

							<Badge
								badgeMode="outlined"
								label={t(isPublic ? 'public' : 'private')}
								color={badgeColor}
							/>
						</View>

						<View style={styles.dirContent}>
							{files.length === 0 && (
								<View style={styles.createNewRow}>
									<Text>{t('dbLoader.noDatabasesFound')}</Text>
								</View>
							)}

							{files.map((file) => (
								<RowDatabaseFile
									key={file.name}
									file={file}
									isSelected={file.name === dbPath}
									allDirs={navDirs}
									currentDir={dir}
									onFileChanged={invalidateCache}
									fileNamesByDir={fileNamesByDir}
								/>
							))}

							<RowCreateNew
								dir={dir}
								onCreated={invalidateCache}
							/>
						</View>
					</View>
				);
			})}
		</View>
	);
};

export default DatabaseFileList;
