/**
 * External dependencies
 */
import { FC, useEffect, useRef } from 'react';
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

const LayerRendererHillshading: FC<{
	layer: LayerConfig<LayerConfigOptionsHillshading>;
	internalCacheDir?: string;
	onLayerCreated?: (layerKey: string, layerType: string) => void;
}> = ({ layer, internalCacheDir, onLayerCreated }) => {
	const opts = layer.options;

	const cacheDirBase = resolveCacheDirBase(opts.cacheDirBase, internalCacheDir);

	const appHgtDirPath = useAppSelector(selectHgtDirPath);

	// Busy key: hillshading layers create synchronously on mount.
	// Defer via setTimeout(0) so the parent BaseMap's useEffect (which adds
	// the busy key) fires first — React runs child effects before parent effects.
	const didCreateRef = useRef(false);
	useEffect(() => {
		if (!didCreateRef.current) {
			didCreateRef.current = true;
			const timeoutId = setTimeout(() => onLayerCreated?.(layer.key, 'hillshading'), 0);
			return () => clearTimeout(timeoutId);
		}
	}, [onLayerCreated, layer.key]);

	// Separate cleanup effect: remove key on unmount as safety net.
	useEffect(() => {
		return () => onLayerCreated?.(layer.key, 'hillshading');
	}, [onLayerCreated, layer.key]);

	return (opts?.hgtDirPath ?? appHgtDirPath) ? (
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
		/>
	) : undefined;
};

export default LayerRendererHillshading;
