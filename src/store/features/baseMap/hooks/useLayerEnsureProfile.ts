
/**
 * External dependencies
 */
import {
    useCallback,
} from 'react';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsMapsforge, MapsforgeProfile } from '../types';
import { useAppSelector } from '../../../hooks';
import { selectMapsforgeProfiles } from '../selectors';

export const useLayerEnsureProfile = () => {

    const profilesStore = useAppSelector( selectMapsforgeProfiles );

    const layerMissingProfile = useCallback( ( layer: LayerConfig, profiles?: MapsforgeProfile[] ) => {
        profiles = profiles ?? profilesStore;
        if ( 'mapsforge' !== layer.type ) {
            return false;
        }
        const options = layer.options as LayerConfigOptionsMapsforge;
        if (
            'default' === options.profile ||
            profiles.find( prof => prof.key === options.profile )
        ) {
            return false;
        }
        return true;

    }, [profilesStore] );

    const layerEnsureProfile = useCallback( ( layer: LayerConfig, profiles?: MapsforgeProfile[] ) => {
        profiles = profiles ?? profilesStore;
        return layerMissingProfile( layer, profiles ) ? {
            ...layer,
            options: {
                ...layer.options,
                profile: 'default',
            },
        } : layer;
    }, [profilesStore,layerMissingProfile] );

    return {
        layerMissingProfile,
        layerEnsureProfile,
    };
};

export default useLayerEnsureProfile;