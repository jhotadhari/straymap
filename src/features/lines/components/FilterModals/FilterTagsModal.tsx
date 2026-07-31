/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Popover from 'react-native-popover-view';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import RadioListItem from '../../../../components/generic/wrapper/RadioListItem';
import MenuItem from '../../../../components/generic/wrapper/MenuItem';
import LoadingIndicator from '../../../../components/generic/primitives/LoadingIndicator';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { sharedStyles } from './sharedDeps';
import { queryAllTags } from '../../db/queryFns';
import { TagsColumnFilter, TagsFilterOperator, getFilterKey } from '../../types';

const OPERATORS: TagsFilterOperator[] = ['has', 'notHas'];

const FilterTagsModal: FC<{
	visible: boolean;
	columnKey: string;
	existingFilter?: TagsColumnFilter;
	onDismiss: () => void;
	onSave: (filter: TagsColumnFilter) => void;
	onDelete?: () => void;
}> = ({ visible, columnKey, existingFilter, onDismiss, onSave, onDelete }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const buttonPropsDelete = useButtonProps({ isDestructive: true });

	const buttonPropsPopover = useButtonProps({ mode: 'outlined' });

	const [operator, setOperator] = useState<TagsFilterOperator>(existingFilter?.operator ?? 'has');
	const [selectedTagLabel, setSelectedTagLabel] = useState<string>(existingFilter?.value ?? '');
	const [popoverVisible, setPopoverVisible] = useState(false);

	const { data: tags, isLoading: tagsLoading } = useQuery({
		queryKey: ['tags'],
		queryFn: queryAllTags,
		enabled: visible,
		staleTime: 0,
	});

	const saveRef = useRef<undefined | (() => void)>(undefined);

	useEffect(() => {
		saveRef.current = () => {
			if (selectedTagLabel || existingFilter) {
				const newFilter: TagsColumnFilter = {
					type: 'tags',
					columnKey,
					operator,
					value: selectedTagLabel,
				};
				// If editing a filter whose key changed (e.g.,
				// different operator or tag), remove the old entry
				// so no stale entry with the old key remains.
				if (existingFilter && getFilterKey(existingFilter) !== getFilterKey(newFilter)) {
					onDelete?.();
				}
				onSave(newFilter);
			}
		};
	}, [
		columnKey,
		operator,
		selectedTagLabel,
		onSave,
		onDelete,
		existingFilter,
	]);

	const prevVisibleRef = useRef(false);
	useEffect(() => {
		const justOpened = visible && !prevVisibleRef.current;
		prevVisibleRef.current = visible;
		if (justOpened) {
			setOperator(existingFilter?.operator ?? 'has');
			setSelectedTagLabel(existingFilter?.value ?? '');
		}
	}, [visible, existingFilter]);

	const handleDismiss = useCallback(() => {
		saveRef.current?.();
		onDismiss();
	}, [onDismiss]);

	const handleDelete = useCallback(() => {
		onDelete?.();
		onDismiss();
	}, [onDelete, onDismiss]);

	const columnLabel = useMemo(() => t(`lines.columns.${columnKey}`), [t, columnKey]);

	const operatorOptions = useMemo(
		() =>
			OPERATORS.map((op) => ({
				key: op,
				label: t(`lines.filter${op.charAt(0).toUpperCase() + op.slice(1)}`),
			})),
		[t]
	);

	const tagOptions = useMemo(() => {
		const labels = new Set<string>();
		(tags ?? []).forEach((tag) => {
			if (tag.label) labels.add(tag.label);
		});
		return Array.from(labels).sort();
	}, [tags]);

	const handleSelectTag = useCallback((label: string) => {
		setSelectedTagLabel(label);
		setPopoverVisible(false);
	}, []);

	const handleDismissPopover = useCallback(() => {
		setPopoverVisible(false);
	}, []);

	const extractLabelTags = useCallback((a: { label: string }) => a.label, []);

	const handleOpenPopover = useCallback(() => setPopoverVisible(true), []);

	const anchorRef = useRef<View>(null);

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 180,
			maxHeight: 300,
		}),
		[theme]
	);

	const emptyTextStyle = useMemo(() => ({ color: theme.colors.onSurfaceVariant }), [theme]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			headerLabel={columnLabel}
			innerStyle={sharedStyles.modalInner}
		>
			{operatorOptions.map((opt) => (
				<RadioListItem
					key={opt.key}
					opt={opt}
					onPress={() => setOperator(opt.key as TagsFilterOperator)}
					status={operator === opt.key ? 'checked' : 'unchecked'}
					labelExtractor={extractLabelTags}
				/>
			))}

			<InfoLabelRow
				label={t('lines.filterValue')}
				Info={t('lines.hintTagsFilter')}
			>
				<View>
					<ButtonHighlight
						{...buttonPropsPopover}
						ref={anchorRef}
						onPress={handleOpenPopover}
					>
						{selectedTagLabel || t('lines.tagsFilterPlaceholder')}
					</ButtonHighlight>

					<Popover
						popoverStyle={popoverStyle}
						arrowSize={arrowSize}
						isVisible={popoverVisible}
						onRequestClose={handleDismissPopover}
						from={anchorRef as React.RefObject<React.Component<{}, {}, any>>}
						animationConfig={animationConfig}
					>
						{popoverVisible && (
							<ScrollView>
								{tagsLoading && (
									<View style={localStyles.loadingContainer}>
										<LoadingIndicator />
									</View>
								)}
								{!tagsLoading && tagOptions.length === 0 && (
									<View style={localStyles.emptyContainer}>
										<Text style={emptyTextStyle}>{t('lines.tagsNoTags')}</Text>
									</View>
								)}
								{!tagsLoading &&
									tagOptions.map((label) => (
										<MenuItem
											key={label}
											title={label}
											onPress={() => handleSelectTag(label)}
											active={label === selectedTagLabel}
										/>
									))}
							</ScrollView>
						)}
					</Popover>
				</View>
			</InfoLabelRow>

			{onDelete && (
				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDelete}
						{...buttonPropsDelete}
					>
						{t('lines.removeFilter')}
					</ButtonHighlight>
				</View>
			)}
		</ModalWrapper>
	);
};

const animationConfig = {
	duration: 0,
};
const arrowSize = { height: 0, width: 0 };

const localStyles = StyleSheet.create({
	tagButton: {
		borderWidth: 1,
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 6,
		minWidth: 150,
	},
	loadingContainer: {
		paddingVertical: 16,
		alignItems: 'center',
	},
	emptyContainer: {
		paddingVertical: 16,
		alignItems: 'center',
	},
});

export default FilterTagsModal;
