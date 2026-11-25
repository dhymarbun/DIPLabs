import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SessionStatus } from '../../types/attendance';

type StatusBadgeProps = {
  status: SessionStatus;
  size?: 'sm' | 'md';
};

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  upcoming: {
    label: 'Belum Dibuka',
    bg: '#FFF1CE',
    text: '#875B18',
    dot: '#875B18',
    border: '#FFF1CE',
  },
  open: {
    label: 'Dibuka',
    bg: '#E3E7D8',
    text: '#436D2B',
    dot: '#436D2B',
    border: '#E3E7D8',
  },
  closed: {
    label: 'Ditutup',
    bg: '#E7E5DF',
    text: '#5E5F58',
    dot: '#5E5F58',
    border: '#E7E5DF',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text
        style={[
          styles.label,
          size === 'sm' ? styles.labelSm : styles.labelMd,
          { color: config.text },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
  },
  labelMd: {
    fontSize: 12,
  },
});
