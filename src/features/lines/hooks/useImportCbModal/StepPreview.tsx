/**
 * External dependencies
 */
import { FC } from 'react';
import { ScrollView, View } from 'react-native';
import { Text, Checkbox, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { Feature, GeoJsonProperties, LineString } from 'geojson';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { localStyles } from './styles';
import { ImportMode } from './types';

const StepPreview: FC<{
	importMode: ImportMode;
	features: Feature<LineString, GeoJsonProperties>[];
	filename: string;
	selectedIndices: Set<number>;
	dirFiles: { uri: string; name: string }[];
	selectedFileUris: Set<string>;
	mergeMode: boolean;
	onToggleMergeMode: () => void;
	selectionCount: number;
	handleToggleFeature: (idx: number) => void;
	handleSelectAllFeatures: () => void;
	handleDeselectAllFeatures: () => void;
	handleToggleFile: (uri: string) => void;
	handleSelectAllFiles: () => void;
	handleDeselectAllFiles: () => void;
	handleImport: () => void;
	buttonPropsImport: Record<string, unknown>;
}> = ({
	importMode,
	features,
	filename,
	selectedIndices,
	dirFiles,
	selectedFileUris,
	mergeMode,
	onToggleMergeMode,
	selectionCount,
	handleToggleFeature,
	handleSelectAllFeatures,
	handleDeselectAllFeatures,
	handleToggleFile,
	handleSelectAllFiles,
	handleDeselectAllFiles,
	handleImport,
	buttonPropsImport,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<View>
			{importMode === 'file' ? (
				<>
					<Text style={localStyles.filename}>{filename}</Text>
					<Text style={localStyles.featureCount}>
						{sprintf(t('lines.importFeatureCount'), features.length)}
					</Text>

					<View style={localStyles.selectRow}>
						<ButtonHighlight
							compact
							onPress={handleSelectAllFeatures}
						>
							{t('lines.selectAll')}
						</ButtonHighlight>
						<ButtonHighlight
							compact
							onPress={handleDeselectAllFeatures}
						>
							{t('lines.selectNone')}
						</ButtonHighlight>
					</View>

					<ScrollView
						style={localStyles.featureList}
						horizontal={false}
					>
						{features.map((feature, idx) => (
							<View
								key={idx}
								style={[
									localStyles.featureRow,
									{ borderColor: theme.colors.outline },
								]}
							>
								<Checkbox
									status={
										selectedIndices.has(idx) ? 'checked' : 'unchecked'
									}
									onPress={() => handleToggleFeature(idx)}
								/>
								<Text>
									{feature.properties?.name ??
										sprintf(t('lines.importTrackN'), idx + 1)}
								</Text>
							</View>
						))}
					</ScrollView>
				</>
			) : (
				<>
					<Text style={localStyles.featureCount}>
						{sprintf(t('lines.importDirFilesFound'), dirFiles.length)}
					</Text>

					<View style={localStyles.selectRow}>
						<ButtonHighlight
							compact
							onPress={handleSelectAllFiles}
						>
							{t('lines.selectAll')}
						</ButtonHighlight>
						<ButtonHighlight
							compact
							onPress={handleDeselectAllFiles}
						>
							{t('lines.selectNone')}
						</ButtonHighlight>
					</View>

					<ScrollView
						style={localStyles.featureList}
						horizontal={false}
					>
						{dirFiles.map((file) => (
							<View
								key={file.uri}
								style={[
									localStyles.featureRow,
									{ borderColor: theme.colors.outline },
								]}
							>
								<Checkbox
									status={
										selectedFileUris.has(file.uri)
											? 'checked'
											: 'unchecked'
									}
									onPress={() => handleToggleFile(file.uri)}
								/>
								<Text>{file.name}</Text>
							</View>
						))}
					</ScrollView>
				</>
			)}

			{/* ---- merge mode toggle (shown for both modes) ---- */}
			<View
				style={[
					localStyles.featureRow,
					localStyles.mergeToggle,
					{ borderColor: theme.colors.outline },
				]}
			>
				<Checkbox
					status={mergeMode ? 'checked' : 'unchecked'}
					onPress={onToggleMergeMode}
				/>
				<Text>{t('lines.importMergeMode')}</Text>
			</View>

			{/* ---- import button ---- */}
			<View style={localStyles.importControls}>
				<ButtonHighlight
					{...buttonPropsImport}
					onPress={handleImport}
				>
					{sprintf(t('lines.importSelected'), selectionCount)}
				</ButtonHighlight>
			</View>
		</View>
	);
};

export default StepPreview;
