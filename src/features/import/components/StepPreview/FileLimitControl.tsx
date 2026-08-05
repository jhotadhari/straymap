/**
 * External dependencies
 */
import { FC, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectFileLimit } from '../../selectors';
import { setFileLimit } from '../../slice';
import { useImportContext } from '../ImportContext';

const validateFileLimit = (val: number) => val >= 0;

const FileLimitControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { importMode } = useImportContext();
	const fileLimit = useAppSelector(selectFileLimit);

	const handleSetFileLimit = useCallback(
		(v: number) => {
			dispatch(setFileLimit(v));
		},
		[dispatch]
	);

	if (importMode !== 'directory') return null;

	return (
		<NumericRowControl
			label={t('import.fileLimit')}
			value={fileLimit}
			onUpdate={handleSetFileLimit}
			numType="int"
			validate={validateFileLimit}
			Info={t('import.hint.fileLimit')}
		/>
	);
};

export default memo(FileLimitControl);
