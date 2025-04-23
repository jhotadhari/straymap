const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const { assetExts, sourceExts } = defaultConfig.resolver;

const customConfig = {
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

module.exports = mergeConfig( defaultConfig, customConfig );
