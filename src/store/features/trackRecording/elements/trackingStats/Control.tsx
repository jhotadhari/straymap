/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectEditItem } from '../../../dashboard/selectors';
import { setItem } from '../../../dashboard/slice';
import ItemMinWidthControl from '../../../dashboard/components/controls/ItemMinWidthControl';
import ItemFontSizeControl from '../../../dashboard/components/controls/ItemFontSizeControl';
import ItemShowLabelControl from '../../../dashboard/components/controls/ItemShowLabelControl';
import ItemShowIconControl from '../../../dashboard/components/controls/ItemShowIconControl';
import ListItemMenuControl from '../../../../../components/generic/controls/ListItemMenuControl';
import { sharedStyles } from '../../../dashboard/elements/sharedDeps';

const STAT_OPTIONS = [
	{ key: 'distance', label: 'trackRecording.distance' },
	{ key: 'duration', label: 'trackRecording.duration' },
	{ key: 'uphill', label: 'trackRecording.uphill' },
	{ key: 'downhill', label: 'trackRecording.downhill' },
	{ key: 'speed', label: 'trackRecording.speed' },
	{ key: 'avgSpeed', label: 'trackRecording.avgSpeed' },
	{ key: 'pointCount', label: 'trackRecording.pointCount' },
];

const Control: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { item } = useAppSelector(selectEditItem);

	const statField = (item?.options as any)?.statField ?? 'distance';

	const handleStatChange = useCallback(
		(newValue: string) => {
			if (!item) return;
			dispatch(
				setItem({
					...item,
					options: {
						...(item.options ?? {}),
						statField: newValue,
					},
				})
			);
		},
		[dispatch, item]
	);

	const options = useMemo(
		() => STAT_OPTIONS.map((opt) => ({ key: opt.key, label: t(opt.label) })),
		[t]
	);

	return (
		<View style={sharedStyles.container}>
			<ListItemMenuControl
				anchorLabel={t('trackRecording.statField')}
				options={options}
				value={statField}
				setValue={handleStatChange}
			/>

			<ItemMinWidthControl buttonLabel={t('Use default')} />

			<ItemFontSizeControl
				buttonLabel={t('follow dashboard setting')}
			/>

			<ItemShowLabelControl />

			<ItemShowIconControl />
		</View>
	);
};

export default Control;
