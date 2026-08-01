/**
 * External dependencies
 */
import { FC, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
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
	handleScanStorage: (path: string) => void;
	proposedPath: string | null;
	buttonPropsIdle: Record<string, unknown>;
}> = ({ handlePickFile, handlePickDirectory, handleScanStorage, proposedPath, buttonPropsIdle }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [storageInput, setStorageInput] = useState(proposedPath ?? '');

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

			<View style={localStyles.storageSection}>
				<Text style={[localStyles.hint, localStyles.storageHint]}>
					{t('lines.importScanStorageHint')}
				</Text>
				<TextInput
					value={storageInput}
					placeholder="/storage/emulated/0/Download"
					onChangeText={setStorageInput}
					style={[
						localStyles.configInput,
						localStyles.storageInput,
						{ borderColor: theme.colors.outline },
					]}
				/>
				<ButtonHighlight
					{...buttonPropsIdle}
					onPress={() => handleScanStorage(storageInput)}
				>
					{t('lines.importScanStorage')}
				</ButtonHighlight>
			</View>
		</View>
	);
};

export default StepIdle;
