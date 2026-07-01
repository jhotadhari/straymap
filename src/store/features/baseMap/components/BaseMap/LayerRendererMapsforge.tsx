/**
 * External dependencies
 */
import { FC } from 'react';
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
}> = ({ layer, profile, onLayerChange }) => {
	const opts = layer.options;

	const handleCreateOrChange = useLayerChangeCallback(layer.key, onLayerChange);

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
			onCreate={handleCreateOrChange}
			onChange={handleCreateOrChange}
		/>
	);
};

export default LayerRendererMapsforge;
