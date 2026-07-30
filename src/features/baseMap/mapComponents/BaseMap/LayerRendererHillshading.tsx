/**
 * External dependencies
 */
import { FC, memo, useCallback } from 'react';
import { LayerHillshading, LayerHillshadingProps } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsHillshading } from '../../types';
import {
	getHillshadingCacheDirChild,
	getShadingAlgorithmOptions,
	resolveCacheDirBase,
	SHADING_ALGORITHM,
} from '../../utils';
import { useAppSelector } from '../../../../store/hooks';
import { selectHgtDirPath } from '../../selectors';
import useLayerChangeCallback from './useLayerChangeCallback';
import { useMakeLayerBusy } from './useMakeLayerBusy';

const LayerRendererHillshading: FC<{
	layer: LayerConfig<LayerConfigOptionsHillshading>;
	internalCacheDir?: string;
	onLayerChange: (key: string, response: { uuid: string; nativeNodeHandle: number }) => void;
	onLayerCreated?: (layerKey: string, layerType: string) => void;
}> = ({ layer, internalCacheDir, onLayerChange, onLayerCreated }) => {
	const opts = layer.options;

	const cacheDirBase = resolveCacheDirBase(opts.cacheDirBase, internalCacheDir);

	const appHgtDirPath = useAppSelector(selectHgtDirPath);

	const hasSource = !!(opts?.hgtDirPath ?? appHgtDirPath);
	useMakeLayerBusy(layer.key, 'hillshading', layer.visible && hasSource);

	const handleCreateOrChange = useLayerChangeCallback(layer.key, onLayerChange);

	const handleCreate = useCallback(
		(response: { uuid: string; nativeNodeHandle: number }) => {
			handleCreateOrChange(response);
			onLayerCreated?.(layer.key, 'hillshading');
		},
		[handleCreateOrChange, onLayerCreated, layer.key]
	);

	if (!layer.visible || !hasSource) return null;

	return (
		<LayerHillshading
			key={layer.key}
			hgtDirPath={opts?.hgtDirPath ?? appHgtDirPath}
			zoomMin={opts.zoomMin}
			zoomMax={opts.zoomMax}
			enabledZoomMin={opts.enabledZoomMin}
			enabledZoomMax={opts.enabledZoomMax}
			magnitude={opts.magnitude}
			cacheSize={opts.cacheSize}
			cacheDirChild={getHillshadingCacheDirChild(opts)}
			cacheDirBase={cacheDirBase as LayerHillshadingProps['cacheDirBase']}
			shadingAlgorithm={SHADING_ALGORITHM}
			shadingAlgorithmOptions={getShadingAlgorithmOptions(opts)}
			onCreate={handleCreate}
			onChange={handleCreateOrChange}
		/>
	);
};

export default memo(LayerRendererHillshading);
