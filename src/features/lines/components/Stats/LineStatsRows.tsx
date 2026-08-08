/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { get } from 'lodash-es';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { LineStats as LineStatsType } from '../../types';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import LineStat from './LineStat';
import { RenderPart } from './sharedDeps';

const LineStatsRows: FC<{
	stats: LineStatsType;
}> = ({ stats }) => {
	const { t } = useTranslation();
	return useMemo(
		() =>
			Object.keys(stats).map((statKey) => {
				const columnKey = 'distance' === statKey ? 'length' : statKey;
				return (
					<InfoLabelRow
						key={statKey}
						label={t(`lines.columns.${columnKey}`)}
					>
						<LineStat
							value={get(stats, statKey)}
							columnKey={columnKey}
							renderParts={statsRenderParts}
							style={styles.gap}
						/>
					</InfoLabelRow>
				);
			}),
		[stats, t]
	);
};

const statsRenderParts = ['icon', 'value'] as RenderPart[];

const styles = StyleSheet.create({
	gap: { gap: 8 },
});

export default LineStatsRows;
