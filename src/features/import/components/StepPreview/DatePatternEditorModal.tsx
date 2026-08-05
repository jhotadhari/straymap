/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Text, useTheme, Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import uuid from 'react-native-uuid';
import Sortable, { DragStartParams, SortableFlexDragEndParams } from 'react-native-sortables';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import useDropIndicatorStyle from '../../../../compose/useDropIndicatorStyle';
import { selectDatePatterns } from '../../selectors';
import { setDatePatterns, DatePattern, DATE_PATTERN_PRESETS } from '../../slice';
import DatePatternAddPatternModal from './DatePatternAddPatternModal';
import { sharedStyles } from '../../../../sharedStyles';
import { MODAL_PADDING, MODAL_WIDTH_FACTOR } from '../../../../constants';

const DraggableItem: FC<{
	pattern: DatePattern;
	enabled: boolean;
	onToggle: () => void;
	onDelete: () => void;
	onEdit: () => void;
}> = memo(({ pattern, enabled, onToggle, onDelete, onEdit }) => {
	const theme = useTheme();

	const { width: screenW } = Dimensions.get('window');

	const itemOpacityStyle = useMemo(() => ({ opacity: enabled ? 1 : 0.4 }), [enabled]);
	const itemWidthStyle = useMemo(
		() => ({
			width: screenW * MODAL_WIDTH_FACTOR - 2 * MODAL_PADDING,
		}),
		[screenW]
	);
	const handleTextColorStyle = useMemo(() => ({ color: theme.colors.onSurface }), [theme]);
	const formatTextColorStyle = useMemo(() => ({ color: theme.colors.onSurfaceVariant }), [theme]);
	const regexPreviewColorStyle = useMemo(
		() => ({ color: theme.colors.onSurfaceVariant }),
		[theme]
	);

	return (
		<View
			style={[
				styles.item,
				itemOpacityStyle,
				itemWidthStyle,
			]}>
			<Sortable.Handle
				mode="draggable"
				style={styles.handle}
			>
				<View style={styles.handleText}>
					<Text style={[styles.label, handleTextColorStyle]}>
						{pattern.label}
					</Text>
					<Text
						style={[
							styles.formatText,
							formatTextColorStyle,
						]}
					>
						{pattern.format}
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

			<View style={styles.controls}>
				<View style={styles.editActions}>
					{pattern.removable && (
						<>
							<IconButtonHighlight
								icon="cog"
								size={20}
								onPress={onEdit}
							/>
							<IconButtonHighlight
								icon="delete-outline"
								size={20}
								onPress={onDelete}
							/>
						</>
					)}
				</View>
				<Switch
					value={pattern.enabled}
					onValueChange={onToggle}
				/>
			</View>
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
	const [editingPattern, setEditingPattern] = useState<DatePattern | null>(null);

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

	const handleToggle = useCallback((key: string) => {
		setLocalPatterns((prev) =>
			prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p))
		);
	}, []);

	const handleDelete = useCallback((key: string) => {
		setLocalPatterns((prev) => prev.filter((p) => p.key !== key));
	}, []);

	const handleSave = useCallback((saved: DatePattern) => {
		if (saved.key) {
			setLocalPatterns((prev) =>
				prev.map((p) => (p.key === saved.key ? saved : p))
			);
		} else {
			setLocalPatterns((prev) => [
				{ ...saved, key: uuid.v4() as string, removable: true },
				...prev,
			]);
		}
		setEditingPattern(null);
	}, []);

	const handleOpenAdd = useCallback(() => {
		setEditingPattern(null);
		setShowAdd(true);
	}, []);

	const handleCloseAdd = useCallback(() => {
		setShowAdd(false);
		setEditingPattern(null);
	}, []);

	const handleOpenEdit = useCallback((pattern: DatePattern) => {
		setEditingPattern(pattern);
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
				.map((toKey) => localPatterns.find((p) => p.key === toKey.replace('.$', '')))
				.filter((p): p is DatePattern => !!p);
			setLocalPatterns(ordered);
			setScrollEnabled(true);
		},
		[localPatterns]
	);

	const buttonProps = useButtonProps({});

	return (
		<>
			<ModalWrapper
				visible={visible}
				onDismiss={handleDismiss}
				headerLabel={t('import.datePatternEditor')}
				scrollEnabled={scrollEnabled}
			>
				<View style={sharedStyles.modal}>
					<View style={styles.modalControls}>
						<ButtonHighlight
							{...buttonProps}
							onPress={handleReset}
						>
							{t('import.resetPatterns')}
						</ButtonHighlight>
						<ButtonHighlight
							{...buttonProps}
							onPress={handleOpenAdd}
						>
							{t('import.addPattern')}
						</ButtonHighlight>
					</View>

					<Sortable.Flex
						itemEntering={null}
						gap={16}
						padding={0}
						sortEnabled
						customHandle
						showDropIndicator
						dropIndicatorStyle={dropIndicatorStyle}
						flexDirection="column"
						reorderTriggerOrigin="center"
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
									onEdit={() => handleOpenEdit(pattern)}
								/>
							</View>
						))}
					</Sortable.Flex>
				</View>
			</ModalWrapper>

			<DatePatternAddPatternModal
				visible={showAdd}
				onDismiss={handleCloseAdd}
				pattern={editingPattern}
				onSave={handleSave}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
	},
	handle: {
		flexDirection: 'row',
		flex: 1,
		minWidth: 0,
	},
	handleText: {
		flex: 1,
		minWidth: 0,
		gap: 2,
		flexDirection: 'column',
	},
	label: {
		fontSize: 14,
	},
	formatText: {
		fontSize: 12,
		opacity: 0.7,
		fontFamily: 'monospace',
	},
	regexPreview: {
		fontSize: 11,
		opacity: 0.6,
		fontFamily: 'monospace',
	},
	modalControls: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	controls: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	editActions: {
		width: 76,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
});

export default memo(DatePatternEditorModal);
