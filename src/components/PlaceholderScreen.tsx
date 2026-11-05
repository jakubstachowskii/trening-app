import { t } from '@/i18n';

import { Card } from './Card';
import { Screen } from './Screen';
import { Text } from './Text';

type Props = {
  screen: 'start' | 'plans' | 'exercises' | 'progress' | 'history';
};

/** Pusty ekran karty do czasu, aż powstanie jego właściwa treść (F4–F8). */
export function PlaceholderScreen({ screen }: Props) {
  return (
    <Screen title={t(`screens.${screen}.title`)}>
      <Card accessible>
        <Text variant="headline">{t('common.soon')}</Text>
        <Text variant="subheadline" color="label2">
          {t(`screens.${screen}.body`)}
        </Text>
      </Card>
    </Screen>
  );
}
