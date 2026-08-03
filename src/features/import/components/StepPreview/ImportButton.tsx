/**
 * External dependencies
 */
import { FC, memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { useAppSelector } from '../../../../store/hooks';
import { selectDryRun } from '../../selectors';
import { useImportContext } from '../ImportContext';
import { localStyles } from '../styles';

const ImportButton: FC = () => {
	const { t } = useTranslation();
	const dryRun = useAppSelector(selectDryRun);
	const { selectionCount, handleImport } = useImportContext();

	const buttonPropsImport = useButtonProps({
		disabled: selectionCount === 0,
	});

	return (
		<View style={localStyles.importControls}>
			<ButtonHighlight {...buttonPropsImport} onPress={handleImport}>
				{(dryRun ? '(' + t('import.dryRun') + ') ' : '') +
					sprintf(t('import.selected'), selectionCount)}
			</ButtonHighlight>
		</View>
	);
};

export default memo(ImportButton);
