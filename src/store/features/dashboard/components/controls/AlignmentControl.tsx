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
		label: 'center',
	},
	{
		key: 'left',
		label: 'left',
	},
	{
		key: 'right',
		label: 'right',
	},
	{
		key: 'around',
		label: 'around',
	},
	{
		key: 'between',
		label: 'between',
	},
	{
		key: 'evenly',
		label: 'evenly',
	},
];

const AlignmentControl: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const [menuVisible, setMenuVisible] = useState(false);

	const dashboardStyle = useAppSelector(selectDashboardStyle);

	return (
		<InfoRowControl
			label={t('alignment')}
			Info={t('hint.dashboard.alignment')}
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
										...dashboardStyle,
										align: opt.key,
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
