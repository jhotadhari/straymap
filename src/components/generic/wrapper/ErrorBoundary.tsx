/**
 * External dependencies
 */
import { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { logError } from '../../../lib/utils';

interface Props {
	fallback: (reset: () => void) => ReactNode;
	children: ReactNode;
}

interface State {
	error: Error | null;
}

/**
 * Generic error boundary. Renders `fallback(reset)` when a descendant
 * throws during render or layout-effect commit; `reset` clears the
 * boundary so the subtree can mount again.
 */
class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		logError('ErrorBoundary', { error, componentStack: errorInfo.componentStack });
	}

	reset = () => {
		this.setState({ error: null });
	};

	render() {
		if (this.state.error) {
			return this.props.fallback(this.reset);
		}
		return this.props.children;
	}
}

export default ErrorBoundary;
