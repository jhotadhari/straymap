/**
 * External dependencies
 */
import { FC, memo, useCallback, useMemo } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectOverwriteMode } from '../../selectors';
import { setOverwriteMode } from '../../slice';
import { OverwriteMode } from '../types';

const OverwriteModeControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const overwriteMode = useAppSelector(selectOverwriteMode);

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
		() => (
			<Text>
				{sprintf(
					t('import.hint.overwriteMode'),
					t('lines.columns.modified_at'),
					t('lines.columns.created_at')
				)}
			</Text>
		),
		[t]
	);

	return (
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
	);
};

export default memo(OverwriteModeControl);
