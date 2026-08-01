/**
 * External dependencies
 */
import { FC } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { IMPORT_EXTENSIONS } from '../../utils/importParser';
import { localStyles } from './styles';

const StepIdle: FC<{
	handlePickFile: () => void;
	handlePickDirectory: () => void;
	/** Pre-computed button props from useButtonProps({ disabled: isPickingFile || isPickingDir }) */
	buttonPropsIdle: Record<string, unknown>;
}> = ({ handlePickFile, handlePickDirectory, buttonPropsIdle }) => {
	const { t } = useTranslation();

	return (
		<View style={localStyles.idleContainer}>
			<Text style={localStyles.hint}>
				{t('lines.importHint', {
					extensions: IMPORT_EXTENSIONS.join(', '),
				})}
			</Text>

			<ButtonHighlight
				{...buttonPropsIdle}
				onPress={handlePickFile}
			>
				{t('lines.importPickFile')}
			</ButtonHighlight>

			<ButtonHighlight
				{...buttonPropsIdle}
				onPress={handlePickDirectory}
			>
				{t('lines.importPickDirectory')}
			</ButtonHighlight>
		</View>
	);
};

export default StepIdle;
