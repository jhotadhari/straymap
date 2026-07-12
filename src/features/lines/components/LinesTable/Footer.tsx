/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { without } from 'lodash-es';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import IconButtonHighlight from '../../../../components/generic/IconButtonHighlight';
import { DRAWER_ICON_SIZE } from '../../../drawers/constants';
import { sprintf } from 'sprintf-js';
import { sharedStyles } from './sharedDeps';
import BulkActions from './BulkActions';
import ImportModal from './ImportModal';
import { FooterContext } from './Context';

const Footer: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { checkedIds, linesCount, setCheckedIds, lineIds } = useContext(FooterContext);

	const [importModalVisible, setImportModalVisible] = useState(false);

	const handleOpenImport = useCallback(() => setImportModalVisible(true), []);
	const handleDismissImport = useCallback(() => setImportModalVisible(false), []);

	const style = useMemo(
		() => [
			sharedStyles.footer,
			{
				borderColor: theme.colors.onBackground,
			},
		],
		[theme]
	);

	const toggleCheckedIds = useCallback(() => {
		setCheckedIds &&
			setCheckedIds((ids) => {
				return without(lineIds, ...ids);
			});
	}, [lineIds, setCheckedIds]);

	const labelStyle = useMemo(
		() => ({
			color: checkedIds.length ? theme.colors.onBackground : theme.colors.onSurfaceDisabled,
		}),
		[theme, checkedIds]
	);

	return (
		<View style={style}>
			<View style={sharedStyles.flexRowGap}>
				<BulkActions />
				<Text style={labelStyle}>{t('lines.bulkActions')}</Text>
				<Text style={labelStyle}>
					{sprintf(t('lines.selectedCount'), checkedIds.length, linesCount)}
				</Text>
			</View>

			<View style={sharedStyles.flexRowGap}>
				<ButtonHighlight
					mode="text"
					compact={true}
					onPress={toggleCheckedIds}
				>
					<Icon
						source={'swap-horizontal-variant'}
						size={DRAWER_ICON_SIZE}
					/>
				</ButtonHighlight>

				<IconButtonHighlight
					icon="database-import"
					size={DRAWER_ICON_SIZE}
					onPress={handleOpenImport}
				/>
			</View>

			<ImportModal
				visible={importModalVisible}
				onDismiss={handleDismissImport}
			/>
		</View>
	);
};

export default Footer;
