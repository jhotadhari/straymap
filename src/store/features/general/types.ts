export type UnitPref = {
	unit: string;
	round: number;
};

export type HardwareKeyActionConf = {
	keyCodeString: string;
	actionKey: string;
};

export type UpdateResults = {
	[value: string]: 	// the version updating from
	{
		state: 'failed' | 'updating' | 'success';
		msg?: string;
	}
};