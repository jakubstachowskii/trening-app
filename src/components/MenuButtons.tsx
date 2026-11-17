import { View } from 'react-native';

import { useTheme } from '@/theme';

import { GlassSurface } from './GlassControl';
import { Icon } from './Icon';
import { PopupMenu } from './PopupMenu';
import type { MenuItem } from './stack';

type Props = { label: string; title?: string; items: MenuItem[] };

const ELLIPSIS = { ios: 'ellipsis', web: 'more_horiz' } as const;

/** „…” w nagłówku ekranu: ikona w kolorze akcentu, małe menu z przycisku. */
export function HeaderMenuButton({ label, title, items }: Props) {
  const { colors, size } = useTheme();
  return (
    <PopupMenu label={label} title={title} items={items}>
      <View
        style={{
          minWidth: size.touchMin,
          minHeight: size.touchMin,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={ELLIPSIS} color={colors.accentText} size={size.icon} />
      </View>
    </PopupMenu>
  );
}

/** „…” w szklanym kółku (nagłówek ekranu treningu). */
export function GlassMenuButton({ label, title, items }: Props) {
  const { size } = useTheme();
  return (
    <PopupMenu label={label} title={title} items={items}>
      <GlassSurface
        style={{
          width: size.touchMin,
          height: size.touchMin,
          borderRadius: size.touchMin / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={ELLIPSIS} size={size.iconSmall} />
      </GlassSurface>
    </PopupMenu>
  );
}
