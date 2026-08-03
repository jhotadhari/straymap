/**
 * External dependencies
 */
import { FC, memo, useCallback, useMemo } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import DateExtractRowControl from '../DateExtractRowControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	selectFileLimit,
	selectDryRun,
	selectKeepAppActive,
	selectMergeMode,
	selectOverwriteMode,
} from '../../selectors';
import {
	setFileLimit,
	setDryRun,
	setKeepAppActive,
	setMergeMode,
	setOverwriteMode,
} from '../../slice';
import { OverwriteMode } from '../types';
import { useImportContext } from '../ImportContext';
import { sharedStyles } from '../../../../sharedStyles';

const validateFileLimit = (val: number) => val >= 0;

const ImportConfigSection: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { importMode } = useImportContext();

	const fileLimit = useAppSelector(selectFileLimit);
	const dryRun = useAppSelector(selectDryRun);
	const keepAppActive = useAppSelector(selectKeepAppActive);
	const mergeMode = useAppSelector(selectMergeMode);
	const overwriteMode = useAppSelector(selectOverwriteMode);

	const handleToggleKeepAppActive = useCallback(async () => {
		const next = !keepAppActive;
		if (next && Platform.OS === 'android' && Platform.Version >= 33) {
			try {
				const result = await PermissionsAndroid.request(
					'android.permission.POST_NOTIFICATIONS'
				);
				if (result !== PermissionsAndroid.RESULTS.GRANTED) {
					return;
				}
			} catch {
				return;
			}
		}
		dispatch(setKeepAppActive(next));
	}, [keepAppActive, dispatch]);

	const handleSetFileLimit = useCallback(
		(v: number) => {
			dispatch(setFileLimit(v));
		},
		[dispatch]
	);

	const handleToggleDryRun = useCallback(() => {
		dispatch(setDryRun(!dryRun));
	}, [dispatch, dryRun]);

	const handleToggleMergeMode = useCallback(() => {
		dispatch(setMergeMode(!mergeMode));
	}, [dispatch, mergeMode]);

	const handleSetOverwriteMode = useCallback(
		(v: string) => {
			dispatch(setOverwriteMode(v as OverwriteMode));
		},
		[dispatch]
	);

	const overwriteOptions = useMemo(
		() => [
			{ key: 'create', label: t('import.overwriteCreate') },
			{ key: 'skip', label: t('import.overwriteSkip') },
			{ key: 'overwrite', label: t('import.overwriteOverwrite') },
		],
		[t]
	);

	const overwriteAnchorLabel = useMemo(
		() => overwriteOptions.find((o) => o.key === overwriteMode)?.label ?? '',
		[overwriteOptions, overwriteMode]
	);

	const overwriteInfoNode = useMemo(
		() => <Text>{t('import.hint.overwriteMode')}</Text>,
		[t]
	);

	return (
		<>
			<List.Subheader>{t('import.importOptions')}</List.Subheader>

			{importMode === 'directory' && (
				<NumericRowControl
					label={t('import.fileLimit')}
					value={fileLimit}
					onUpdate={handleSetFileLimit}
					numType="int"
					validate={validateFileLimit}
					Info={t('import.hint.fileLimit')}
				/>
			)}

			<ToggleRowControl
				label={t('import.dryRun')}
				value={dryRun}
				onToggle={handleToggleDryRun}
				Info={t('import.hint.dryRun')}
				innerStyle={sharedStyles.alignStart}
			/>

			<ToggleRowControl
				label={t('import.keepAppActive')}
				value={keepAppActive}
				onToggle={handleToggleKeepAppActive}
				Info={t('import.hint.keepAppActive')}
				innerStyle={sharedStyles.alignStart}
			/>

			<DateExtractRowControl />

			<ToggleRowControl
				label={t('import.mergeMode')}
				value={mergeMode}
				onToggle={handleToggleMergeMode}
				Info={t('import.hint.mergeMode')}
				innerStyle={sharedStyles.alignStart}
			/>

			<InfoLabelRow
				backgroundBlur={true}
				label={t('import.overwriteMode')}
				Info={overwriteInfoNode}
			>
				<ButtonHighlightMenuControl
					options={overwriteOptions}
					value={overwriteMode}
					setValue={handleSetOverwriteMode}
					compact
					anchorLabel={overwriteAnchorLabel}
				/>
			</InfoLabelRow>
		</>
	);
};

export default memo(ImportConfigSection);
