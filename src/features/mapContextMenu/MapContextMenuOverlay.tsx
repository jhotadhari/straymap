/**
 * External dependencies
 */
import React, { ElementType, FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, View } from 'react-native';
import { Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import MenuItem from '../../components/generic/wrapper/MenuItem';
import {
	MapContextMenuSourceComponentProps,
	MenuActionOption,
	MapContextMenuContext,
} from '../../types';
import { featureRegistry } from '../FeatureRegistry';
import {
	closeSharePosition,
	subscribeMapContextMenu,
	subscribeSharePosition,
	SharePositionState,
} from './controller';
import SharePositionModal from './SharePositionModal';

/**
 * Per-source host: memoizes `onOptions` so the sources' effects don't
 * re-fire when only the overlay re-renders. Module-level (not defined
 * inside the overlay) so its identity stays stable across renders.
 */
const SourceHost: FC<{
	sourceKey: string;
	SourceComponent: ElementType<MapContextMenuSourceComponentProps>;
	context: MapContextMenuContext;
	handleOptions: (sourceKey: string, options: MenuActionOption[] | null) => void;
}> = ({ sourceKey, SourceComponent, context, handleOptions }) => {
	const onOptions = useCallback(
		(options: MenuActionOption[] | null) => handleOptions(sourceKey, options),
		[handleOptions, sourceKey]
	);
	return (
		<SourceComponent
			context={context}
			onOptions={onOptions}
		/>
	);
};

/**
 * Sibling overlay above the map that renders the tap/long-press context
 * menu. Sources (registered via `mapContextMenuSources`) each contribute
 * a group of options for the current press; groups from multiple sources
 * are joined by dividers. Also hosts the share-position modal so it
 * survives the menu closing.
 *
 * The menu is a plain View rendered inside the overlay (same coordinate
 * space as the map) instead of a Modal-based popover — it opens
 * instantly, with no mount/measurement delay and no animation.
 */
const MapContextMenuOverlay: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [menu, setMenu] = useState<MapContextMenuContext | null>(null);
	const [optionsBySource, setOptionsBySource] = useState<Record<string, MenuActionOption[]>>({});
	const [sharePosition, setSharePosition] = useState<SharePositionState>(null);
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
	const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });

	useEffect(
		() =>
			subscribeMapContextMenu((context) => {
				setOptionsBySource({});
				setMenu(context);
			}),
		[]
	);

	useEffect(() => subscribeSharePosition(setSharePosition), []);

	/**
	 * Content-aware compare: an equivalent re-report (same keys, same cb
	 * references) returns prev so a source re-rendering with a fresh array
	 * identity can never drive an update loop.
	 */
	const handleOptions = useCallback((sourceKey: string, options: MenuActionOption[] | null) => {
		setOptionsBySource((prev) => {
			if (!options?.length) {
				if (!(sourceKey in prev)) {
					return prev;
				}
				const next = { ...prev };
				delete next[sourceKey];
				return next;
			}
			const prevOptions = prev[sourceKey];
			if (
				prevOptions &&
				prevOptions.length === options.length &&
				prevOptions.every((opt, index) => {
					const nextOpt = options[index];
					return nextOpt && opt.key === nextOpt.key && opt.cb === nextOpt.cb;
				})
			) {
				return prev;
			}
			return { ...prev, [sourceKey]: options };
		});
	}, []);

	const sources = useMemo(() => featureRegistry.getMapContextMenuSources(), []);

	const matchingSources = useMemo(
		() => (menu ? sources.filter((source) => source.press === menu.press) : []),
		[sources, menu]
	);

	const closeMenu = useCallback(() => setMenu(null), []);

	const groups = useMemo(() => {
		if (!menu) {
			return [];
		}
		return matchingSources
			.map((source) => ({ source, options: optionsBySource[source.key] }))
			.filter(
				(
					group
				): group is {
					source: (typeof matchingSources)[number];
					options: MenuActionOption[];
				} => !!group.options?.length
			);
	}, [
		menu,
		matchingSources,
		optionsBySource,
	]);

	// The overlay shares the map wrapper's coordinate space, so the
	// map-local tap coordinates (physical px → dp) position the panel
	// directly — no window/Modal coordinate translation needed.
	const tapX = menu ? menu.x / PixelRatio.get() : 0;
	const tapY = menu ? menu.y / PixelRatio.get() : 0;

	// Clamp to the overlay area (measured via the backdrop), flipping
	// above the tap when the panel would overflow the bottom edge.
	const MARGIN = 8;
	const left = Math.max(
		MARGIN,
		Math.min(tapX, Math.max(MARGIN, containerSize.width - panelSize.width - MARGIN))
	);
	let top = tapY + 4;
	if (top + panelSize.height > containerSize.height - MARGIN) {
		top = Math.max(MARGIN, tapY - panelSize.height - 4);
	}

	const panelStyle = useMemo(
		() => [
			styles.panel,
			{
				backgroundColor: theme.colors.background,
				borderColor: theme.colors.outline,
				left,
				top,
			},
		],
		[
			theme,
			left,
			top,
		]
	);

	if (!menu) {
		return (
			<SharePositionModal
				visible={!!sharePosition}
				onDismiss={closeSharePosition}
				lng={sharePosition?.lng ?? 0}
				lat={sharePosition?.lat ?? 0}
			/>
		);
	}

	return (
		<Fragment>
			{/* Mount the sources while a menu is open so they can resolve options. */}
			{matchingSources.map(({ key, SourceComponent }) => (
				<SourceHost
					key={key}
					sourceKey={key}
					SourceComponent={SourceComponent}
					context={menu}
					handleOptions={handleOptions}
				/>
			))}

			{/* The share-position modal is owned by the overlay (not a source)
			    so it survives the menu closing after its action runs. */}
			<SharePositionModal
				visible={!!sharePosition}
				onDismiss={closeSharePosition}
				lng={sharePosition?.lng ?? 0}
				lat={sharePosition?.lat ?? 0}
			/>

			<Pressable
				style={styles.backdrop}
				onPress={closeMenu}
				onLayout={(e) => {
					const { width, height } = e.nativeEvent.layout;
					setContainerSize({ width, height });
				}}
			>
				<View
					style={panelStyle}
					onLayout={(e) => {
						const { width, height } = e.nativeEvent.layout;
						setPanelSize({ width, height });
					}}
				>
					{groups.map((group, index) => (
						<Fragment key={group.source.key}>
							{index > 0 && <Divider />}
							{group.options.map((opt) => {
								const isDisabled = opt.disabled?.() ?? false;
								return (
									<MenuItem
										key={opt.key}
										style={
											isDisabled
												? { backgroundColor: theme.colors.surfaceDisabled }
												: undefined
										}
										textStyle={
											isDisabled
												? { color: theme.colors.onSurfaceDisabled }
												: undefined
										}
										iconColor={
											isDisabled ? theme.colors.onSurfaceDisabled : undefined
										}
										leadingIcon={opt.leadingIcon}
										IconComponent={opt.IconComponent}
										onPress={
											isDisabled
												? undefined
												: () => {
														opt.cb();
														closeMenu();
													}
										}
										title={t(opt.label)}
									/>
								);
							})}
						</Fragment>
					))}
				</View>
			</Pressable>
		</Fragment>
	);
};

const styles = StyleSheet.create({
	backdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 1000,
	},
	panel: {
		position: 'absolute',
		minWidth: 100,
		maxWidth: 280,
		borderWidth: 1,
		borderRadius: 4,
		elevation: 8,
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
		overflow: 'hidden',
	},
});

export default MapContextMenuOverlay;
