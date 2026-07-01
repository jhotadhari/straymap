/**
 * External dependencies
 */
import React, { FC, useCallback } from 'react';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectDbPath } from '../selectors';
import ListItemModalControl from '../../../../components/generic/controls/ListItemModalControl';
import { setDbPath } from '../slice';
import FileSourceRowControl from '../../../../components/generic/controls/FileSourceRowControl';
import { selectAppDirs } from '../../dirs/selectors';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import { dbExtension } from '../constants';
import { StyleSheet } from 'react-native';

const extensions = [dbExtension];

const RowFile: FC = () => {
	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	const dispatch = useAppDispatch();

	const dbPath = useAppSelector(selectDbPath);

	const handleSelect = useCallback(
		(selectedOpt?: string) => {
			selectedOpt && selectedOpt.length && dispatch(setDbPath(selectedOpt));
		},
		[
			dispatch,
		]
	);

	return (
		<FileSourceRowControl
			label={t('file')} // ??? translation
			header={t('selectDbFile')} // ??? translation
			newOptionLabel={'Create new database'} // ??? translation
			value={dbPath}
			onModalDismiss={handleSelect}
			extensions={extensions}
			dirs={appDirs.databases}
			filesHeading={sprintf(t('filesIn'), '(.' + dbExtension + ')')}
			noFilesHeading={sprintf(t('noFilesIn'), '(.' + dbExtension + ')')}
			canCreateNewOption={true}
			styleContent={styles.contentButton}
		/>
	);
};

const RowSize: FC = () => {
	return (
		<InfoRowControl
			label={'size'} // ??? translation
		>
			<Text>{'TODO size mb ???'}</Text>
		</InfoRowControl>
	);
};

const RowMoveFile: FC = () => {
	return (
		<InfoRowControl
			label={'moveFile'} // ??? translation
		>
			<Text>{'TODO moveFile ???'}</Text>
		</InfoRowControl>
	);
};

const DBControl: FC = () => {
	const { t } = useTranslation();

	return (
		<ListItemModalControl
			anchorLabel={t('Database')} // ??? translation
			anchorIcon={({ color }) => (
				<Icon
					source="database-outline"
					size={25}
					color={color}
				/>
			)}
			header={t('Database')} // ??? translation
		>
			<RowFile />

			<RowSize />

			<RowMoveFile />
		</ListItemModalControl>
	);
};

const styles = StyleSheet.create({
	contentButton: { marginLeft: -12 },
});
export default DBControl;
