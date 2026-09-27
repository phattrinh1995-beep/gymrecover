import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const RED_FLAG_LIST =
  'severe or worsening pain, new or increasing swelling, fever, numbness/tingling, calf pain or swelling, or chest pain/shortness of breath';

/** Persistent, non-dismissible disclaimer required on every screen showing rehab content
 * (non-functional requirement). */
export function Disclaimer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        This app provides general exercise guidance and does not replace medical advice. Follow your
        clinician's instructions and stop if you experience {RED_FLAG_LIST}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF4E5',
    borderColor: '#F0AD4E',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    color: '#7A5300',
    fontSize: 13,
    lineHeight: 18,
  },
});
