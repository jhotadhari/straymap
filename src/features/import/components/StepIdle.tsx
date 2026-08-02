/**
 * External dependencies
 */
import { FC, memo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import { IMPORT_EXTENSIONS } from '../../lines/utils/importParser';
import { localStyles } from './styles';
import { useImportContext } from './ImportContext';
import ImportDirPicker from './ImportDirPicker';

const StepIdle: FC = () => {
	const { t } = useTranslation();
	const { handlePickFile, handleSelectAppDir, handleSelectCustom, importDirs } =
		useImportContext();

	const buttonProps = useButtonProps({});

	return (
		<View style={localStyles.idleContainer}>
			<Text style={localStyles.hint}>
				{t('import.hint', {
					extensions: IMPORT_EXTENSIONS.join(', '),
				})}
			</Text>

			<ButtonHighlight {...buttonProps} onPress={handlePickFile}>
				{t('import.pickFile')}
			</ButtonHighlight>

			<ImportDirPicker
				appDirs={importDirs}
				onSelectAppDir={handleSelectAppDir}
				onSelectCustom={handleSelectCustom}
				buttonProps={buttonProps}
			/>
		</View>
	);
};

export default memo(StepIdle);
