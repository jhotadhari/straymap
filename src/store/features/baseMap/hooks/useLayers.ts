
/**
 * External dependencies
 */
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { debounce, get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { mapTypeOptions } from '../../../../components/MapLayersControl';
import { LayerConfig } from '../types';
import { LayerType } from '../../../../types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectLayers } from '../selectors';
import { setLayers as setLayersStore } from '../baseMapSlice';

const getLayerType = ( layer : LayerConfig ) : ( LayerType | null ) => get( mapTypeOptions.find( opt => opt.key === layer.type ), 'type', null );

const useLayers = ( {
    saveOnSet,
    saveOnSetDelay = 300,
} : {
    saveOnSet?: boolean;
    saveOnSetDelay?: number;
} ) => {

    const dispatch = useAppDispatch();

    const layersTemp = useAppSelector( state => selectLayers( state, { temp: true } ) );

    const saveLayers = useCallback( () => {
        dispatch( setLayersStore( { temp: false } ) );
    }, [] );

    const saveLayersDebounced = useMemo(
        () => debounce( saveLayers, saveOnSetDelay ),
        [saveLayers, saveOnSetDelay]
    );

    const setLayers = useCallback( ( newLayers: LayerConfig[] ) => {
        dispatch( setLayersStore( {
            temp: ! saveOnSet || ( saveOnSet && saveOnSetDelay > 0 ),
            layers: newLayers,
        } ) );
        if ( saveOnSet && saveOnSetDelay > 0 ) {
            saveLayersDebounced();
        }
    }, [
        saveOnSet,
        saveOnSetDelay,
        saveLayersDebounced,
    ] );

    // Save on unmount.
    useEffect( () => saveLayers, [] );

    const [editLayer, setEditLayer] = useState<null | LayerConfig>( null );

    const updateLayer = useCallback( ( newLayer : LayerConfig ) => {
        if ( editLayer && editLayer.key === newLayer.key ) {
            setEditLayer( newLayer );
        }
        const itemIndex = layersTemp.findIndex( item => item.key === newLayer.key );
        if ( -1 !== itemIndex ) {
            const newLayers = [...layersTemp];
            newLayers[itemIndex] = newLayer;
            setLayers( newLayers );
        } else {
            let insertIndex = 0;
            if ( 'base' === getLayerType( newLayer ) ) {
                const indexFirstBase = layersTemp.findIndex( layer => 'base' === getLayerType( layer ) );
                insertIndex = indexFirstBase !== -1 ? indexFirstBase : insertIndex;
            }
            const newLayers = [...layersTemp];
            newLayers.splice(
                insertIndex,
                0,
                newLayer
            );
            setLayers( newLayers );
        }
    }, [
        setLayers,
        layersTemp,
        editLayer,
    ] );

    return {
        editLayer,
        setEditLayer,
        updateLayer,
        layers: layersTemp,
        setLayers,
        saveLayers,
    };
};

export default useLayers;