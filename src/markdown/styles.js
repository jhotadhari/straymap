
import { get } from 'lodash-es';

// see https://github.com/iamacup/react-native-markdown-display/blob/master/src/lib/styles.js
export const styles = theme => ( {
	link: {
		textDecorationLine: 'none',
		color: get( theme.colors, 'link' )
	},
	code_inline: {
		borderWidth: 1,
		backgroundColor: theme.colors.surfaceVariant,
		color: theme.colors.onSurfaceVariant,
		padding: 10,
		borderRadius: 4,
		fontFamily: 'monospace',
	},
	code_block: {
		borderWidth: 1,
		backgroundColor: theme.colors.surfaceVariant,
		color: theme.colors.onSurfaceVariant,
		padding: 10,
		borderRadius: 4,
		fontFamily: 'monospace',
	},
	// Blockquotes
	blockquote: {
		borderColor: theme.colors.primary,
		backgroundColor: theme.colors.surfaceVariant,
		color: theme.colors.onSurfaceVariant,
		borderLeftWidth: 4,
		marginLeft: 20,
		paddingHorizontal: 5,
	},
	// Headings
	heading1: {
		...theme.fonts.displaySmall,
		fontFamily: 'jangly_walk',
		flexDirection: 'row',
	},
	heading2: {
		...theme.fonts.displaySmall,
		fontFamily: 'jangly_walk',
		flexDirection: 'row',
	},
	// heading3: {
	// 	flexDirection: 'row',
	// 	fontSize: 18,
	// },
	// heading4: {
	// 	flexDirection: 'row',
	// 	fontSize: 16,
	// },
	// heading5: {
	// 	flexDirection: 'row',
	// 	fontSize: 13,
	// },
	// heading6: {
	// 	flexDirection: 'row',
	// 	fontSize: 11,
	// },

} );