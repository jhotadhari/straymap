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
} from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLayers, selectMapsforgeProfiles } from '../../selectors';
import { selectAppDirs } from '../../../dirs/selectors';
import { setLayerInfos } from '../../slice';
import LayerRendererOnlineRasterXYZ from './LayerRendererOnlineRasterXYZ';
import LayerRendererRasterMBtiles from './LayerRendererRasterMBtiles';
import LayerRendererMapsforge from './LayerRendererMapsforge';
import LayerRendererHillshading from './LayerRendererHillshading';

const BaseMap: FC<{}> = () => {
	const appDirs = useAppSelector(selectAppDirs);

	const internalCacheDir = useMemo(
		() => get(appDirs, ['internalCacheDirs', 0], undefined),
		[appDirs]
	);

	const dispatch = useAppDispatch();

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

	const layers = useAppSelector((state) => selectLayers(state, { temp: false }));

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
							/>
						);

					case 'raster-MBtiles':
						return (
							<LayerRendererRasterMBtiles
								key={layer.key}
								layer={layer as LayerConfig<LayerConfigOptionsRasterMBtiles>}
								onLayerChange={handleLayerChange}
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
							/>
						);
					}

					case 'hillshading':
						return (
							<LayerRendererHillshading
								key={layer.key}
								layer={layer as LayerConfig<LayerConfigOptionsHillshading>}
								internalCacheDir={internalCacheDir}
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
