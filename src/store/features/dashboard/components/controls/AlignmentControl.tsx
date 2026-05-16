/**
 * External dependencies
 */
import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectDashboardStyle } from '../../selectors';
import { setDashboardStyle } from '../../dashboardSlice';
import { OptionBase } from '../../../../../types';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import MenuItem from '../../../../../components/generic/MenuItem';

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
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const [menuVisible, setMenuVisible] = useState(false);

	const dashboardStyle = useAppSelector((state) => selectDashboardStyle(state, position));

	return (
		<InfoRowControl
			label={t('dashboard.alignment')}
			Info={t('dashboard.hint.alignment')}
			style={{ marginTop: 0, marginBottom: 0 }}
		>
			<Menu
				contentStyle={{
					borderColor: theme.colors.outline,
					borderWidth: 1,
				}}
				visible={menuVisible}
				onDismiss={() => setMenuVisible(false)}
				anchor={
					<ButtonHighlight
						style={{ marginTop: 3, alignItems: 'flex-start' }}
						onPress={() => setMenuVisible(true)}
					>
						<Text>
							{t(
								get(
									styleAlignOptions.find(
										(opt) => opt.key === dashboardStyle.align
									),
									'label',
									''
								)
							)}
						</Text>
					</ButtonHighlight>
				}
			>
				{styleAlignOptions &&
					[...styleAlignOptions].map((opt) => (
						<MenuItem
							key={opt.key}
							onPress={() => {
								setMenuVisible(false);
								dispatch(
									setDashboardStyle({
										position,
										style: {
											...dashboardStyle,
											align: opt.key,
										},
									})
								);
							}}
							title={t(opt.label)}
							active={opt.key === dashboardStyle.align}
						/>
					))}
			</Menu>
		</InfoRowControl>
	);
};

export default AlignmentControl;
