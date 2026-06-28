/**
 * @format
 */

import 'react-native';
import React from 'react';

// Mock Redux hooks so App can render without a <Provider>. This keeps the
// smoke test simple — it verifies the import chain, component structure,
// and that the render doesn't throw synchronously.
jest.mock('../src/store/hooks', () => ({
	useAppSelector: jest.fn(() => undefined),
	useAppDispatch: jest.fn(() => jest.fn()),
	useSettingsInitialized: jest.fn(() => [true]),
}));

import App from '../src/components/App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
	renderer.create(<App />);
});
