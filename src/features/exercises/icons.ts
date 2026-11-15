// Ikona miniatury ćwiczenia (do czasu ilustracji w F10): według typu i sprzętu.
import type { IconName } from '@/components/Icon';
import type { Equipment } from '@/data/models';
import type { ExerciseType } from '@/domain/types';

const BY_EQUIPMENT: Record<Equipment, IconName> = {
  barbell: { ios: 'figure.strengthtraining.traditional', web: 'fitness_center' },
  ez_bar: { ios: 'figure.strengthtraining.traditional', web: 'fitness_center' },
  trap_bar: { ios: 'figure.strengthtraining.traditional', web: 'fitness_center' },
  smith: { ios: 'figure.strengthtraining.traditional', web: 'fitness_center' },
  dumbbell: { ios: 'dumbbell.fill', web: 'fitness_center' },
  kettlebell: { ios: 'figure.cross.training', web: 'sports_gymnastics' },
  plate: { ios: 'circle.circle', web: 'adjust' },
  machine: { ios: 'gearshape.2', web: 'settings' },
  cable: { ios: 'arrow.up.and.down', web: 'swap_vert' },
  band: { ios: 'figure.flexibility', web: 'self_improvement' },
  bodyweight: { ios: 'figure.core.training', web: 'accessibility_new' },
  other: { ios: 'square.grid.2x2', web: 'apps' },
};

export function exerciseIcon(type: ExerciseType, equipment: Equipment): IconName {
  if (type === 'time') return { ios: 'timer', web: 'timer' };
  return BY_EQUIPMENT[equipment];
}
