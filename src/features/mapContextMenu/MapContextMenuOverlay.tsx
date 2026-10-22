/**
 * External dependencies
 */
import React, { ElementType, FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Popover, { PopoverPlacement, Rect } from 'react-native-popover-view';

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
 */
const MapContextMenuOverlay: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [menu, setMenu] = useState<MapContextMenuContext | null>(null);
	const [optionsBySource, setOptionsBySource] = useState<Record<string, MenuActionOption[]>>({});
	const [sharePosition, setSharePosition] = useState<SharePositionState>(null);

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

	/**
	 * Per-source host memoizing onOptions — see the module-level SourceHost.
	 */

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

	// The popover's default mode is RN_MODAL, whose coordinate space is
	// the full window — windowX/windowY from measureInWindow are already
	// exact, no status-bar adjustment needed.
	const fromRect = useMemo(() => new Rect(menu?.windowX ?? 0, menu?.windowY ?? 0, 0, 0), [menu]);

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 100,
		}),
		[theme]
	);

	return (
		<Fragment>
			{/* Mount the sources while a menu is open so they can resolve options. */}
			{menu &&
				matchingSources.map(({ key, SourceComponent }) => (
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

			<Popover
				popoverStyle={popoverStyle}
				arrowSize={arrowSize}
				isVisible={!!menu}
				onRequestClose={closeMenu}
				from={fromRect}
				placement={PopoverPlacement.BOTTOM}
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
			</Popover>
		</Fragment>
	);
};

const arrowSize = { height: 0, width: 0 };

export default MapContextMenuOverlay;
