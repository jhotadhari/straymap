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
import { IMPORT_EXTENSIONS } from '../../lines/utils/importParser';
import { AbsPath } from '../../dirs/types';
import { localStyles } from './styles';
import ImportDirPicker from './ImportDirPicker';

const StepIdle: FC<{
	handlePickFile: () => void;
	handleSelectAppDir: (path: AbsPath) => void;
	handleSelectCustom: () => void;
	appDirs: AbsPath[];
	buttonPropsIdle: Record<string, unknown>;
}> = ({
	handlePickFile,
	handleSelectAppDir,
	handleSelectCustom,
	appDirs,
	buttonPropsIdle,
}) => {
	const { t } = useTranslation();

	return (
		<View style={localStyles.idleContainer}>
			<Text style={localStyles.hint}>
				{t('import.hint', {
					extensions: IMPORT_EXTENSIONS.join(', '),
				})}
			</Text>

			<ButtonHighlight {...buttonPropsIdle} onPress={handlePickFile}>
				{t('import.pickFile')}
			</ButtonHighlight>

			<ImportDirPicker
				appDirs={appDirs}
				onSelectAppDir={handleSelectAppDir}
				onSelectCustom={handleSelectCustom}
				buttonProps={buttonPropsIdle}
			/>
		</View>
	);
};

export default memo(StepIdle);
