/** UI-requested current targets for mock simulation; NEVER measured output. */
export const CURRENT_TARGETS_MA = [1.5, 2, 2.5, 3, 3.5, 4] as const;
export type CurrentTargetMa = typeof CURRENT_TARGETS_MA[number];
export const DEFAULT_CURRENT_TARGET_MA: CurrentTargetMa = 2.5;

export function isCurrentTargetMa(value: unknown): value is CurrentTargetMa {
  return typeof value === 'number' && CURRENT_TARGETS_MA.some(target => target === value);
}

export function formatCurrentTarget(value: CurrentTargetMa): string {
  return `${value.toFixed(1)} mA`;
}
