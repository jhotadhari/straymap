/**
 * External dependencies
 */
import { FC, memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextProps } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { AbsPath } from '../../dirs/types';
import { labelFromAppPath } from '../../../lib/utils';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import RadioListItem from '../../../components/generic/wrapper/RadioListItem';

const styles = StyleSheet.create({
	hint: {
		fontSize: 13,
		marginBottom: 12,
		lineHeight: 18,
	},
});

const ImportDirPicker: FC<{
	appDirs: AbsPath[];
	onSelectAppDir: (path: AbsPath) => void;
	onSelectCustom: () => void;
	disabled?: boolean;
	buttonProps: Record<string, unknown>;
}> = ({ appDirs, onSelectAppDir, onSelectCustom, disabled, buttonProps }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [modalVisible, setModalVisible] = useState(false);

	const handleShowModal = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleCloseModal = useCallback(() => {
		setModalVisible(false);
	}, []);

	const appDirOpts = useMemo(
		() =>
			appDirs.map((p) => ({
				key: p,
				label: labelFromAppPath(p),
			})),
		[appDirs]
	);

	const handleSelectDir = useCallback(
		(path: AbsPath) => {
			handleCloseModal();
			onSelectAppDir(path);
		},
		[handleCloseModal, onSelectAppDir]
	);

	const handleSelectCustom = useCallback(() => {
		handleCloseModal();
		onSelectCustom();
	}, [handleCloseModal, onSelectCustom]);

	const labelStyle: TextProps['style'] = useMemo(
		() => [theme.fonts.bodyMedium],
		[theme]
	);

	return (
		<>
			<ButtonHighlight {...buttonProps} onPress={handleShowModal} disabled={disabled}>
				{t('import.pickDirectory')}
			</ButtonHighlight>

			{modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					onDismiss={handleCloseModal}
					headerLabel={t('import.pickDirectory')}
				>
					<ScrollView>
						<Text
							style={[
								styles.hint,
								{ color: theme.colors.onSurfaceVariant },
							]}
						>
							{t('import.dirHint')}
						</Text>

						{appDirOpts.map((opt) => (
							<RadioListItem
								key={opt.key}
								opt={opt}
								labelExtractor={(a) => a.label}
								descExtractor={(a) => a.key}
								onPress={() => handleSelectDir(opt.key as AbsPath)}
								labelStyle={labelStyle}
							/>
						))}

						<RadioListItem
							key="__custom__"
							opt={{ key: '__custom__', label: t('import.customDir') }}
							labelExtractor={(a) => a.label}
							onPress={handleSelectCustom}
							labelStyle={labelStyle}
						/>
					</ScrollView>
				</ModalWrapper>
			)}
		</>
	);
};

export default memo(ImportDirPicker);
