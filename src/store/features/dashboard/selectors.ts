/**
 * Internal dependencies
 */
import { RootState } from "../../store";

export const selectInitialized = (state: RootState) =>
	state.dashboard.initialized;

export const selectElements = (state: RootState) =>
	state.dashboard.elements;

export const selectDashboardStyle = (state: RootState) =>
	state.dashboard.dashboardStyle;