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
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#F59E0B',
    border: '#FDE68A',
  },
  open: {
    label: 'Sedang Dibuka',
    bg: '#DCFCE7',
    text: '#166534',
    dot: '#22C55E',
    border: '#BBF7D0',
  },
  closed: {
    label: 'Sudah Ditutup',
    bg: '#F1F5F9',
    text: '#475569',
    dot: '#64748B',
    border: '#E2E8F0',
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
