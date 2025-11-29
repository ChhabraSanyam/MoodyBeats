import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
        <TouchableOpacity
          style={styles.button}
          onPress={handleCreateMixtape}
          accessibilityLabel="Create new mixtape"
          accessibilityRole="button"
          accessibilityHint="Navigate to mixtape creation screen"
        >
          <Text style={styles.buttonText}>Create Mixtape</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleMyLibrary}
          accessibilityLabel="View my library"
          accessibilityRole="button"
          accessibilityHint="Navigate to mixtape library screen"
        >
          <Text style={styles.buttonText}>My Library</Text>
        </TouchableOpacity>
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
  button: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
