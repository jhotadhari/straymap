# Custom icon font (`buildIcons`)

`yarn buildIcons` (`scripts/buildIcons/index.js`) generates an icon font from SVG files
in `src/assets/icons/`. See `scripts/buildIcons/CLAUDE.md` for full details.

Usage in code:
```tsx
import IconCustom from '../components/generic/primitives/IconCustom';
<IconCustom name="route_cog" size={25} color={theme.colors.primary} />
```
