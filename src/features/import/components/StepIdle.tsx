/**
 * External dependencies
 */
import { FC, memo, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { IMPORT_EXTENSIONS } from '../../lines/utils/importParser';
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

	const storageInputStyle = useMemo(
		() => ({ borderColor: theme.colors.outline }),
		[theme]
	);

	return (
		<View style={localStyles.idleContainer}>
			<Text style={localStyles.hint}>
				{t('import.hint', {
					extensions: IMPORT_EXTENSIONS.join(', '),
				})}
			</Text>

			<ButtonHighlight
				{...buttonPropsIdle}
				onPress={handlePickFile}
			>
				{t('import.pickFile')}
			</ButtonHighlight>

			<ButtonHighlight
				{...buttonPropsIdle}
				onPress={handlePickDirectory}
			>
				{t('import.pickDirectory')}
			</ButtonHighlight>

			<View style={localStyles.storageSection}>
				<Text style={[localStyles.hint, localStyles.storageHint]}>
					{t('import.scanStorageHint')}
				</Text>
				<TextInput
					value={storageInput}
					placeholder="/storage/emulated/0/Download"
					onChangeText={setStorageInput}
					style={[
						localStyles.configInput,
						localStyles.storageInput,
						storageInputStyle,
					]}
				/>
				<ButtonHighlight
					{...buttonPropsIdle}
					onPress={() => handleScanStorage(storageInput)}
				>
					{t('import.scanStorage')}
				</ButtonHighlight>
			</View>
		</View>
	);
};

export default memo(StepIdle);
