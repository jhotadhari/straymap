/**
 * External dependencies
 */
import { FC, memo, useContext, useMemo } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';

const RowImportInfo: FC = () => {
	const { t } = useTranslation();
	const { line } = useContext(LineEditModalContext);

	const importData = useMemo(() => {
		return (line?.data as any)?.import as
			| { sourceFilePath?: string; trackIndexInFile?: number | null }
			| undefined;
	}, [line?.data]);

	if (!importData?.sourceFilePath) return null;

	const label =
		importData.trackIndexInFile != null
			? `${importData.sourceFilePath} [${importData.trackIndexInFile + 1}]`
			: importData.sourceFilePath;

	return (
		<InfoLabelRow
			label={t('lines.rowImportSource')}
			Info={
				importData.trackIndexInFile != null
					? t('lines.rowImportSourceTrackHint')
					: t('lines.rowImportSourceHint')
			}
		>
			<Text selectable>{label}</Text>
		</InfoLabelRow>
	);
};

export default memo(RowImportInfo);
