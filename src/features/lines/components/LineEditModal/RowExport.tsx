/**
 * External dependencies
 */
import { FC, memo, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import useExportCbModal from '../../hooks/useExportCbModal';

const RowExport: FC = () => {
	const { t } = useTranslation();

	const { line } = useContext(LineEditModalContext);

	const { cb, modalNode } = useExportCbModal({ type: 'single', line });

	const buttonPropsAnchor = useButtonProps({
		mode: 'outlined',
		paddingHorizontal: true,
	});

	return (
		<>
			{modalNode}

			<InfoLabelRow
				label={t('lines.export')}
				Info={t('lines.hintExport')}
			>
				<ButtonHighlight
					{...buttonPropsAnchor}
					compact={true}
					onPress={cb}
					icon="content-save-outline"
				>
					{t('lines.export')}
				</ButtonHighlight>
			</InfoLabelRow>
		</>
	);
};

export default memo(RowExport);
