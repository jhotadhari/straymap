export type UnitPref = {
	unit: string;
	round: number;
};

// {
//     "installedVersion": "0.2.1",
//     "unitPrefs": {
//         "coordinates": {
//             "unit": "dd",
//             "round": 4
//         },
//         "distance": {
//             "unit": "imperial",
//             "round": 2
//         },
//         "heightDepth": {
//             "unit": "m",
//             "round": 2
//         },
//         "speed": {
//             "unit": "kmh",
//             "round": 2
//         }
//     }
// }

export type HardwareKeyActionConf = {
	keyCodeString: string;
	actionKey: string;
};

export type UpdateResults = {
	[value: string]: // the version updating from
	{
		state: 'failed' | 'updating' | 'success';
		msg?: string;
	};
};
