/**
 * External dependencies
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../../types';
import ListItemModalControl from '../../../../../components/generic/controls/ListItemModalControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectHardwareKeys } from '../../selectors';
import { setHardwareKeys } from '../../slice';
import ListItemMenuControl from '../../../../../components/generic/controls/ListItemMenuControl';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';

const keyCodeStringOptions: OptionBase[] = [
	{
		key: 'KEYCODE_VOLUME_UP',
		label: 'general.volumeUp',
	},
	{
		key: 'KEYCODE_VOLUME_DOWN',
		label: 'general.volumeDown',
	},
];

const actionKeyOptions: OptionBase[] = [
	{
		key: 'general.none',
		label: 'nothing',
	},
	{
		key: 'zoomIn',
		label: 'general.zoomIn',
	},
	{
		key: 'zoomOut',
		label: 'general.zoomOut',
	},
];

const RowItem = ({ keyCodeStringOption }: { keyCodeStringOption: OptionBase }) => {
	const { t } = useTranslation();

	const hardwareKeyActionConfigs = useAppSelector(selectHardwareKeys);

	const dispatch = useAppDispatch();

	const hardwareKeyActionConfig = hardwareKeyActionConfigs.find(
		(conf) => conf.keyCodeString === keyCodeStringOption.key
	);
	const selectedActionKeyOption = actionKeyOptions.find(
		(actionKeyOption) => actionKeyOption.key === hardwareKeyActionConfig?.actionKey
	);

	return (
		<InfoRowControl label={t(keyCodeStringOption.label)}>
			<ListItemMenuControl
				listItemStyle={{
					marginLeft: 0,
					paddingLeft: 10,
				}}
				options={actionKeyOptions}
				value={hardwareKeyActionConfig?.actionKey}
				setValue={(newValue) => {
					const newHardwareKeyActionConfigs = [...hardwareKeyActionConfigs];
					const index = newHardwareKeyActionConfigs.findIndex(
						(conf) => conf.keyCodeString === keyCodeStringOption.key
					);
					newHardwareKeyActionConfigs.splice(index, 1, {
						actionKey: newValue,
						keyCodeString: keyCodeStringOption.key,
					});
					dispatch(setHardwareKeys(newHardwareKeyActionConfigs));
				}}
				anchorLabel={t(get(selectedActionKeyOption, 'label', ''))}
			/>
		</InfoRowControl>
	);
};

const HardwareKeyControl = () => {
	const { t } = useTranslation();

	return (
		<ListItemModalControl
			anchorLabel={t('general.hardwareKeyAssignment')}
			anchorIcon={({ color, style }) => (
				<View style={style}>
					<Icon
						source="cellphone-settings"
						color={color}
						size={25}
					/>
				</View>
			)}
			header={t('general.hardwareKey', { count: 0 })}
			hasHeaderBackPress={true}
		>
			<View style={styles.gap}>
				{keyCodeStringOptions.map((keyCodeStringOption: OptionBase) => (
					<RowItem
						key={keyCodeStringOption.key}
						keyCodeStringOption={keyCodeStringOption}
					/>
				))}
			</View>
		</ListItemModalControl>
	);
};

const styles = StyleSheet.create({
	gap: {
		gap: 16,
	},
});

export default HardwareKeyControl;
