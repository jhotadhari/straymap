/**
 * Module-level store for the line color picker, mirroring the
 * share-position store in the mapContextMenu feature: the modal must
 * survive the context menu closing after its action runs, so its state
 * lives outside the (unmounted) source component.
 */
export type LineColorPickerState = {
	lineId: number;
	selectedColor: string;
	/** The line currently renders with a user-assigned colour ramp. */
	rampActive: boolean;
	/** The line has elevation data — a ramp can be enabled for it. */
	rampEnabled: boolean;
} | null;

type Listener = (state: LineColorPickerState) => void;

const listeners = new Set<Listener>();

export const openLineColorPicker = (
	lineId: number,
	selectedColor: string,
	ramp: {
		rampActive: boolean;
		rampEnabled: boolean;
	}
): void => {
	listeners.forEach((listener) =>
		listener({
			lineId,
			selectedColor,
			rampActive: ramp.rampActive,
			rampEnabled: ramp.rampEnabled,
		})
	);
};

export const closeLineColorPicker = (): void => {
	listeners.forEach((listener) => listener(null));
};

export const subscribeLineColorPicker = (listener: Listener): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};
