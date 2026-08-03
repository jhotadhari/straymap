/**
 * External dependencies
 */
import { FC, memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { FlashList, ListRenderItem } from '@shopify/flash-list';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { useImportContext } from '../ImportContext';
import ListItem from '../../../../components/generic/wrapper/ListItem';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { localStyles } from '../styles';

const FeatureFileList: FC = () => {
	const { t } = useTranslation();
	const {
		importMode,
		features,
		filename,
		selectedIndices,
		dirFiles,
		selectedFileUris,
		handleToggleFeature,
		handleSelectAllFeatures,
		handleDeselectAllFeatures,
		handleToggleFile,
		handleSelectAllFiles,
		handleDeselectAllFiles,
	} = useImportContext();

	const [modalVisible, setModalVisible] = useState(false);

	const handleOpenModal = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => {
		setModalVisible(false);
	}, []);

	const anchorButtonProps = useButtonProps({});

	const buttonPropsSelect = useButtonProps({});

	const fileCount = useMemo(
		() => (importMode === 'directory' ? dirFiles.length : features.length),
		[importMode, dirFiles.length, features.length]
	);

	const anchorLabel = useMemo(
		() =>
			importMode === 'file'
				? `${filename}  —  ${sprintf(t('import.featureCount'), features.length)}`
				: sprintf(t('import.dirFilesFound'), fileCount),
		[importMode, filename, features.length, fileCount, t]
	);

	const listData = useMemo(
		() => (importMode === 'file' ? features : dirFiles),
		[importMode, features, dirFiles]
	);

	const keyExtractor = useCallback(
		(item: unknown, index: number) =>
			importMode === 'file' ? String(index) : (item as { uri: string }).uri,
		[importMode]
	);

	const renderItem: ListRenderItem<unknown> = useCallback(
		({ item, index }) => {
			if (importMode === 'file') {
				const feature = item as (typeof features)[number];
				return (
					<ListItem
						key={index}
						title={
							feature.properties?.name ??
							sprintf(t('import.trackN'), index + 1)
						}
						icon={(props) => (
							<Checkbox
								{...props}
								status={selectedIndices.has(index) ? 'checked' : 'unchecked'}
								onPress={() => handleToggleFeature(index)}
							/>
						)}
						onPress={() => handleToggleFeature(index)}
					/>
				);
			}
			const file = item as (typeof dirFiles)[number];
			return (
				<ListItem
					key={file.uri}
					title={file.name}
					icon={(props) => (
						<Checkbox
							{...props}
							status={
								selectedFileUris.has(file.uri) ? 'checked' : 'unchecked'
							}
							onPress={() => handleToggleFile(file.uri)}
						/>
					)}
					onPress={() => handleToggleFile(file.uri)}
				/>
			);
		},
		[
			importMode,
			selectedIndices,
			selectedFileUris,
			handleToggleFeature,
			handleToggleFile,
			t,
		]
	);

	return (
		<>
			<ButtonHighlight {...anchorButtonProps} onPress={handleOpenModal}>
				{anchorLabel}
			</ButtonHighlight>

			{modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					onDismiss={handleDismissModal}
					headerLabel={t('import.title')}
					scrollEnabled={false}
				>
					<View style={localStyles.selectRow}>
						<ButtonHighlight
							{...buttonPropsSelect}
							onPress={
								importMode === 'file'
									? handleSelectAllFeatures
									: handleSelectAllFiles
							}
						>
							{t('lines.selectAll')}
						</ButtonHighlight>
						<ButtonHighlight
							{...buttonPropsSelect}
							onPress={
								importMode === 'file'
									? handleDeselectAllFeatures
									: handleDeselectAllFiles
							}
						>
							{t('lines.selectNone')}
						</ButtonHighlight>
					</View>

					<FlashList
						data={listData}
						keyExtractor={keyExtractor}
						renderItem={renderItem}
					/>
				</ModalWrapper>
			)}
		</>
	);
};

export default memo(FeatureFileList);
