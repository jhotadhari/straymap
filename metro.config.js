const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);


const { assetExts, sourceExts } = defaultConfig.resolver;

const customConfig = {
    resetCache: true,
    transformer: {
        babelTransformerPath: require.resolve(
            './transformer/md-transformer'
        )
    },
    resolver: {
        assetExts: assetExts.filter( ( ext ) => ext !== 'md' ),
        sourceExts: [...sourceExts, 'md']
    }
};

module.exports = wrapWithReanimatedMetroConfig( mergeConfig(
    defaultConfig,
    customConfig
) );
