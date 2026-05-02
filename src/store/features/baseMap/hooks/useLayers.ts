
/**
 * External dependencies
 */
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
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
    saveOnSetDelay = 0,
} : {
    saveOnSet?: boolean;
    saveOnSetDelay?: number;
} ) => {

    const dispatch = useAppDispatch();

    const layersStore = useAppSelector( selectLayers );

    const [layers,setLayers_] = useState<LayerConfig[]>( layersStore );
    const layersRef = useRef<LayerConfig[]>( layers );

    useEffect( () => {
        setLayers_( layersStore );
        layersRef.current = layersStore;
    }, [layersStore] );

    const saveLayers = useCallback( () => {
        dispatch( setLayersStore( layersRef.current ) );
    }, [] );

    const saveLayersDebounced = useMemo(
        () => debounce( saveLayers, saveOnSetDelay ),
        [saveLayers, saveOnSetDelay]
    );

    const setLayers = useCallback( ( newLayers: LayerConfig[] ) => {
        setLayers_( newLayers );
        layersRef.current = newLayers;
        if ( saveOnSet ) {
            saveLayersDebounced();
        }
    }, [
        saveOnSet,
        saveLayersDebounced,
    ] );

    // Save on unmount.
    useEffect( () => saveLayers, [] );

    const [editLayer, setEditLayer] = useState<null | LayerConfig>( null );

    const updateLayer = useCallback( ( newLayer : LayerConfig ) => {
        if ( editLayer && editLayer.key === newLayer.key ) {
            setEditLayer( newLayer );
        }
        const itemIndex = layers.findIndex( item => item.key === newLayer.key );
        if ( -1 !== itemIndex ) {
            const newLayers = [...layers];
            newLayers[itemIndex] = newLayer;
            setLayers( newLayers );
            if ( saveOnSet ) { saveLayersDebounced() }
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
            if ( saveOnSet ) { saveLayersDebounced() }
        }
    }, [
        layers,
        editLayer,
        saveOnSet,
        saveLayersDebounced,
    ] );

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