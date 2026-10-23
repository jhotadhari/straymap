/**
 * External dependencies
 */
import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../components/generic/wrapper/ModalWrapper';
import IconButtonHighlight from '../../components/generic/primitives/IconButtonHighlight';
import { ErrorToastContext } from '../../components/ErrorToast/Context';
import { useAppSelector } from '../../store/hooks';
import { selectUnitPrefs } from '../general/selectors';
import { buildShareRows, ShareRow } from './shareRows';

const COPY_FEEDBACK_DURATION = 1500;

/**
 * Modal listing shareable representations of a position: coordinates in
 * the user's configured format, plain decimal coordinates, and links for
 * common map apps. Each row shows the value in a disabled text field with
 * copy and share buttons.
 */
const SharePositionModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	lng: number;
	lat: number;
	zoomLevel?: number;
}> = ({ visible, onDismiss, lng, lat, zoomLevel }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const { showError } = useContext(ErrorToastContext);

	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const rows = useMemo(
		() => buildShareRows(lng, lat, zoomLevel, unitPrefs.coordinates, t),
		[
			lng,
			lat,
			zoomLevel,
			unitPrefs.coordinates,
			t,
		]
	);

	useEffect(
		() => () => {
			if (copiedTimeoutRef.current) {
				clearTimeout(copiedTimeoutRef.current);
			}
		},
		[]
	);

	const textInputTheme = useMemo(
		() => ({
			fonts: {
				bodyLarge: {
					...theme.fonts.bodySmall,
					fontFamily: 'sans-serif',
				},
			},
		}),
		[theme]
	);

	const handleCopy = useCallback(
		(row: ShareRow) => {
			try {
				Clipboard.setString(row.value);
			} catch {
				showError(t('mapContextMenu.copyError'));
				return;
			}
			setCopiedKey(row.key);
			if (copiedTimeoutRef.current) {
				clearTimeout(copiedTimeoutRef.current);
			}
			copiedTimeoutRef.current = setTimeout(() => setCopiedKey(null), COPY_FEEDBACK_DURATION);
		},
		[showError, t]
	);

	const handleShare = useCallback(
		async (row: ShareRow) => {
			try {
				await Share.share({ message: row.value });
			} catch {
				showError(t('mapContextMenu.shareError'));
			}
		},
		[showError, t]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={t('mapContextMenu.sharePosition')}
		>
			<View style={styles.list}>
				{rows.map((row) => (
					<View
						key={row.key}
						style={styles.row}
					>
						<Text
							variant="labelSmall"
							style={styles.rowLabel}
						>
							{t(`mapContextMenu.${row.labelKey}`)}
						</Text>
						<View style={styles.valueRow}>
							<TextInput
								disabled={true}
								dense={true}
								theme={textInputTheme}
								style={styles.valueInput}
								value={row.value}
							/>
							<View style={styles.buttons}>
								<IconButtonHighlight
									icon={copiedKey === row.key ? 'check' : 'content-copy'}
									size={20}
									onPress={() => handleCopy(row)}
									accessibilityLabel={t('mapContextMenu.copy')}
									style={styles.button}
								/>
								<IconButtonHighlight
									icon="share-variant-outline"
									size={20}
									onPress={() => handleShare(row)}
									accessibilityLabel={t('mapContextMenu.share')}
									style={styles.button}
								/>
							</View>
						</View>
					</View>
				))}
			</View>
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	list: {
		marginTop: 16,
		gap: 16,
	},
	row: {
		gap: 0,
	},
	rowLabel: {
		marginLeft: 2,
	},
	valueRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	valueInput: {
		flex: 1,
	},
	buttons: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	button: {
		marginHorizontal: -2,
	},
});

export default SharePositionModal;
