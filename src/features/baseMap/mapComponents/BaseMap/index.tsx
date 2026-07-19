/**
 * External dependencies
 */
import { get, pick } from 'lodash-es';
import { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import {
	LayerMapsforgeResponse,
	LayerMBTilesBitmapResponse,
	ReindexScope,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import {
	LayerConfig,
	LayerConfigOptionsHillshading,
	LayerConfigOptionsMapsforge,
	LayerConfigOptionsOnlineRasterXYZ,
	LayerConfigOptionsRasterMBtiles,
} from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLayers, selectMapsforgeProfiles } from '../../selectors';
import { selectAppDirs } from '../../../dirs/selectors';
import { setLayerInfos } from '../../slice';
import { addBusyKey, removeBusyKey } from '../../../ui/slice';
import LayerRendererOnlineRasterXYZ from './LayerRendererOnlineRasterXYZ';
import LayerRendererRasterMBtiles from './LayerRendererRasterMBtiles';
import LayerRendererMapsforge from './LayerRendererMapsforge';
import LayerRendererHillshading from './LayerRendererHillshading';

const makeLayerBusyKey = (layerType: string, layerKey: string): string =>
	`map:base-layer:${layerType}:${layerKey}`;

const BaseMap: FC<{}> = () => {
	const appDirs = useAppSelector(selectAppDirs);

	const internalCacheDir = useMemo(
		() => get(appDirs, ['internalCacheDirs', 0], undefined),
		[appDirs]
	);

	const dispatch = useAppDispatch();

	const onLayerCreated = useCallback(
		(layerKey: string, layerType: string) => {
			dispatch(removeBusyKey(makeLayerBusyKey(layerType, layerKey)));
		},
		[dispatch]
	);

	// Track which layer busy keys have been added so we only dispatch addBusyKey
	// once per layer, and clean up keys for layers that are no longer visible.
	const trackedLayerKeysRef = useRef<Set<string>>(new Set());
	const layers = useAppSelector((state) => selectLayers(state, { temp: false }));
	useEffect(() => {
		const currentKeys = new Set<string>();
		for (const layer of layers) {
			if (layer.type && layer.visible) {
				const busyKey = makeLayerBusyKey(layer.type, layer.key);
				currentKeys.add(busyKey);
				if (!trackedLayerKeysRef.current.has(busyKey)) {
					trackedLayerKeysRef.current.add(busyKey);
					dispatch(addBusyKey(busyKey));
				}
			}
		}
		// Remove stale keys for layers that are no longer visible.
		for (const key of trackedLayerKeysRef.current) {
			if (!currentKeys.has(key)) {
				trackedLayerKeysRef.current.delete(key);
				dispatch(removeBusyKey(key));
			}
		}
	}, [layers, dispatch]);

	const handleLayerChange = useCallback(
		(key: string, response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse) => {
			dispatch(
				setLayerInfos((layerInfos) => ({
					...layerInfos,
					[key]: pick(response, [
						'attribution',
						'description',
						'comment',
						'createdBy',
					]),
				}))
			);
		},
		[dispatch]
	);

	const layersReverse = useMemo(() => [...layers].reverse(), [layers]);

	const profiles = useAppSelector((state) => selectMapsforgeProfiles(state, { temp: false }));

	return (
		<ReindexScope order={100}>
			{layersReverse.map((layer: LayerConfig) => {
				if (!layer.type || !layer.visible) {
					return null;
				}

				switch (layer.type) {
					case 'online-raster-xyz':
						return (
							<LayerRendererOnlineRasterXYZ
								key={layer.key}
								layer={layer as LayerConfig<LayerConfigOptionsOnlineRasterXYZ>}
								internalCacheDir={internalCacheDir}
								onLayerCreated={onLayerCreated}
							/>
						);

					case 'raster-MBtiles':
						return (
							<LayerRendererRasterMBtiles
								key={layer.key}
								layer={layer as LayerConfig<LayerConfigOptionsRasterMBtiles>}
								onLayerChange={handleLayerChange}
								onLayerCreated={onLayerCreated}
							/>
						);

					case 'mapsforge': {
						if (profiles.length === 0) {
							return null;
						}
						const mapsforgeLayer = layer as LayerConfig<LayerConfigOptionsMapsforge>;
						return (
							<LayerRendererMapsforge
								key={layer.key}
								layer={mapsforgeLayer}
								profile={
									profiles.find(
										(prof) => prof.key === mapsforgeLayer.options.profile
									) || profiles[0]
								}
								onLayerChange={handleLayerChange}
								onLayerCreated={onLayerCreated}
							/>
						);
					}

					case 'hillshading':
						return (
							<LayerRendererHillshading
								key={layer.key}
								layer={layer as LayerConfig<LayerConfigOptionsHillshading>}
								internalCacheDir={internalCacheDir}
								onLayerCreated={onLayerCreated}
							/>
						);

					default:
						return null;
				}
			})}
		</ReindexScope>
	);
};

export default BaseMap;
