/**
 * External dependencies
 */
import { FC, memo } from 'react';
import { ScrollView, View } from 'react-native';

/**
 * Internal dependencies
 */
import ImportConfigSection from './ImportConfigSection';
import ImportButton from './ImportButton';
import TitleExtractControl from './TitleExtractControl';
import TagExtractControl from './TagExtractControl';
import FeatureFileList from './FeatureFileList';
import { localStyles } from '../styles';

const StepPreview: FC = () => {
	return (
		<ScrollView>
			<ImportConfigSection />
			<TitleExtractControl />
			<TagExtractControl />
			<FeatureFileList />
			<View style={localStyles.bottomSpacer} />
			<ImportButton />
		</ScrollView>
	);
};

export default memo(StepPreview);
