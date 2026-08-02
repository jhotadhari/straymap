/**
 * External dependencies
 */
import { FC, memo, useState } from 'react';
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

	return (
		<>
			<InfoLabelRow label={t('import.autoCustomDate')}>
				<View style={styles.row}>
					<Switch
						value={autoCustomDate}
						onValueChange={(v) => { dispatch(setAutoCustomDate(v)); }}
					/>
					<IconButtonHighlight
						icon="cog"
						size={20}
						onPress={() => setEditorVisible(true)}
					/>
				</View>
			</InfoLabelRow>

			{editorVisible && (
				<DatePatternEditorModal
					visible={editorVisible}
					onDismiss={() => setEditorVisible(false)}
				/>
			)}
		</>
	);
};

export default memo(DateExtractRowControl);
