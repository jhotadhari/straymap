/**
 *
 * Copy of https://github.com/iamacup/react-native-markdown-display/blob/master/src/lib/util/hasParents.js
 *
 * @param {Array} parents
 * @param {string} type
 * @return {boolean}
 */
export default function hasParents(parents, type) {
    return parents.findIndex((el) => el.type === type) > -1;
  }