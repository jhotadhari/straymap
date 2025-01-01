
export const LINKING_ERROR =
	'The package doesn\'t seem to be linked. Make sure: \n\n' +
	'- You rebuilt the app after installing the package\n' +
	'- You are not using Expo Go\n';

export const modalWidthFactor = 0.8;

export const defaults = {
	mapSettings: {
		layers: [],
		mapsforgeProfiles: [],
		hgtDirPath: undefined,
		hgtReadFileRate: 500,
	},
	appearanceSettings: {
		cursor: {
			iconSource: 'target',
			size: 25,
			color: '#ed1c23',
		},
	},
	generalSettings: {
		hardwareKeys: [
			{
				keyCodeString: 'KEYCODE_VOLUME_UP',
				actionKey: 'zoomIn',
			},
			{
				keyCodeString: 'KEYCODE_VOLUME_DOWN',
				actionKey: 'zoomOut',
			},
		],
		dashboardElements: {
			elements: [
				{
					type: 'zoomLevel',
					key: '10277705-6ba8-4687-b68e-2d7cb6d59ca8',
				},
				{
					type: 'centerCoordinates',
					key: '6b2a062e-60b9-4d9c-ba68-d36ef75ccd49',
					options: {
						unit: {
							key: 'default',
							round: 4,
						},
					},
					// style: {
					// 	fontSize: 14,
					// 	minWidth: 200,
					// },
				},
				{
					type: 'centerAltitude',
					key: '0215f479-9a06-4c38-b966-be3af90ee880',
					options: {
						unit: {
							key: 'default',
							round: 2,
						},
					},
				},
			],
			style: {
				align: 'left',
			}
		},
		unitPrefs: {
			coordinates: {
				unit: 'dd',
				round: 4,
			},
			distance: {
				unit: 'metric',
				round: 2,
			},
			heightDepth: {
				unit: 'm',
				round: 2,
			},
			speed: {
				unit: 'kmh',
				round: 2,
			},
		},
		mapEventRate: 100,
	},
};