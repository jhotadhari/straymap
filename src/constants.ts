
export const LINKING_ERROR =
	'The package doesn\'t seem to be linked. Make sure: \n\n' +
	'- You rebuilt the app after installing the package\n' +
	'- You are not using Expo Go\n';

export const modalWidthFactor = 0.8;

export const defaults = {
	uiState: {
		mapLayersExpanded: false,
		mapsforgeProfilesExpanded: false,
	},
	mapSettings: {
		layers: [
			{
				key: '62fc0763-7130-4c92-a67f-5fe0717bf0a9',
				name: 'OpenStreetMap',
				type: 'online-raster-xyz',
				visible: true,
				options: {
					cacheSize: 128,
					enabledZoomMax: 20,
					enabledZoomMin: 1,
					url: 'https://tile.openstreetmap.org/{Z}/{X}/{Y}.png',
					zoomMax: 20,
					zoomMin: 1,
				},
			},
		],
		mapsforgeProfiles: [
			{
				key: '0bd5e1c3-0840-428c-9e11-6425fbd92942',
				name: 'Default',
				renderOverlays: [],
				renderStyle: null,
				theme: 'DEFAULT',
			},
		],
		hgtDirPath: undefined,
		hgtReadFileRate: 500,
		mapsforgeGeneral: {
			textScale: 1,
			lineScale: 1,
			symbolScale: 1,
		},
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
				},
			],
			style: {
				align: 'left',
				fontSize: 14,
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