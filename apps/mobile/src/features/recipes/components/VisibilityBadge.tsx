import { StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../../../theme/useAppTheme';
import { RecipeVisibility } from '../types/recipe';

type VisibilityBadgeProps = {
  visibility: RecipeVisibility;
  theme: AppTheme;
};

export function VisibilityBadge({ visibility, theme }: VisibilityBadgeProps) {
  const isPublic = visibility === 'public';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isPublic ? `${theme.success}20` : `${theme.warning}20` },
      ]}
    >
      <Text style={[styles.text, { color: isPublic ? theme.success : theme.warning }]}>
        {isPublic ? '공개' : '비공개'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
