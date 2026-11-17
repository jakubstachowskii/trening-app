import type { ReactElement } from 'react';
import { Pressable } from 'react-native';

import { type MenuItem, showMenu } from './stack';

export type PopupMenuProps = {
  /** Etykieta przycisku dla VoiceOver (np. „Więcej opcji treningu”). */
  label: string;
  /** Tytuł menu (tylko w zastępczym oknie poza iOS). */
  title?: string;
  items: MenuItem[];
  /** Wygląd przycisku (sam widok, bez własnego onPress). */
  children: ReactElement;
};

/**
 * Menu z przycisku. Na iOS małe natywne menu rozwijane z przycisku (PopupMenu.ios.tsx);
 * tu zastępstwo dla web i Androida: systemowe okno z akcjami.
 */
export function PopupMenu({ label, title, items, children }: PopupMenuProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => showMenu(title, items)}
    >
      {children}
    </Pressable>
  );
}
