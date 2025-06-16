import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ActionCardProps {
  title: string;
  iconName: string;
  onPress: () => void;
  color: string;
  isWeb?: boolean;
}

const ActionCard = ({
  title,
  iconName,
  onPress,
  color,
  isWeb = false,
}: ActionCardProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isWeb ? 'transparent' : 'transparent' },
        isWeb && styles.webCard,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Icon
        name={iconName}
        size={isWeb ? 40 : 32}
        color={color}
        style={styles.icon}
      />
      <Text style={[styles.title, isWeb && styles.webTitle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    paddingVertical: 20,
    alignItems: 'center',
    elevation: 0, // Quitar la elevación
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  webCard: {
    padding: 24,
    paddingVertical: 30,

    ...Platform.select({
      web: {
        transition: 'transform 0.2s',
        cursor: 'pointer',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  webTitle: {
    fontSize: 18,
    marginTop: 10,
  },
});

export default ActionCard;
