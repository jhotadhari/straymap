/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import LucideIcons from '@react-native-vector-icons/lucide/static';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { useAppDispatch, useAppSelector, useSystemLineIds } from '../../../../store/hooks';
import { selectProfileLines } from '../../selectors';
import { toggleProfileLine } from '../../slice';
import { LineEditModalContext } from './Context';

const AltitudeProfileIcon: IconSource = ({ color, size }) => (
	<LucideIcons
		color={color}
		size={(size ?? 18) - 2}
		name="activity"
		style={styles.iconFix}
	/>
);

const RowAltitudeProfile: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const { line } = useContext(LineEditModalContext);

	const profileLines = useAppSelector(selectProfileLines);
	const systemLineIds = useSystemLineIds();

	const isSystemLine = useMemo(
		() => Object.values(systemLineIds).includes(line?.id ?? -1),
		[systemLineIds, line?.id]
	);

	// Profile/ramp require elevation; lines without Z (never DEM-enriched)
	// have no minZ stats. Disable with a hint to Apply DEM in that case.
	const hasElevation = useMemo(() => line?.stats?.minZ != null, [line?.stats?.minZ]);

	const disabled = useMemo(
		() => !line?.id || isSystemLine || !hasElevation,
		[
			line?.id,
			isSystemLine,
			hasElevation,
		]
	);

	const isEnabled = useMemo(
		() => (typeof line?.id === 'number' ? profileLines.includes(line.id) : false),
		[profileLines, line?.id]
	);

	const handlePress = useCallback(() => {
		if (disabled || typeof line?.id !== 'number') {
			return;
		}
		dispatch(toggleProfileLine(line.id));
	}, [
		disabled,
		dispatch,
		line?.id,
	]);

	const buttonProps = useButtonProps({
		mode: isEnabled ? 'contained' : 'outlined',
		disabled,
		paddingHorizontal: true,
	});

	return (
		<InfoLabelRow
			label={t('lines.altitudeProfile')}
			Info={t('lines.hintAltitudeProfile')}
		>
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={handlePress}
				icon={AltitudeProfileIcon}
			>
				{t('lines.altitudeProfile')}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

const styles = StyleSheet.create({
	iconFix: {
		marginRight: 2,
	},
});

export default RowAltitudeProfile;
