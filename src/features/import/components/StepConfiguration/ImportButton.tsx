/**
 * External dependencies
 */
import { FC, memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native-paper';
/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectDryRun, selectTitleMode, selectTitleRegex, selectTagMode, selectTagRegexes } from '../../selectors';
import { useImportContext } from '../../ImportContext';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { setDryRun } from '../../slice';
import { getRegexWarnings } from '../../../../lib/regexUtils';

const ImportButton: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const dryRun = useAppSelector(selectDryRun);
	const titleMode = useAppSelector(selectTitleMode);
	const titleRegex = useAppSelector(selectTitleRegex);
	const tagMode = useAppSelector(selectTagMode);
	const tagRegexes = useAppSelector(selectTagRegexes);
	const { selectionCount, handleImport } = useImportContext();

	const titleRegexError = useMemo(() => {
		if (titleMode !== 'regex') return false;
		return (
			getRegexWarnings(titleRegex, {
				checkEmpty: true,
				checkCaptureGroup: true,
				checkEmptyCaptureGroup: true,
			}) !== null
		);
	}, [titleMode, titleRegex]);

	const tagRegexError = useMemo(() => {
		if (tagMode !== 'regex') return false;
		return tagRegexes.some(
			(r) =>
				getRegexWarnings(r, {
					checkEmpty: true,
					checkCaptureGroup: true,
					checkEmptyCaptureGroup: true,
				}) !== null
		);
	}, [tagMode, tagRegexes]);

	const buttonPropsImport = useButtonProps({
		disabled: selectionCount === 0 || titleRegexError || tagRegexError,
		isSuccess: true,
	});

	const handleToggleDryRun = useCallback(() => {
		dispatch(setDryRun(!dryRun));
	}, [dispatch, dryRun]);

	return (
		<View>
			<InfoLabelRow
				label={t('import.dryRun')}
				Info={t('import.hint.dryRun')}
				innerStyle={styles.inner}
			>
				<Switch
					value={dryRun}
					onValueChange={handleToggleDryRun}
				/>

				<ButtonHighlight
					{...buttonPropsImport}
					onPress={handleImport}
				>
					{dryRun ? t('import.startDryRun') : t('import.startImport')}
				</ButtonHighlight>
			</InfoLabelRow>
		</View>
	);
};

const styles = StyleSheet.create({
	inner: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
});

export default memo(ImportButton);
