/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme, Switch, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import uuid from 'react-native-uuid';
import Sortable, { DragStartParams, SortableFlexDragEndParams } from 'react-native-sortables';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import useDropIndicatorStyle from '../../../compose/useDropIndicatorStyle';
import { selectDatePatterns } from '../selectors';
import {
	setDatePatterns,
	DatePattern,
	DATE_PATTERN_PRESETS,
} from '../slice';

const styles = StyleSheet.create({
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 8,
		paddingHorizontal: 8,
	},
	handle: {
		flexDirection: 'row',
		flexGrow: 1,
		alignItems: 'center',
	},
	handleText: {
		flexGrow: 1,
		gap: 2,
	},
	label: {
		fontSize: 14,
	},
	regexPreview: {
		fontSize: 11,
		opacity: 0.6,
		fontFamily: 'monospace',
	},
	addSection: {
		paddingHorizontal: 8,
		paddingVertical: 12,
		gap: 8,
	},
	addInput: {
		marginBottom: 8,
	},
	addRow: {
		flexDirection: 'row',
		gap: 8,
	},
	footer: {
		flexDirection: 'row',
		gap: 8,
		paddingHorizontal: 8,
		paddingVertical: 12,
		justifyContent: 'flex-end',
	},
});

const DraggableItem: FC<{
	pattern: DatePattern;
	enabled: boolean;
	onToggle: () => void;
	onDelete: () => void;
}> = memo(({ pattern, enabled, onToggle, onDelete }) => {
	const theme = useTheme();
	const buttonProps = useButtonProps({});

	const itemOpacityStyle = useMemo(
		() => ({ opacity: enabled ? 1 : 0.4 }),
		[enabled]
	);
	const handleTextColorStyle = useMemo(
		() => ({ color: theme.colors.onSurface }),
		[theme]
	);
	const regexPreviewColorStyle = useMemo(
		() => ({ color: theme.colors.onSurfaceVariant }),
		[theme]
	);

	return (
		<View
			style={[
				styles.item,
				itemOpacityStyle,
			]}
		>
			<Sortable.Handle mode="draggable" style={styles.handle}>
				<View style={styles.handleText}>
					<Text style={[styles.label, handleTextColorStyle]}>
						{pattern.label}
					</Text>
					<Text
						style={[
							styles.regexPreview,
							regexPreviewColorStyle,
						]}
					>
						/{pattern.regex}/
					</Text>
				</View>
			</Sortable.Handle>

			<Switch value={pattern.enabled} onValueChange={onToggle} />
			{pattern.removable && (
				<ButtonHighlight {...buttonProps} onPress={onDelete}>
					×
				</ButtonHighlight>
			)}
		</View>
	);
});

const DatePatternEditorModal: FC<{
	visible: boolean;
	onDismiss: () => void;
}> = ({ visible, onDismiss }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const storePatterns = useAppSelector(selectDatePatterns);

	const [localPatterns, setLocalPatterns] = useState(storePatterns);
	const [scrollEnabled, setScrollEnabled] = useState(true);

	const [showAdd, setShowAdd] = useState(false);
	const [addLabel, setAddLabel] = useState('');
	const [addRegex, setAddRegex] = useState('');
	const [addFormat, setAddFormat] = useState('');

	const dropIndicatorStyle = useDropIndicatorStyle();

	useEffect(() => {
		if (visible) setLocalPatterns(storePatterns);
	}, [visible, storePatterns]);

	const saveRef = useRef<() => void>(() => {});
	useEffect(() => {
		saveRef.current = () => dispatch(setDatePatterns(localPatterns));
	}, [dispatch, localPatterns]);

	useEffect(() => {
		return () => {
			saveRef.current();
		};
	}, []);

	const handleDismiss = useCallback(() => {
		saveRef.current();
		onDismiss();
	}, [onDismiss]);

	const handleToggle = useCallback(
		(key: string) => {
			setLocalPatterns((prev) =>
				prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p))
			);
		},
		[]
	);

	const handleDelete = useCallback(
		(key: string) => {
			setLocalPatterns((prev) => prev.filter((p) => p.key !== key));
		},
		[]
	);

	const handleAdd = useCallback(() => {
		if (!addRegex || !addFormat) return;
		const pattern: DatePattern = {
			key: uuid.v4() as string,
			regex: addRegex,
			format: addFormat,
			label: addLabel || addFormat,
			enabled: true,
			removable: true,
		};
		setLocalPatterns((prev) => [pattern, ...prev]);
		setAddLabel('');
		setAddRegex('');
		setAddFormat('');
		setShowAdd(false);
	}, [addRegex, addFormat, addLabel]);

	const handleCloseAdd = useCallback(() => {
		setShowAdd(false);
	}, []);

	const handleOpenAdd = useCallback(() => {
		setShowAdd(true);
	}, []);

	const handleReset = useCallback(() => {
		setLocalPatterns(DATE_PATTERN_PRESETS);
	}, []);

	const handleDragStart = useCallback((_params: DragStartParams) => {
		setScrollEnabled(false);
	}, []);

	const handleDragEnd = useCallback(
		({ indexToKey }: SortableFlexDragEndParams) => {
			const ordered = indexToKey
				.map((toKey) =>
					localPatterns.find((p) => p.key === toKey.replace('.$', ''))
				)
				.filter((p): p is DatePattern => !!p);
			setLocalPatterns(ordered);
			setScrollEnabled(true);
		},
		[localPatterns]
	);

	const buttonProps = useButtonProps({});

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			headerLabel={t('import.datePatternEditor')}
			scrollEnabled={scrollEnabled}
		>
			<View>
				<Sortable.Flex
					itemEntering={null}
					gap={0}
					padding={0}
					sortEnabled
					customHandle
					showDropIndicator
					dropIndicatorStyle={dropIndicatorStyle}
					flexDirection="column"
					reorderTriggerOrigin="center"
					alignItems="center"
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					{localPatterns.map((pattern) => (
						<View key={pattern.key}>
							<DraggableItem
								pattern={pattern}
								enabled={pattern.enabled}
								onToggle={() => handleToggle(pattern.key)}
								onDelete={() => handleDelete(pattern.key)}
							/>
						</View>
					))}
				</Sortable.Flex>

				{showAdd && (
					<View style={styles.addSection}>
						<TextInput
							dense
							style={styles.addInput}
							placeholder={t('import.datePatternLabel')}
							value={addLabel}
							onChangeText={setAddLabel}
						/>
						<TextInput
							dense
							style={styles.addInput}
							placeholder={t('import.datePatternRegex')}
							value={addRegex}
							onChangeText={setAddRegex}
						/>
						<TextInput
							dense
							style={styles.addInput}
							placeholder={t('import.datePatternFormat')}
							value={addFormat}
							onChangeText={setAddFormat}
						/>
						<View style={styles.footer}>
							<ButtonHighlight {...buttonProps} onPress={handleCloseAdd}>
								{t('import.cancel')}
							</ButtonHighlight>
							<ButtonHighlight {...buttonProps} onPress={handleAdd}>
								{t('import.add')}
							</ButtonHighlight>
						</View>
					</View>
				)}

				<View style={styles.footer}>
					<ButtonHighlight {...buttonProps} onPress={handleReset}>
						{t('import.resetPatterns')}
					</ButtonHighlight>
					<ButtonHighlight {...buttonProps} onPress={handleOpenAdd}>
						{t('import.addPattern')}
					</ButtonHighlight>
				</View>
			</View>
		</ModalWrapper>
	);
};

export default memo(DatePatternEditorModal);
