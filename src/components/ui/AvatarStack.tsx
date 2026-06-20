import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { textStyles } from '../../theme/typography';

interface AvatarStackProps {
  users?: { id: string; name: string; avatarUrl?: string }[];
  size?: number;
  max?: number;
}

// Mock avatars for demonstration if no users provided
const MOCK_AVATARS = [
  'https://i.pravatar.cc/100?img=1',
  'https://i.pravatar.cc/100?img=3',
  'https://i.pravatar.cc/100?img=5',
];

export function AvatarStack({ users, size = 32, max = 3 }: AvatarStackProps) {
  const { colors } = useTheme();

  // If no users, use mock data to match the design reference
  const displayUsers = users?.length ? users : MOCK_AVATARS.map((url, i) => ({ id: String(i), name: `User ${i}`, avatarUrl: url }));
  
  const visibleUsers = displayUsers.slice(0, max);
  const overflowCount = displayUsers.length > max ? displayUsers.length - max : 0;
  // If we're mocking, let's just pretend there are 10+ people like in the reference image
  const displayOverflow = users?.length ? overflowCount : 10;

  return (
    <View style={styles.container}>
      {visibleUsers.map((user, index) => (
        <View 
          key={user.id} 
          style={[
            styles.avatarContainer, 
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              backgroundColor: colors.bg2,
              borderColor: colors.bg1,
              zIndex: visibleUsers.length - index,
              marginLeft: index === 0 ? 0 : -size / 3
            }
          ]}
        >
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: size / 2 }} />
          ) : (
            <Text style={[textStyles.caption, { color: colors.textPrimary }]}>
              {user.name.charAt(0)}
            </Text>
          )}
        </View>
      ))}
      
      {(overflowCount > 0 || !users?.length) && (
        <View 
          style={[
            styles.overflowContainer, 
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              backgroundColor: colors.bg2,
              borderColor: colors.bg1,
              marginLeft: -size / 3
            }
          ]}
        >
          <Text style={[textStyles.caption, { color: colors.textSecondary, fontSize: size * 0.35, fontWeight: 'bold' }]}>
            +{displayOverflow}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overflowContainer: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
