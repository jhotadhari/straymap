/**
 * External dependencies
 */
import { FC, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { LineEditModalContext } from './Context';
import useApplyDemCbModal from '../../hooks/useApplyDemCbModal';
import { useSystemLineIds } from '../../../../store/hooks';
import { useButtonProps } from '../../../../compose/useButtonProps';

const RowApplyDem: FC = () => {
	const { t } = useTranslation();

	const { line } = useContext(LineEditModalContext);

	const systemLineIds = useSystemLineIds();
	const isSystemLine = useMemo(
		() => Object.values(systemLineIds).includes(line?.id ?? -1),
		[systemLineIds, line?.id]
	);

	const disabled = useMemo(
		() => !line?.id || isSystemLine,
		[
			line?.id,
			isSystemLine,
		]
	);

	const { cb, modalNode, IconComponent } = useApplyDemCbModal({
		lineIdsOrId: line?.id,
	});

	const icon: IconSource = useMemo(() => {
		return ({ color, size }) => (
			<IconComponent
				color={color}
				size={size}
			/>
		);
	}, [IconComponent]);

	const buttonProps = useButtonProps({
		mode: 'outlined',
		disabled,
		paddingHorizontal: true,
	});

	return (
		<InfoLabelRow
			label={t('lines.applyDem')}
			Info={t('lines.hintApplyDem')}
		>
			{modalNode}
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={cb}
				icon={icon}
			>
				{t('lines.applyDem')}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowApplyDem;
