/**
 * External dependencies
 */
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectDashboardStyle } from '../../selectors';
import { setDashboardStyle } from '../../slice';
import { OptionBase } from '../../../../../types';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ListItemMenuControl from '../../../../../components/generic/controls/ListItemMenuControl';

const styleAlignOptions: OptionBase[] = [
	{
		key: 'center',
		label: 'dashboard.align.center',
	},
	{
		key: 'left',
		label: 'dashboard.align.left',
	},
	{
		key: 'right',
		label: 'dashboard.align.right',
	},
	{
		key: 'around',
		label: 'dashboard.align.around',
	},
	{
		key: 'between',
		label: 'dashboard.align.between',
	},
	{
		key: 'evenly',
		label: 'dashboard.align.evenly',
	},
];

const AlignmentControl: FC<{
	position: string;
}> = ({ position }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const dashboardStyle = useAppSelector((state) => selectDashboardStyle(state, position));

	return (
		<InfoRowControl
			label={t('dashboard.alignment')}
			Info={t('dashboard.hint.alignment')}
			style={{ marginTop: 0, marginBottom: 0 }}
		>
			<ListItemMenuControl
				listItemStyle={{
					marginLeft: 0,
					paddingLeft: 10,
				}}
				options={styleAlignOptions}
				value={dashboardStyle.align}
				setValue={(newValue) => {
					dispatch(
						setDashboardStyle({
							position,
							style: {
								...dashboardStyle,
								align: newValue,
							},
						})
					);
				}}
				anchorLabel={t(
					get(
						styleAlignOptions.find((opt) => opt.key === dashboardStyle.align),
						'label',
						''
					)
				)}
			/>
		</InfoRowControl>
	);
};

export default AlignmentControl;
