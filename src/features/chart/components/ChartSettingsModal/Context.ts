/**
 * External dependencies
 */
import { createContext } from 'react';

/**
 * Internal dependencies
 */
import { DEFAULT_CHART_SETTINGS, ChartSettings } from '../../types';

export type ChartSettingsMode = 'general' | 'own';

export type ChartSettingsModalContextType = {
	chartKey: string;
	settings: ChartSettings;
	update: (partial: Partial<ChartSettings>) => void;
	onDismiss: () => void;
	mode: ChartSettingsMode;
	setMode: (mode: ChartSettingsMode) => void;
	currentRatio?: number;
	fitRatio?: number;
	onFitScreen?: () => void;
};

export const ChartSettingsModalContext = createContext<ChartSettingsModalContextType>({
	chartKey: '',
	settings: DEFAULT_CHART_SETTINGS,
	update: (_partial: Partial<ChartSettings>) => undefined,
	onDismiss: () => undefined,
	mode: 'general',
	setMode: (_mode: ChartSettingsMode) => undefined,
	currentRatio: undefined,
	fitRatio: undefined,
	onFitScreen: undefined,
});
