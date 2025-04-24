
/**
 * External dependencies
 */
import {
	useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { mapTypeOptions } from '../components/MapLayersControl';
import { LayerConfig, LayerType, MapSettings } from '../types';
import { debounce, get, throttle } from 'lodash-es';

const getLayerType = ( layer : LayerConfig ) : ( LayerType | null ) => get( mapTypeOptions.find( opt => opt.key === layer.type ), 'type', null );

const useLayers = ( {
    saveOnSet,
    saveOnSetDelay = 0,
} : {
    saveOnSet?: boolean;
    saveOnSetDelay?: number;
} ) => {

    const {
		mapSettings,
		setMapSettings,
    } = useContext( AppContext );

    const [layers,setLayers] = useState<LayerConfig[]>( mapSettings?.layers || [] );
    const layersRef = useRef<LayerConfig[]>( layers );
    useEffect( () => {
        layersRef.current = layers;
    }, [layers])
    const saveLayers = () => mapSettings && setMapSettings && setMapSettings( ( mapSettings: MapSettings ) => ( {
        ...mapSettings,
        layers: layersRef.current,
    } ) );
    const saveLayersDebounced = debounce( saveLayers, saveOnSetDelay );
    // Save on unmount.
    useEffect( () => saveLayers, [] );
    // Maybe save on setLayers..
    useEffect( () => {
        if ( saveOnSet ) {
            saveLayersDebounced();
        }
    }, [layers] );

    const [editLayer, setEditLayer] = useState<null | LayerConfig>( null );

    const updateLayer = ( newLayer : LayerConfig ) => {
        if ( editLayer && editLayer.key === newLayer.key ) {
            setEditLayer( newLayer );
        }
        const itemIndex = layers.findIndex( item => item.key === newLayer.key );
        if ( -1 !== itemIndex ) {
            const newLayers = [...layers];
            newLayers[itemIndex] = newLayer;
            setLayers( newLayers );
            // if ( saveOnSet ) { saveLayers() }
        } else {
            let insertIndex = 0;
            if ( 'base' === getLayerType( newLayer ) ) {
                const indexFirstBase = layers.findIndex( layer => 'base' === getLayerType( layer ) );
                insertIndex = indexFirstBase !== -1 ? indexFirstBase : insertIndex;
            }
            const newLayers = [...layers];
            newLayers.splice(
                insertIndex,
                0,
                newLayer
            );
            setLayers( newLayers );
            // if ( saveOnSet ) { saveLayers() }
        }
    };

    return {
        editLayer,
        setEditLayer,
        updateLayer,
        layers,
        setLayers,
        saveLayers,
    };

};

export default useLayers;