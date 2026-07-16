/**
 * External dependencies
 */
import { FC, Fragment, useContext } from 'react';
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
import useShowLinesStatsCbModal from '../../hooks/useShowStatsCbModal';

const RowStats: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { line, route } = useContext(LineEditModalContext);

	const id = line?.id !== route?.line_id ? line?.id : route?.line_id;

	const { cb, modalNode } = useShowLinesStatsCbModal({
		lineIds: id ? [id] : [],
	});

	return (
		<Fragment>
			<InfoLabelRow
				label={t('lines.stats')}
				Info={t('lines.hintStats')}
			>
				<ButtonHighlight
					mode="outlined"
					compact={true}
					onPress={cb}
					icon="chart-box-outline"
					contentStyle={sharedStyles.buttonContent}
					labelStyle={sharedStyles.buttonLabel}
					textColor={theme.colors.onBackground}
				>
					<View>
						<Text>{t('lines.showStats')}</Text>
					</View>
				</ButtonHighlight>
			</InfoLabelRow>

			{modalNode}

		</Fragment>
	);
};


export default RowStats;
