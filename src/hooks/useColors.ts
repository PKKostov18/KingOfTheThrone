import { useMemo } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { ColorsType, getThemedColors } from '../constants/Colors';

/**
 * Returns themed colors mapped to the same shape as the static Colors object.
 * Use this in screens/components that should respond to theme changes.
 */
export function useColors(): ColorsType {
  const theme = useThemeStore((s) => s.theme);
  return useMemo(() => getThemedColors(theme), [theme]);
}
