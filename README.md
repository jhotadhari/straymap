# Straymap

Android offline map app for stray cyclists and roaming vagabonds.

## Installation

Not on F-Droid or Play Store yet. Download the [latest APK](https://github.com/jhotadhari/straymap/releases/latest).

## Where to get maps?

- **Vector maps** (mapsforge) and **XML render styles**: [OpenAndroMaps](https://www.openandromaps.org/en/downloads)
- **Raster overview maps** (MBtiles): [OpenAndroMaps general maps](https://www.openandromaps.org/en/downloads/general-maps)
- **Digital elevation models** (hgt, 3 arc-second): [viewfinderpanoramas.org](https://viewfinderpanoramas.org/Coverage%20map%20viewfinderpanoramas_org3.htm)

## Free Software

Straymap is [Free Software](https://www.gnu.org/philosophy/free-sw.en.html) ([source code](https://github.com/jhotadhari/straymap)):

> “Free software” means that **the users have the freedom to run, copy, distribute, study, change and improve the software**. It's a matter of liberty, not price.

## License

[MIT](https://github.com/jhotadhari/straymap/blob/main/LICENSE.md)

## Donation

Straymap is gratis, non-commercial, not intended for profit. If you can afford to pay for it, you're free to do so. Otherwise, just use it.

[![liberapay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/jhotadhari/donate)
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H2H3162PAG)

## Contributing

- Report [issues and bugs](https://github.com/jhotadhari/straymap/issues)
- Ask questions or suggest features in [discussions](https://github.com/jhotadhari/straymap/discussions)
- [Fork the repo](https://github.com/jhotadhari/straymap) and open pull requests against the `development` branch

## Privacy

Straymap contains **no trackers** of any kind. All data stays on-device — nothing is collected, uploaded, or shared.

The app works entirely offline, with one exception: the `online-raster-xyz` map layer, which requests raster tiles from an online source you choose yourself.*

\* Any server request transmits your IP address — this is technically unavoidable.

## Development

> **Note**: Complete the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) first.

```bash
git clone git@github.com:jhotadhari/straymap.git
git checkout development
yarn start        # Start Metro bundler
yarn android      # Build & run (in a second terminal)
```

The default branch for PRs is `development`.

## Credits

- Built around [mapsforge's vtm](https://github.com/mapsforge/vtm) via [react-native-mapsforge-vtm](https://github.com/jhotadhari/react-native-mapsforge-vtm)
- **Framework:** [React](https://react.dev/) · [React Native](https://reactnative.dev/) · [TypeScript](https://www.typescriptlang.org/) · [Babel](https://babeljs.io/)
- **State & data:** [Redux Toolkit](https://redux-toolkit.js.org/) · [React Query](https://tanstack.com/query) · [drizzle-orm](https://orm.drizzle.team/) · [op-sqlite](https://github.com/OP-Engineering/op-sqlite)
- **UI:** [react-native-paper](https://callstack.github.io/react-native-paper/) · [react-native-paper-dates](https://github.com/web-ridge/react-native-paper-dates) · [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) · [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) · [react-native-svg](https://github.com/software-mansion/react-native-svg) · [react-native-sortables](https://github.com/mzuender/react-native-sortables) · [@react-native-vector-icons](https://github.com/react-native-vector-icons) · [Font-GIS](https://github.com/viglino/font-gis) · [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) · [@react-native-community/blur](https://github.com/react-native-community/blur)

- **Maps & geo:** [Turf.js](https://turfjs.org/) · [react-native-brouter](https://github.com/jhotadhari/react-native-brouter) · [@tmcw/togeojson](https://github.com/placemark/togeojson)
- **i18n:** [i18next](https://www.i18next.com/) · [react-i18next](https://react.i18next.com/) · [intl-pluralrules](https://www.npmjs.com/package/intl-pluralrules)
- **Utilities:** [lodash-es](https://lodash.com/) · [dayjs](https://day.js.org/) · [formatcoords](https://github.com/nerik/formatcoords) · [slugify](https://github.com/simov/slugify) · [sprintf-js](https://github.com/alexei/sprintf.js) · [semver-compare](https://github.com/substack/semver-compare) · [@ungap/structured-clone](https://github.com/ungap/structured-clone) · [defaults](https://github.com/tmpvar/defaults) · [react-native-fs](https://github.com/itinance/react-native-fs) · [react-native-uuid](https://github.com/eugenehp/react-native-uuid) · [react-native-default-preference](https://github.com/kevinresol/react-native-default-preference) · [react-native-scoped-storage](https://github.com/ammarahm-ed/react-native-scoped-storage) · [react-native-popover-view](https://github.com/SteffeyDev/react-native-popover-view) · [@klarna/react-native-vector-drawable](https://github.com/klarna-incubator/react-native-vector-drawable) · [react-native-markdown-display](https://github.com/iamacup/react-native-markdown-display)
- **Font:** [Jangly Walk](https://www.fonts4free.net/jangly-walk-font.html) © [Jakob Fischer / pizzadude.dk](https://www.pizzadude.dk)
- **Logo:** foreground based on [hotpot.ai/logo-generator](https://hotpot.ai/logo-generator), background based on [World PNGs by Vecteezy](https://www.vecteezy.com/free-png/world)
