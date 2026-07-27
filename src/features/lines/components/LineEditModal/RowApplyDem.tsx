/**
 * External dependencies
 */
import { FC, Fragment, useContext, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { sharedStyles } from './sharedDeps';
import { LineEditModalContext } from './Context';
import useApplyDemCbModal from '../../hooks/useApplyDemCbModal';
import { useSystemLineIds } from '../../../../store/hooks';

const RowApplyDem: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { line } = useContext(LineEditModalContext);

	const systemLineIds = useSystemLineIds();
	const isSystemLine = useMemo(
		() => Object.values(systemLineIds).includes(line?.id ?? -1),
		[systemLineIds, line?.id]
	);

	const { cb, modalNode, IconComponent } = useApplyDemCbModal({
		lineIdsOrId: line?.id,
	});

	return (
		<Fragment>
			<InfoLabelRow
				label={t('lines.applyDem')}
				Info={t('lines.hintApplyDem')}
			>
				<ButtonHighlight
					mode="outlined"
					compact={true}
					disabled={!line?.id || isSystemLine}
					onPress={cb}
					icon={({ color, size }) => (
						<IconComponent
							color={color}
							size={size}
						/>
					)}
					contentStyle={sharedStyles.buttonContent}
					labelStyle={sharedStyles.buttonLabel}
					textColor={theme.colors.onBackground}
				>
					<View>
						<Text>{t('lines.applyDem')}</Text>
					</View>
				</ButtonHighlight>
			</InfoLabelRow>

			{modalNode}
		</Fragment>
	);
};

export default RowApplyDem;
