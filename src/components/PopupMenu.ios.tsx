import { Button, Divider, Host, Menu, RNHostView } from '@expo/ui/swift-ui';
import { accessibilityLabel } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/theme';

import type { PopupMenuProps } from './PopupMenu';

/**
 * Małe natywne menu iOS rozwijane z przycisku po jednym stuknięciu (UIMenu przez Expo UI).
 * Akcje usuwające są na dole, oddzielone kreską i czerwone (rola `destructive`).
 */
export function PopupMenu({ label, items, children }: PopupMenuProps) {
  const { scheme } = useTheme();
  const normal = items.filter((item) => !item.destructive);
  const destructive = items.filter((item) => item.destructive);

  return (
    <Host matchContents colorScheme={scheme}>
      <Menu
        label={<RNHostView matchContents>{children}</RNHostView>}
        modifiers={[accessibilityLabel(label)]}
      >
        {normal.map((item) => (
          <Button key={item.label} label={item.label} onPress={item.onPress} />
        ))}
        {normal.length && destructive.length ? <Divider /> : null}
        {destructive.map((item) => (
          <Button key={item.label} label={item.label} role="destructive" onPress={item.onPress} />
        ))}
      </Menu>
    </Host>
  );
}
