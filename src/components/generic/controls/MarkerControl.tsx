/**
 * External dependencies
 */
import React, { ElementType, FC, ReactNode, useCallback, useMemo } from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../types';
import { AbsPath } from '../../../features/dirs/types';
import InfoLabelRow from '../infoWrapper/InfoLabelRow';
import ListItemModalControl from '../wrapper/ListItemModalControl';
import NumericRowControl from './NumericRowControl';
import FileSourceRowControl from './FileSourceRowControl';
import ColorPaletteInline from './ColorPaletteInline';

export interface MarkerConfig {
	iconSource: string;
	size: number;
	color: string;
}

const validateSize = (val: number) => val >= 0 && val <= 1000;

const isFileSource = (iconSource: string) =>
	iconSource.startsWith('/') || iconSource.startsWith('content://');

/**
 * Generic marker-style config control (icon preset/custom file, size,
 * color, live preview, optional extra rows) — shared by the appearance
 * cursor control and the GNSS position-marker control. Wrapped in a
 * ListItemModalControl anchor row.
 */
const MarkerControl: FC<{
	anchorLabel: string;
	header: string;
	config: MarkerConfig;
	onUpdate: (partial: Partial<MarkerConfig>) => void;
	defaultIconSource: string;
	initialOptionsByPath: Record<string, OptionBase[]>;
	extensions: string[];
	dirs: AbsPath[];
	PreviewComponent: ElementType<{ config: MarkerConfig }>;
	/** Config used for the anchor-row preview (e.g. size/color overrides). */
	anchorPreviewConfig?: MarkerConfig;
	hintFile: string;
	hintSize: string;
	hintColor: string;
	hintPreview: string;
	fileRowHeader: string;
	fileRowLabel: string;
	filesHeading: string;
	noFilesHeading: string;
	sizeLabel: string;
	colorLabel: string;
	previewLabel: string;
	extraRows?: ReactNode;
}> = ({
	anchorLabel,
	header,
	config,
	onUpdate,
	defaultIconSource,
	initialOptionsByPath,
	extensions,
	dirs,
	PreviewComponent,
	anchorPreviewConfig,
	hintFile,
	hintSize,
	hintColor,
	hintPreview,
	fileRowHeader,
	fileRowLabel,
	filesHeading,
	noFilesHeading,
	sizeLabel,
	colorLabel,
	previewLabel,
	extraRows,
}) => {
	const handleSizeUpdate = useCallback(
		(newValue: number) => onUpdate({ size: newValue }),
		[onUpdate]
	);

	const handleFileSelect = useCallback(
		(newFileSource?: string) => onUpdate({ iconSource: newFileSource ?? defaultIconSource }),
		[onUpdate, defaultIconSource]
	);

	const handleColorChange = useCallback(
		(newColor: string) => onUpdate({ color: newColor }),
		[onUpdate]
	);

	const anchorPreview = useMemo(
		() => anchorPreviewConfig ?? config,
		[anchorPreviewConfig, config]
	);

	return (
		<ListItemModalControl
			anchorLabel={anchorLabel}
			anchorIcon={({ color, style }) => (
				<View style={style}>
					<PreviewComponent
						config={{
							...anchorPreview,
							color: anchorPreviewConfig?.color ?? color,
						}}
					/>
				</View>
			)}
			header={header}
		>
			<FileSourceRowControl
				header={fileRowHeader}
				label={fileRowLabel}
				value={config.iconSource}
				onSelect={handleFileSelect}
				initialOptionsByPath={initialOptionsByPath}
				extensions={extensions}
				dirs={dirs}
				Info={hintFile}
				filesHeading={filesHeading}
				noFilesHeading={noFilesHeading}
			/>

			<NumericRowControl
				label={sizeLabel}
				value={config.size}
				onUpdate={handleSizeUpdate}
				validate={validateSize}
				Info={hintSize}
			/>

			{config?.iconSource && !isFileSource(config.iconSource) && (
				<InfoLabelRow
					label={colorLabel}
					Info={hintColor}
				>
					<ColorPaletteInline
						selectedColor={config?.color}
						onSelect={handleColorChange}
					/>
				</InfoLabelRow>
			)}

			{extraRows}

			<InfoLabelRow
				label={previewLabel}
				Info={hintPreview}
			>
				<PreviewComponent config={config} />
			</InfoLabelRow>
		</ListItemModalControl>
	);
};

export default MarkerControl;
