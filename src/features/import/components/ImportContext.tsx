/**
 * External dependencies
 */
import {
	createContext,
	Dispatch,
	FC,
	MutableRefObject,
	ReactNode,
	SetStateAction,
	useContext,
} from 'react';
import { UseMutationResult } from '@tanstack/react-query';
import { Feature, GeoJsonProperties, LineString } from 'geojson';

/**
 * Internal dependencies
 */
import { AbsPath } from '../../dirs/types';
import { ImportMode, ImportStep, TagMode, OverwriteMode, ImportFileResult } from './types';

export interface ImportContextValue {
	step: ImportStep;
	setStep: Dispatch<SetStateAction<ImportStep>>;
	importMode: ImportMode;
	setImportMode: Dispatch<SetStateAction<ImportMode>>;
	features: Feature<LineString, GeoJsonProperties>[];
	setFeatures: Dispatch<SetStateAction<Feature<LineString, GeoJsonProperties>[]>>;
	filename: string;
	setFilename: Dispatch<SetStateAction<string>>;
	sourceFilePath: string;
	setSourceFilePath: Dispatch<SetStateAction<string>>;
	selectedIndices: Set<number>;
	setSelectedIndices: Dispatch<SetStateAction<Set<number>>>;
	dirFiles: { uri: string; name: string }[];
	setDirFiles: Dispatch<SetStateAction<{ uri: string; name: string }[]>>;
	selectedFileUris: Set<string>;
	setSelectedFileUris: Dispatch<SetStateAction<Set<string>>>;
	mergeMode: boolean;
	setMergeMode: Dispatch<SetStateAction<boolean>>;
	bulkProgress: { current: number; total: number };
	setBulkProgress: Dispatch<SetStateAction<{ current: number; total: number }>>;
	importResults: ImportFileResult[];
	setImportResults: Dispatch<SetStateAction<ImportFileResult[]>>;
	fileLimit: number;
	setFileLimit: Dispatch<SetStateAction<number>>;
	titleRegex: string;
	setTitleRegex: Dispatch<SetStateAction<string>>;
	tagMode: TagMode;
	setTagMode: Dispatch<SetStateAction<TagMode>>;
	tagRegex: string;
	setTagRegex: Dispatch<SetStateAction<string>>;
	selectedTagIds: number[];
	setSelectedTagIds: Dispatch<SetStateAction<number[]>>;
	dryRun: boolean;
	setDryRun: Dispatch<SetStateAction<boolean>>;
	overwriteMode: OverwriteMode;
	setOverwriteMode: Dispatch<SetStateAction<OverwriteMode>>;
	selectionCount: number;
	importDirs: AbsPath[];
	handlePickFile: () => Promise<void>;
	handleSelectAppDir: (path: AbsPath) => void;
	handleSelectCustom: () => void;
	handleToggleFeature: (idx: number) => void;
	handleSelectAllFeatures: () => void;
	handleDeselectAllFeatures: () => void;
	handleToggleFile: (uri: string) => void;
	handleSelectAllFiles: () => void;
	handleDeselectAllFiles: () => void;
	handleImport: () => void;
	handleResultDone: () => void;
	dismissedRef: MutableRefObject<boolean>;
	mutationRef: MutableRefObject<UseMutationResult<void, Error, void, unknown> | null>;
}

const ImportContext = createContext<ImportContextValue | null>(null);

export const ImportContextProvider: FC<{
	value: ImportContextValue;
	children: ReactNode;
}> = ({ value, children }) => (
	<ImportContext.Provider value={value}>{children}</ImportContext.Provider>
);

export const useImportContext = (): ImportContextValue => {
	const ctx = useContext(ImportContext);
	if (!ctx) {
		throw new Error('useImportContext must be used within ImportContextProvider');
	}
	return ctx;
};
