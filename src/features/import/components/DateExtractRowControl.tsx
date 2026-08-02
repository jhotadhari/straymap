/**
 * External dependencies
 */
import { FC, memo, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import IconButtonHighlight from '../../../components/generic/primitives/IconButtonHighlight';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectAutoCustomDate } from '../selectors';
import { setAutoCustomDate } from '../slice';
import DatePatternEditorModal from './DatePatternEditorModal';

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
});

const DateExtractRowControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const autoCustomDate = useAppSelector(selectAutoCustomDate);
	const [editorVisible, setEditorVisible] = useState(false);

	const handleAutoCustomDateChange = useCallback(
		(v: boolean) => {
			dispatch(setAutoCustomDate(v));
		},
		[dispatch]
	);

	const handleOpenEditor = useCallback(() => {
		setEditorVisible(true);
	}, []);

	const handleCloseEditor = useCallback(() => {
		setEditorVisible(false);
	}, []);

	return (
		<>
			<InfoLabelRow label={t('import.autoCustomDate')} Info={t('import.hint.autoCustomDate')}>
				<View style={styles.row}>
					<Switch
						value={autoCustomDate}
						onValueChange={handleAutoCustomDateChange}
					/>
					<IconButtonHighlight
						icon="cog"
						size={20}
						onPress={handleOpenEditor}
					/>
				</View>
			</InfoLabelRow>

			{editorVisible && (
				<DatePatternEditorModal
					visible={editorVisible}
					onDismiss={handleCloseEditor}
				/>
			)}
		</>
	);
};

export default memo(DateExtractRowControl);
