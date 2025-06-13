import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ActionCardProps {
  title: string;
  iconName: string;
  onPress: () => void;
  color?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  iconName,
  onPress,
  color = '#00bcd4',
}) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

  return (
    <Animated.View
      style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View
          style={[
            styles.card,
            Platform.OS === 'web' && { filter: 'blur(10px)' },
          ]}
        >
          <View style={styles.iconWrapper}>
            <Icon name={iconName} size={30} color={color} />
          </View>

          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.arrowContainer}>
            <Icon name="chevron-right" size={24} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {},
      web: {
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      },
    }),
  },
  touchable: {
    borderRadius: 20,
    alignItems: 'center',
  },
  // Removed the invalid webCard style as it is not supported in ViewStyle.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    // fondo suave, sin bordes
    // `${color}33` se genera dinámicamente con opacidad
    // ejemplo: '#22c55e33' = verde con opacidad 20%
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },

  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActionCard;
