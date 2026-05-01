/**
 * External dependencies
 */
import { createSelector } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { RootState } from './store';

const createAppSelector = createSelector.withTypes<RootState>();

export default createAppSelector;
