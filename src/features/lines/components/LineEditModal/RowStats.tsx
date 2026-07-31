/**
 * External dependencies
 */
import { FC, Fragment, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { LineEditModalContext } from './Context';
import useShowLinesStatsCbModal from '../../hooks/useShowStatsCbModal';
import { useButtonProps } from '../../../../compose/useButtonProps';

const RowStats: FC = () => {
	const { t } = useTranslation();

	const { line, route } = useContext(LineEditModalContext);

	const id = line?.id !== route?.line_id ? line?.id : route?.line_id;

	const { cb, modalNode } = useShowLinesStatsCbModal({
		lineIds: id ? [id] : [],
	});

	const buttonProps = useButtonProps({
		mode: 'outlined',
		paddingHorizontal: true,
	});

	return (
		<Fragment>
			<InfoLabelRow
				label={t('lines.stats')}
				Info={t('lines.hintStats')}
			>
				<ButtonHighlight
					{...buttonProps}
					compact={true}
					onPress={cb}
					icon="chart-box-outline"
				>
					{t('lines.showStats')}
				</ButtonHighlight>
			</InfoLabelRow>

			{modalNode}
		</Fragment>
	);
};

export default RowStats;
