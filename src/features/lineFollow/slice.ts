/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { AppThunk } from '../../store/store';
import { selectActiveLineId } from '../trackRecording/selectors';
import { selectFollowingLineId } from './selectors';

export interface LineFollowSettings {
	/** Line currently being followed (progress tracking). Runtime-only. */
	followingLineId: number | null;
}

export interface LineFollowState extends SliceSettingsBase, LineFollowSettings {}

export const initialSettings: LineFollowSettings = {
	followingLineId: null,
};

const initialState: LineFollowState = {
	initialized: false,
	...initialSettings,
};

export const lineFollowSlice = createSlice({
	name: 'lineFollow',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setFollowingLineId: (state, action: PayloadAction<number | null>) => {
			state.followingLineId = action.payload;
		},
	},
});

export const { setInitialized, setFollowingLineId } = lineFollowSlice.actions;

export default lineFollowSlice.reducer;

/**
 * Start following a line (progress tracking along its geometry).
 *
 * Mutual exclusion with recording is per-line only: a line cannot be the
 * currently recording line AND the followed line at the same time, but a
 * different line may be recording while another is followed.
 */
export const startFollowing =
	(lineId: number): AppThunk =>
	(dispatch, getState) => {
		if (typeof lineId !== 'number') {
			return;
		}
		// Guard: the line is currently being recorded — can't follow it.
		if (selectActiveLineId(getState()) === lineId) {
			return;
		}
		dispatch(setFollowingLineId(lineId));
	};

/**
 * Stop following — clears the followed line. Recording state is untouched.
 */
export const stopFollowing = (): AppThunk => (dispatch) => {
	dispatch(setFollowingLineId(null));
};

/**
 * Clears following state when the followed line is deleted.
 */
export const clearFollowingIfMatches = (lineIds: number[]): AppThunk => {
	return (dispatch, getState) => {
		const followingLineId = selectFollowingLineId(getState());
		if (followingLineId != null && lineIds.includes(followingLineId)) {
			dispatch(setFollowingLineId(null));
		}
	};
};
