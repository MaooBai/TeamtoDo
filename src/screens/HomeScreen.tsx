import React from 'react';
import { View, Text, StyleSheet, useColorScheme} from 'react-native';
import {
    Colors,
    DebugInstructions,
    LearnMoreLinks,
    ReloadInstructions,
  } from 'react-native/Libraries/NewAppScreen';
import type {PropsWithChildren} from 'react';
export const HomeScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={{
      backgroundColor: isDarkMode ? Colors.black : Colors.white,
    }}>
      <Section title="Step One">
        Edit <Text style={styles.highlight}>App.tsx</Text> to change this
        screen and then come back to see your edits.
      </Section>
      <Section title="See Your Changes">
        <ReloadInstructions />
      </Section>
      <Section title="Debug">
        <DebugInstructions />
      </Section>
      <Section title="Learn More">
        Read the docs to discover what to do next:
      </Section>
      <LearnMoreLinks />
    </View>
  );
};

type SectionProps = PropsWithChildren<{
    title: string;
  }>;

export function Section({children, title}: SectionProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    return (
      <View style={styles.sectionContainer}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: isDarkMode ? Colors.white : Colors.black,
            },
          ]}>
          {title}
        </Text>
        <Text
          style={[
            styles.sectionDescription,
            {
              color: isDarkMode ? Colors.light : Colors.dark,
            },
          ]}>
          {children}
        </Text>
      </View>
    );
  }


const styles = StyleSheet.create({
  highlight: {
    fontWeight: '700',
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
});