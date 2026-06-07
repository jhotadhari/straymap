import { LineString } from "geojson";


// ???!!! this will change soon
export interface LineWithTags {
    id: number;
    title: string | null;
    geometry: LineString;
    tags: {
        id: number;
        label: string | null;
        notes: string | null;
        params: any; // ??? any
    }[];
}