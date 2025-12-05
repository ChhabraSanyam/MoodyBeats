import { Stack } from "expo-router";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ToastProvider } from "../components/ToastProvider";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </ToastProvider>
    </ErrorBoundary>
  );
}
