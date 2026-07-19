/**
 * External dependencies
 */
import { FC, useCallback, useEffect } from 'react';
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

	const handleCreateOrChange = useLayerChangeCallback(layer.key, onLayerChange);

	// Wrap onCreate to also signal the busy key. onChange does not need this —
	// only the initial creation indicates the layer is ready.
	const handleCreate = useCallback(
		(response: LayerMapsforgeResponse) => {
			handleCreateOrChange(response);
			onLayerCreated?.(layer.key, 'mapsforge');
		},
		[
			handleCreateOrChange,
			onLayerCreated,
			layer.key,
		]
	);

	// Safety net: remove busy key on unmount in case the layer was removed
	// before onCreate fired (e.g. user toggled visibility during init).
	useEffect(() => {
		return () => onLayerCreated?.(layer.key, 'mapsforge');
	}, [onLayerCreated, layer.key]);

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

export default LayerRendererMapsforge;
