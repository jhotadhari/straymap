/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Popover, { PopoverPlacement } from 'react-native-popover-view';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import RadioListItem from '../../../../components/generic/wrapper/RadioListItem';
import MenuItem from '../../../../components/generic/wrapper/MenuItem';
import LoadingIndicator from '../../../../components/generic/primitives/LoadingIndicator';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { sharedStyles } from './sharedDeps';
import { queryAllTags } from '../../db/queryFns';
import { TagsColumnFilter, TagsFilterOperator } from '../../types';

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
				onSave({
					type: 'tags',
					columnKey,
					operator,
					value: selectedTagLabel,
				});
			}
		};
	}, [
		columnKey,
		operator,
		selectedTagLabel,
		onSave,
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

	const tagButtonStyle = useMemo(
		() => [
			localStyles.tagButton,
			{
				borderColor: theme.colors.outline,
				backgroundColor: theme.colors.surfaceVariant,
			},
		],
		[theme]
	);

	const tagButtonTextStyle = useMemo(
		() => ({
			color: selectedTagLabel ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
		}),
		[theme, selectedTagLabel]
	);

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
					labelExtractor={(a) => a.label}
				/>
			))}

			<InfoLabelRow
				label={t('lines.filterValue')}
				Info={t('lines.hintTagsFilter')}
			>
				<View>
					<ButtonHighlight
						ref={anchorRef}
						onPress={() => setPopoverVisible(true)}
						mode="outlined"
						style={tagButtonStyle}
					>
						<Text style={tagButtonTextStyle}>
							{selectedTagLabel || t('lines.tagsFilterPlaceholder')}
						</Text>
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
										<Text style={{ color: theme.colors.onSurfaceVariant }}>
											{t('lines.tagsNoTags')}
										</Text>
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
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('lines.removeFilter')}</Text>
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
