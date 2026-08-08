/**
 * External dependencies
 */
import React, { FC, Fragment, useMemo } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Divider } from 'react-native-paper';
/**
 * Internal dependencies
 */
import ListItem from '../../../components/generic/wrapper/ListItem';
import { featureRegistry } from '../../FeatureRegistry';
import { useAppDispatch } from '../../../store/hooks';
import { addUiItemKey } from '../slice';

const Settings: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const settingsPages = useMemo(() => featureRegistry.getSettingsPages(), []);

	return (
		<ScrollView style={style}>
			{settingsPages.map((item, index) => {
				const prependDivider =
					index > 0 &&
					Math.floor((item?.priority ?? 0) / 1000) >
						Math.floor((settingsPages[index - 1]?.priority ?? 0) / 1000);

				return (
					<Fragment key={index}>
						{prependDivider && <Divider style={styles.divider} />}

						<ListItem
							title={t(item.uiItem.label)}
							icon={item.uiItem?.icon}
							onPress={() => dispatch(addUiItemKey(item.key))}
						/>
					</Fragment>
				);
			})}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	divider: {
		marginVertical: 4,
	},
});

export default Settings;
