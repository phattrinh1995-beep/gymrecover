import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ScalePicker({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number | null;
  onChange: (n: number) => void;
}) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View style={styles.row}>
      {values.map((n) => (
        <Pressable key={n} style={[styles.cell, value === n && styles.cellSelected]} onPress={() => onChange(n)}>
          <Text style={[styles.cellLabel, value === n && styles.cellLabelSelected]}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  cell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { backgroundColor: '#2A6DF4', borderColor: '#2A6DF4' },
  cellLabel: { color: '#222' },
  cellLabelSelected: { color: 'white', fontWeight: '700' },
});
