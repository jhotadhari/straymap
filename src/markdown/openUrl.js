import {Linking} from 'react-native';

// Copy of https://github.com/iamacup/react-native-markdown-display/blob/master/src/lib/util/openUrl.js
export default function openUrl(url, customCallback) {
  if (customCallback) {
    const result = customCallback(url);
    if (url && result && typeof result === 'boolean') {
      Linking.openURL(url);
    }
  } else if (url) {
    Linking.openURL(url);
  }
}