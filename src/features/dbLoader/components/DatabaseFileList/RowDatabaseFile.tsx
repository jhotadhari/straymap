/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import Popover from 'react-native-popover-view';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectDbPath } from '../../selectors';
import { setDbPath } from '../../slice';
import { dbExtension } from '../../constants';
import { NavChild } from '../../../dirs/types';
import { MenuActionOption } from '../../../../types';
import { FsModule } from '../../../../nativeModules';
import PopoverMenuItems from '../../../../components/generic/wrapper/PopoverMenuItems';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';
import { logError } from '../../../../lib/utils';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { styles } from './sharedDeps';
import { useButtonProps } from '../../../../compose/useButtonProps';

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const units = [
		'B',
		'KB',
		'MB',
		'GB',
		'TB',
	];
	const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const size = bytes / Math.pow(1024, idx);
	return `${size.toFixed(size < 10 ? 1 : 0)} ${units[idx]}`;
};

const getFileName = (filePath: string): string => {
	const parts = filePath.split('/');
	return parts[parts.length - 1] || filePath;
};

const RowDatabaseFile: FC<{
	file: NavChild;
	isSelected: boolean;
	allDirs: string[];
	currentDir: string;
	onFileChanged: () => void;
	fileNamesByDir: Record<string, Set<string>>;
}> = ({ file, isSelected, allDirs, currentDir, onFileChanged, fileNamesByDir }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { showError } = useContext(ErrorToastContext);

	const dbPath = useAppSelector(selectDbPath);

	const [popoverVisible, setPopoverVisible] = useState(false);
	const [renameVisible, setRenameVisible] = useState(false);
	const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
	const [newName, setNewName] = useState('');
	const [isBusy, setIsBusy] = useState(false);

	const anchorRef = useRef<View>(null);

	const fileName = useMemo(() => getFileName(file.name), [file.name]);

	const otherDirs = useMemo(() => allDirs.filter((d) => d !== currentDir), [allDirs, currentDir]);

	const invalidateAndNotify = useCallback(() => {
		onFileChanged();
	}, [onFileChanged]);

	const handleSelect = useCallback(() => {
		dispatch(setDbPath(file.name));
	}, [dispatch, file.name]);

	const handleMove = useCallback(
		async (targetDir: string) => {
			setIsBusy(true);
			try {
				const newPath = `${targetDir}/${fileName}`;
				await FsModule.copyFile(file.name, newPath);
				try {
					await FsModule.deleteFile(file.name);
				} catch {
					// best-effort: source may be locked (e.g. open db connection)
				}
				if (dbPath === file.name) {
					dispatch(setDbPath(newPath));
				}
				invalidateAndNotify();
			} catch (err: any) {
				logError('DatabaseFileList.moveFile', err);
				showError(sprintf(t('dbLoader.fileOperationError'), err?.message ?? String(err)));
			} finally {
				setIsBusy(false);
				setPopoverVisible(false);
			}
		},
		[
			file.name,
			fileName,
			dbPath,
			dispatch,
			invalidateAndNotify,
			showError,
			t,
		]
	);

	const handleCopy = useCallback(
		async (targetDir: string) => {
			setIsBusy(true);
			try {
				const destPath = `${targetDir}/${fileName}`;
				await FsModule.copyFile(file.name, destPath);
				invalidateAndNotify();
			} catch (err: any) {
				logError('DatabaseFileList.copyFile', err);
				showError(sprintf(t('dbLoader.fileOperationError'), err?.message ?? String(err)));
			} finally {
				setIsBusy(false);
				setPopoverVisible(false);
			}
		},
		[
			file.name,
			fileName,
			invalidateAndNotify,
			showError,
			t,
		]
	);

	const handleRenamePress = useCallback(() => {
		setNewName(fileName.replace(`.${dbExtension}`, '').toLowerCase());
		setRenameVisible(true);
		setPopoverVisible(false);
	}, [fileName]);

	const handleRenameConfirm = useCallback(async () => {
		if (!newName.trim()) return;
		setIsBusy(true);
		try {
			const newPath = `${currentDir}/${newName.trim().toLowerCase()}.${dbExtension}`;
			await FsModule.copyFile(file.name, newPath);
			try {
				await FsModule.deleteFile(file.name);
			} catch {
				// best-effort: source may be locked (e.g. open db connection)
			}
			if (dbPath === file.name) {
				dispatch(setDbPath(newPath));
			}
			invalidateAndNotify();
			setRenameVisible(false);
		} catch (err: any) {
			logError('DatabaseFileList.renameFile', err);
			showError(sprintf(t('dbLoader.fileOperationError'), err?.message ?? String(err)));
		} finally {
			setIsBusy(false);
		}
	}, [
		newName,
		currentDir,
		file.name,
		dbPath,
		dispatch,
		invalidateAndNotify,
		showError,
		t,
	]);

	const handleDeletePress = useCallback(() => {
		setDeleteConfirmVisible(true);
		setPopoverVisible(false);
	}, []);

	const handleDeleteConfirm = useCallback(async () => {
		setIsBusy(true);
		try {
			await FsModule.deleteFile(file.name);
			if (dbPath === file.name) {
				dispatch(setDbPath(''));
			}
			invalidateAndNotify();
			setDeleteConfirmVisible(false);
		} catch (err: any) {
			logError('DatabaseFileList.deleteFile', err);
			showError(sprintf(t('dbLoader.fileOperationError'), err?.message ?? String(err)));
		} finally {
			setIsBusy(false);
		}
	}, [
		file.name,
		dbPath,
		dispatch,
		invalidateAndNotify,
		showError,
		t,
	]);

	const menuOptions: MenuActionOption[] = useMemo(() => {
		const opts: MenuActionOption[] = [];

		opts.push({
			key: 'select',
			label: t('dbLoader.select'),
			leadingIcon: 'check',
			cb: handleSelect,
		});

		otherDirs.forEach((dir) => {
			const idx = allDirs.findIndex((d) => dir === d);
			if (-1 !== idx) {
				opts.push({
					key: `move-${dir}`,
					label: sprintf(t('dbLoader.moveToX'), idx + 1),
					leadingIcon: 'folder-move-outline',
					cb: () => handleMove(dir),
					disabled: () => fileNamesByDir[dir]?.has(fileName.toLowerCase()) ?? false,
				});
			}
		});

		otherDirs.forEach((dir) => {
			const idx = allDirs.findIndex((d) => dir === d);
			if (-1 !== idx) {
				opts.push({
					key: `copy-${dir}`,
					label: sprintf(t('dbLoader.copyToX'), idx + 1),
					leadingIcon: 'content-copy',
					disabled: () => fileNamesByDir[dir]?.has(fileName.toLowerCase()) ?? false,
					cb: () => handleCopy(dir),
				});
			}
		});

		opts.push({
			key: 'rename',
			label: t('dbLoader.rename'),
			leadingIcon: 'pencil-outline',
			cb: handleRenamePress,
		});

		opts.push({
			key: 'delete',
			label: t('dbLoader.delete'),
			leadingIcon: 'delete-outline',
			cb: handleDeletePress,
		});

		return opts;
	}, [
		allDirs,
		otherDirs,
		t,
		handleSelect,
		handleMove,
		handleCopy,
		handleRenamePress,
		handleDeletePress,
		fileNamesByDir,
		fileName,
	]);

	const newNameExists = useMemo(() => {
		const nameWithExt = newName.trim().toLowerCase() + '.' + dbExtension;
		if (nameWithExt === fileName) return true;
		return fileNamesByDir[currentDir]?.has(nameWithExt) ?? false;
	}, [
		newName,
		fileName,
		currentDir,
		fileNamesByDir,
	]);
	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 100,
		}),
		[theme]
	);

	const rowStyle = useMemo(
		() => [
			styles.fileRow,
			isSelected && { borderLeftColor: theme.colors.primaryContainer },
		],
		[isSelected, theme]
	);

	const buttonPropsCancel = useButtonProps({
		mode: 'outlined',
	});

	const buttonPropsRename = useButtonProps({
		mode: 'outlined',
		disabled: !newName.trim() || isBusy || newNameExists,
	});

	const buttonPropsDelete = useButtonProps({
		isDestructive: true,
		disabled: isBusy,
	});

	return (
		<>
			<View style={rowStyle}>
				<View style={styles.fileInfo}>
					<Text numberOfLines={1}>{fileName}</Text>

					<Text>{file.size !== undefined ? formatFileSize(file.size) : '...'}</Text>
				</View>

				<View ref={anchorRef}>
					<IconButtonHighlight
						icon="dots-vertical"
						mode="outlined"
						size={20}
						onPress={() => setPopoverVisible(true)}
						disabled={isBusy}
					/>
				</View>

				<Popover
					popoverStyle={popoverStyle}
					arrowSize={arrowSize}
					isVisible={popoverVisible}
					onRequestClose={() => setPopoverVisible(false)}
					from={anchorRef as React.RefObject<React.Component<{}, {}, any>>}
				>
					<PopoverMenuItems
						options={menuOptions}
						onPress={() => setPopoverVisible(false)}
					/>
				</Popover>
			</View>

			<ModalWrapper
				visible={renameVisible}
				onDismiss={() => setRenameVisible(false)}
				headerLabel={t('dbLoader.renameDatabase')}
				innerStyle={styles.modalContent}
			>
				<Text>{t('dbLoader.renameDatabasePrompt')}</Text>
				<TextInput
					value={newName}
					onChangeText={setNewName}
					mode="outlined"
					autoFocus
				/>
				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						{...buttonPropsCancel}
						onPress={() => setRenameVisible(false)}
					>
						{t('cancel')}
					</ButtonHighlight>
					<ButtonHighlight
						{...buttonPropsRename}
						onPress={handleRenameConfirm}
					>
						{t('apply')}
					</ButtonHighlight>
				</View>
			</ModalWrapper>

			<ModalWrapper
				visible={deleteConfirmVisible}
				onDismiss={() => setDeleteConfirmVisible(false)}
				headerLabel={t('dbLoader.deleteDatabase')}
				innerStyle={styles.modalContent}
			>
				<Text>{sprintf(t('dbLoader.deleteDatabaseConfirmation'), fileName)}</Text>
				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						{...buttonPropsCancel}
						onPress={() => setDeleteConfirmVisible(false)}
					>
						{t('cancel')}
					</ButtonHighlight>
					<ButtonHighlight
						{...buttonPropsDelete}
						onPress={handleDeleteConfirm}
					>
						{t('dbLoader.delete')}
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		</>
	);
};

const arrowSize = { height: 0, width: 0 };

export default RowDatabaseFile;
