export type UnitPref = {
	unit: string;
	round: number;
	coordsPadLng?: boolean; // For coordinates: If true, will pad the longitude to three digits. Eg '012' instead of '12'.
	coordsPadLat?: boolean; // For coordinates: If true, will pad the latitude to two digits. Eg '02' instead of '2'.
	coordsOrder?: 'lat_lng' | 'lng_lat' | 'lat' | 'lng'; // For coordinates: determines what is displayed and the order. defaults to 'lat_lng'.
	coordsForceNE?: boolean; // For coordinates: If true, north and east will be always used. If a place is south or west, the coordinate will be negative. Eg '-12E' instead of '12W'.
};

export type HardwareKeyActionConf = {
	keyCodeString: string;
	actionKey: string;
};
