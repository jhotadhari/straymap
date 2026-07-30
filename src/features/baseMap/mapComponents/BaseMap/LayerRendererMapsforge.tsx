/**
 * External dependencies
 */
import { FC, memo, useCallback } from 'react';
import {
	LayerMapsforge,
	LayerMapsforgeProps,
	LayerMapsforgeResponse,
	LayerMBTilesBitmapResponse,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsMapsforge, MapsforgeProfile } from '../../types';
import useLayerChangeCallback from './useLayerChangeCallback';
import { useMakeLayerBusy } from './useMakeLayerBusy';

const LayerRendererMapsforge: FC<{
	layer: LayerConfig<LayerConfigOptionsMapsforge>;
	profile: MapsforgeProfile;
	onLayerChange: (
		key: string,
		response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse
	) => void;
	onLayerCreated?: (layerKey: string, layerType: string) => void;
}> = ({ layer, profile, onLayerChange, onLayerCreated }) => {
	const opts = layer.options;

	const hasSource = !!opts.mapFile;
	useMakeLayerBusy(layer.key, 'mapsforge', layer.visible && hasSource);

	const handleCreateOrChange = useLayerChangeCallback(layer.key, onLayerChange);

	const handleCreate = useCallback(
		(response: LayerMapsforgeResponse) => {
			handleCreateOrChange(response);
			onLayerCreated?.(layer.key, 'mapsforge');
		},
		[handleCreateOrChange, onLayerCreated, layer.key]
	);

	if (!layer.visible || !hasSource) return null;

	return (
		<LayerMapsforge
			key={layer.key}
			enabledZoomMin={opts.enabledZoomMin}
			enabledZoomMax={opts.enabledZoomMax}
			mapFile={opts.mapFile}
			renderTheme={profile.theme as LayerMapsforgeProps['renderTheme']}
			renderStyle={profile.renderStyle || undefined}
			renderOverlays={profile.renderOverlays}
			hasBuildings={profile.hasBuildings}
			hasLabels={profile.hasLabels}
			onCreate={handleCreate}
			onChange={handleCreateOrChange}
		/>
	);
};

export default memo(LayerRendererMapsforge);
