import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.button, selected && styles.buttonSelected]} onPress={onPress}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.primary, disabled && styles.primaryDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  buttonSelected: {
    borderColor: '#2A6DF4',
    backgroundColor: '#EAF1FF',
  },
  label: {
    fontSize: 16,
    color: '#222',
  },
  labelSelected: {
    color: '#2A6DF4',
    fontWeight: '600',
  },
  primary: {
    backgroundColor: '#2A6DF4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryDisabled: {
    backgroundColor: '#A9C2F5',
  },
  primaryLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
