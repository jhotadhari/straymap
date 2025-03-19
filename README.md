## Straymap

Android offline map app for stray cyclists and roaming vagabonds.

## Installation

It's not on F-Droid or Play Store yet.

Download the [latest version](https://github.com/jhotadhari/straymap/releases/latest) and install the `apk`.

## Where to get maps?

Vector maps in mapsforge V5 format and xml render styles [https://www.openandromaps.org/en/downloads](https://www.openandromaps.org/en/downloads).

Raster overview maps in MBtiles format [https://www.openandromaps.org/en/downloads/general-maps](https://www.openandromaps.org/en/downloads/general-maps).

Digital elevation Models, elevation data in hgt format at 3 arc second resolution [https://viewfinderpanoramas.org/dem3.html](https://viewfinderpanoramas.org/Coverage%20map%20viewfinderpanoramas_org3.htm)

## Free Software

Straymap is Free Software ([source code](https://github.com/jhotadhari/straymap))

What is Free Software? [https://www.gnu.org/philosophy/free-sw.en.html](https://www.gnu.org/philosophy/free-sw.en.html)

> “Free software” means software that respects users' freedom and community. Roughly, it means that **the users have the freedom to run, copy, distribute, study, change and improve the software**. Thus, “free software” is a matter of liberty, not price. To understand the concept, you should think of “free” as in “free speech,” not as in “free beer.”

## License

[MIT License](https://github.com/jhotadhari/straymap/blob/main/LICENSE.md)

## Donation

Straymap is gratis, it's free of charge. It's non-commercial. It's not intended for commercial advantage or monetary compensation. It is not intended for profit.

If you want and if you can afford to pay for it, your are free to do so. Otherwise, it's OK, just use it.

[![liberapay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/jhotadhari/donate)
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H2H3162PAG)

## Contribution

- You can report [issues and bugs](https://github.com/jhotadhari/straymap/issues).
- Ask questions, suggest new features, just start a [discussion](https://github.com/jhotadhari/straymap/discussions).
- Help me coding. This project is free open source software. [Checkout the repository](https://github.com/jhotadhari/straymap), fork it and make pull requests for the `development` branch.

## Privacy

Straymap respects the users privacy. It does **not** contain any kind of trackers. Nothing external, nothing internal. The entire data stays on the device. Nothing gets collected, uploaded or shared with no one no where never.

Straymap works, with one exception, entirely offline, no other requests* to any kind of servers are done. The exceptions is:

- The `online-raster-xyz` map layer. This map layer requests raster images from an online source. The online source that you choose by yourself.

\* A request to a server, transferees personal data (the users IP address). This is technically necessary.

## Development

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

Clone the repository
```bash
git clone git@github.com:jhotadhari/straymap.git
```

Checkout and pull the development branch
```bash
git checkout development
git pull
```

>**Note**: The development branch is called `development`. This should be the pull request base..

Start the Metro Server, the JavaScript _bundler_ that ships _with_ React Native. Run the following command from the _root_ of the project:
```bash
yarn start
```

Start your Application.
Open a _new_ terminal from the _root_ of the project. Run the following command to start the app:
```bash
yarn android
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio.

## Credits

- It's build around [Mapsforges fork of vtm](https://github.com/mapsforge/vtm).
- To use mapsforge/vtm with react-native I build a library: [react-native-mapsforge-vtm](https://github.com/jhotadhari/react-native-mapsforge-vtm).
- [react](https://react.dev/),
[react-native](https://www.npmjs.com/package/react-native),
[typescript](https://www.typescriptlang.org/),
[babel](https://babeljs.io/).
- Translation libraries
[i18next](https://www.npmjs.com/package/i18next),
[intl-pluralrules](https://www.npmjs.com/package/intl-pluralrules),
[react-i18next](https://www.npmjs.com/package/react-i18next)
- [lodash](https://lodash.com),
[@klarna/react-native-vector-drawable](https://www.npmjs.com/package/@klarna/react-native-vector-drawable),
[@react-native-community/blur](https://www.npmjs.com/package/@react-native-community/blur),
[dayjs](https://www.npmjs.com/package/dayjs),
[formatcoords](https://www.npmjs.com/package/formatcoords),
[react-native-default-preference](https://www.npmjs.com/package/react-native-default-preference),
[react-native-draggable-grid](https://www.npmjs.com/package/react-native-draggable-grid),
[react-native-fs](https://www.npmjs.com/package/react-native-fs),
[react-native-markdown-display](https://www.npmjs.com/package/react-native-markdown-display),
[react-native-paper](https://www.npmjs.com/package/react-native-paper),
[react-native-safe-area-context](https://www.npmjs.com/package/react-native-safe-area-context),
[react-native-scoped-storage](https://www.npmjs.com/package/react-native-scoped-storage),
[react-native-svg](https://www.npmjs.com/package/react-native-svg),
[react-native-uuid](https://www.npmjs.com/package/react-native-uuid),
[react-native-vector-icons](https://www.npmjs.com/package/react-native-vector-icons),
[react-native-wheel-color-picker](https://www.npmjs.com/package/react-native-wheel-color-picker),
[sprintf-js](https://www.npmjs.com/package/sprintf-js),
[use-deep-compare-effect](https://www.npmjs.com/package/use-deep-compare-effect),
[Keep a Changelog](https://www.npmjs.com/package/keep-a-changelog)
- Dependencies of [vtm](https://github.com/mapsforge/vtm): [Game Controller Extension for libGDX](https://github.com/libgdx/gdx-controllers),
[AndroidSVG](https://bigbadaboom.github.io/androidsvg/),
[Simple Logging Facade for Java](https://www.slf4j.org/),
[OkHttp](https://square.github.io/okhttp/),
[Okio](https://github.com/square/okio),
[Protocol Buffers - Google's data interchange format](https://github.com/protocolbuffers/protobuf),
[MapBox Vector Tile - Java](https://github.com/wdtinc/mapbox-vector-tile-java)
- Dependencies of [react-native-mapsforge-vtm](https://github.com/jhotadhari/react-native-mapsforge-vtm):
[JTS Topology Suite](https://github.com/locationtech/jts),
[Java OpenStreetMap Editor - Plugins - ElevationProfile](https://github.com/JOSM/josm-plugins/tree/master/ElevationProfile),
[Android GPX Parser](https://github.com/ticofab/android-gpx-parser),
[Simplification of a 2D-polyline or a 3D-polyline](https://github.com/hgoebl/simplify-java/),
[Savitzky–Golay filter in Java](https://github.com/vaccovecrana/savitzky-golay),
[queue-promise](https://www.npmjs.com/package/queue-promise),
[create-react-native-library](https://github.com/callstack/react-native-builder-bob)
- Fonts:
[Jangly Walk](https://www.fonts4free.net/jangly-walk-font.html) copyright (c) [Jakob Fischer at www.pizzadude.dk](https://www.pizzadude.dk),
[Coustard](https://www.fonts4free.net/coustard-font.html)