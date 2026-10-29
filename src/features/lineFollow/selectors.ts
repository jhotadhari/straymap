/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.lineFollow.initialized;
export const selectFollowingLineId = (state: RootState) => state.lineFollow.followingLineId;
export const selectIsFollowing = (state: RootState) => state.lineFollow.followingLineId != null;
