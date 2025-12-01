import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../components";
import { triggerLightHaptic } from "../utils/haptics";

export default function Index() {
  const router = useRouter();

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
    fontWeight: 'bold',
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
