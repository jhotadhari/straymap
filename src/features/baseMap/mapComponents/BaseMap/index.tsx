/**
 * External dependencies
 */
import { get, pick } from 'lodash-es';
import { FC, useCallback, useMemo } from 'react';
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
	LayerInfo,
} from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLayers, selectMapsforgeProfiles } from '../../selectors';
import { selectAppDirs } from '../../../dirs/selectors';
import { setLayerInfos } from '../../slice';
import { removeBusyKey } from '../../../ui/slice';
import NoLayersHintModal from './NoLayersHintModal';
import LayerRendererOnlineRasterXYZ from './LayerRendererOnlineRasterXYZ';
import LayerRendererRasterMBtiles from './LayerRendererRasterMBtiles';
import LayerRendererMapsforge from './LayerRendererMapsforge';
import LayerRendererHillshading from './LayerRendererHillshading';
import { makeLayerBusyKey } from '../../utils';

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

	const layers = useAppSelector((state) => selectLayers(state, { temp: false }));

	const handleLayerChange = useCallback(
		(
			key: string,
			response:
				| LayerMapsforgeResponse
				| LayerMBTilesBitmapResponse
				| { uuid: string; nativeNodeHandle: number }
		) => {
			dispatch(
				setLayerInfos((layerInfos) => ({
					...layerInfos,
					[key]: pick(response, [
						'attribution',
						'description',
						'comment',
						'createdBy',
					]) as LayerInfo,
				}))
			);
		},
		[dispatch]
	);

	const layersReverse = useMemo(() => [...layers].reverse(), [layers]);

	const profiles = useAppSelector((state) => selectMapsforgeProfiles(state, { temp: false }));

	return (
		<>
			<NoLayersHintModal layersLength={layers.length} />
			<ReindexScope order={100}>
				{layersReverse.map((layer: LayerConfig) => {
					if (!layer.type) {
						return null;
					}

					switch (layer.type) {
						case 'online-raster-xyz':
							return (
								<LayerRendererOnlineRasterXYZ
									key={layer.key}
									layer={layer as LayerConfig<LayerConfigOptionsOnlineRasterXYZ>}
									internalCacheDir={internalCacheDir}
									onLayerChange={handleLayerChange}
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
							const mapsforgeLayer =
								layer as LayerConfig<LayerConfigOptionsMapsforge>;
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
									onLayerChange={handleLayerChange}
									onLayerCreated={onLayerCreated}
								/>
							);

						default:
							return null;
					}
				})}
			</ReindexScope>
		</>
	);
};

export default BaseMap;
