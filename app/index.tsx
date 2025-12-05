import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Button } from "../components";
import { triggerLightHaptic } from "../utils/haptics";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();

  // Load Staatliches font
  const [fontsLoaded, fontError] = useFonts({
    'Staatliches': require('../assets/fonts/Staatliches-Regular.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        if (fontsLoaded || fontError) {
          if (fontError) {
            console.warn('Font loading error on index:', fontError);
          }
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn('Error hiding splash screen on index:', e);
      }
    }
    prepare();
  }, [fontsLoaded, fontError]);

  // Timeout fallback - hide splash after 3 seconds even if font doesn't load
  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Timeout: Error hiding splash screen on index:', e);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleCreateMixtape = async () => {
    await triggerLightHaptic();
    router.push('/maker');
  };

  const handleMyLibrary = async () => {
    await triggerLightHaptic();
    router.push('/library');
  };

  return (
    <View style={styles.container}>
      <Text
        style={styles.title}
        accessibilityRole="header"
        accessibilityLabel="MoodyBeats"
      >
        MoodyBeats
      </Text>
      <Text
        style={styles.subtitle}
        accessibilityLabel="Nostalgic Cassette Mixtapes"
      >
        Nostalgic Cassette Mixtapes
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Create Mixtape"
          variant="primary"
          size="large"
          onPress={handleCreateMixtape}
          fullWidth
        />
        
        <Button
          title="My Library"
          variant="secondary"
          size="large"
          onPress={handleMyLibrary}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontFamily: Platform.OS === 'web' ? 'Staatliches' : 'Staatliches',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#888888',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
});
