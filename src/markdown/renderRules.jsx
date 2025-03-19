import React from 'react';
import {
  TouchableWithoutFeedback,
  View,
  Platform,
  StyleSheet,
} from 'react-native';
import {
	Text,
} from 'react-native-paper';

import textStyleProps from './textStyleProps';
import openUrl from './openUrl';
import hasParents from './hasParents';

/**
 * Mostly copy of https://github.com/iamacup/react-native-markdown-display/blob/master/src/lib/renderRules.js
 * But only overwrites the elements rendered in a Text.
 * And uses Text from react-native-paper instead of react-native
 */
const renderRules = {

  // Emphasis
  strong: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.strong}>
      {children}
    </Text>
  ),
  em: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.em}>
      {children}
    </Text>
  ),
  s: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.s}>
      {children}
    </Text>
  ),

  // this is a unique and quite annoying render rule because it has
  // child items that can be styled (the list icon and the list content)
  // outside of the AST tree so there are some work arounds in the
  // AST renderer specifically to get the styling right here
  list_item: (node, children, parent, styles, inheritedStyles = {}) => {
    // we need to grab any text specific stuff here that is applied on the list_item style
    // and apply it onto bullet_list_icon. the AST renderer has some workaround code to make
    // the content classes apply correctly to the child AST tree items as well
    // as code that forces the creation of the inheritedStyles object for list_items
    const refStyle = {
      ...inheritedStyles,
      ...StyleSheet.flatten(styles.list_item),
    };

    const arr = Object.keys(refStyle);

    const modifiedInheritedStylesObj = {};

    for (let b = 0; b < arr.length; b++) {
      if (textStyleProps.includes(arr[b])) {
        modifiedInheritedStylesObj[arr[b]] = refStyle[arr[b]];
      }
    }

    if (hasParents(parent, 'bullet_list')) {
      return (
        <View key={node.key} style={styles._VIEW_SAFE_list_item}>
          <Text
            style={[modifiedInheritedStylesObj, styles.bullet_list_icon]}
            accessible={false}>
            {Platform.select({
              android: '\u2022',
              ios: '\u00B7',
              default: '\u2022',
            })}
          </Text>
          <View
            // style={styles._VIEW_SAFE_bullet_list_content}
          >{children}</View>
        </View>
      );
    }

    if (hasParents(parent, 'ordered_list')) {
      const orderedListIndex = parent.findIndex(
        (el) => el.type === 'ordered_list',
      );

      const orderedList = parent[orderedListIndex];
      let listItemNumber;

      if (orderedList.attributes && orderedList.attributes.start) {
        listItemNumber = orderedList.attributes.start + node.index;
      } else {
        listItemNumber = node.index + 1;
      }

      return (
        <View key={node.key} style={styles._VIEW_SAFE_list_item}>
          <Text
          style={[modifiedInheritedStylesObj, styles.ordered_list_icon]}

          >
            {listItemNumber}
            {node.markup}
          </Text>
          <View style={styles._VIEW_SAFE_ordered_list_content}>{children}</View>
        </View>
      );
    }

    // we should not need this, but just in case
    return (
      <View key={node.key} style={styles._VIEW_SAFE_list_item}>
        {children}
      </View>
    );
  },

  fence: (node, children, parent, styles, inheritedStyles = {}) => {
    // we trim new lines off the end of code blocks because the parser sends an extra one.
    let {content} = node;

    if (
      typeof node.content === 'string' &&
      node.content.charAt(node.content.length - 1) === '\n'
    ) {
      content = node.content.substring(0, node.content.length - 1);
    }

    return (
      <Text key={node.key} style={[inheritedStyles, styles.fence]}>
        {content}
      </Text>
    );
  },

  // Links
  link: (node, children, parent, styles, onLinkPress) => (
    <Text
      key={node.key}
      style={[styles.link]}
      onPress={() => openUrl(node.attributes.href, onLinkPress)}>
      {children}
    </Text>
  ),
  blocklink: (node, children, parent, styles, onLinkPress) => (
    <TouchableWithoutFeedback
      key={node.key}
      onPress={() => openUrl(node.attributes.href, onLinkPress)}
      style={styles.blocklink}>
      <View style={styles.image}>{children}</View>
    </TouchableWithoutFeedback>
  ),

  // Text Output
  text: (node, children, parent, styles, inheritedStyles = {}) => (
    <Text key={node.key} style={[inheritedStyles, styles.text]}>
      {node.content}
    </Text>
  ),
  textgroup: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.textgroup}>
      {children}
    </Text>
  ),
  hardbreak: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.hardbreak}>
      {'\n'}
    </Text>
  ),
  softbreak: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.softbreak}>
      {'\n'}
    </Text>
  ),
  inline: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.inline}>
      {children}
    </Text>
  ),
  span: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.span}>
      {children}
    </Text>
  ),
};

export default renderRules;