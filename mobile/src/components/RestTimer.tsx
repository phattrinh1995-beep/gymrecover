import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const DEFAULT_REST_SECONDS = 30;

export function RestTimer({ onDone }: { onDone: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_REST_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onDone();
      return;
    }
    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [secondsLeft, onDone]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rest — {secondsLeft}s</Text>
      <Text style={styles.skip} onPress={() => onDone()}>
        Skip
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EAF1FF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  label: { color: '#2A6DF4', fontWeight: '600' },
  skip: { color: '#2A6DF4', textDecorationLine: 'underline' },
});
