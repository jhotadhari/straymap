/**
 * External dependencies
 */
import React, { FC, useCallback, useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useMap, type DebugLayerDump } from 'react-native-mapsforge-vtm';

const LayerDebugDumpButton: FC = () => {
	const { getDebugLayerDump } = useMap();
	const [lastDump, setLastDump] = useState<DebugLayerDump | null>(null);

	const handlePress = useCallback(() => {
		getDebugLayerDump().then((dump) => {
			setLastDump(dump);
			console.log('=== LayerDebugDump ===');
			console.log(
				'Native layers (z-index order, bottom→top):',
				JSON.stringify(
					dump.layers.map((l) => ({
						zIndex: l.zIndex,
						className: l.simpleName,
						uuid: l.uuid,
						isJsManaged: l.isJsManaged,
						enabled: l.enabled,
					})),
					null,
					2
				)
			);
			console.log(
				'JS registry (React render order):',
				JSON.stringify(dump.registry, null, 2)
			);
			console.log('Pending native mutations:', dump.pendingMutations);
			console.log('Total layers:', dump.totalLayers, 'JS-managed:', dump.jsManagedCount);
			console.log('=== /LayerDebugDump ===');
		});
	}, [getDebugLayerDump]);

	if (!globalThis.shouldLog?.showLayerDebug) {
		return null;
	}

	return (
		<Pressable
			style={({ pressed }) => [
				styles.button,
				pressed && styles.buttonPressed,
			]}
			onPress={handlePress}
		>
			<Text style={styles.label}>{lastDump ? '🟢 Dump' : '🔴 Dump'}</Text>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	button: {
		position: 'absolute',
		top: 12,
		left: '50%',
		transform: [{ translateX: '-50%' }],
		backgroundColor: 'rgba(0,0,0,0.65)',
		paddingHorizontal: 8,
		paddingVertical: 8,
		borderRadius: 6,
		zIndex: 9999,
	},
	buttonPressed: {
		backgroundColor: 'rgba(255,255,255,0.3)',
	},
	label: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '700',
	},
});

export default LayerDebugDumpButton;
