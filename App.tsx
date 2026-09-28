import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { registerRootComponent } from 'expo';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { registrarNotificacionesPushAsync } from './src/services/notificaciones';

function App() {
  useEffect(() => {
    registrarNotificacionesPushAsync();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#003087" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// registerRootComponent llama AppRegistry.registerComponent('main', ...)
// y en web también ejecuta AppRegistry.runApplication para montar en #root
registerRootComponent(App);

export default App;
