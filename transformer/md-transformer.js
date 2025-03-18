const metroBabelTransformer = require( '@react-native/metro-babel-transformer' );

module.exports.transform = function ({ src, filename, ...rest }) {
    if ( filename.endsWith( '.md' ) ) {
		return metroBabelTransformer.transform( {
			src: `let code = ${JSON.stringify(src)}; export default code;`,
		  	filename,
		  ...rest
		} );
	}
	return metroBabelTransformer.transform( { src, filename, ...rest } );
};
