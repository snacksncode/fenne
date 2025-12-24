import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Button } from './button';
import { colors } from '@/constants/colors';
import * as SecureStore from 'expo-secure-store';
import { queryClient, TANSTACK_QUERY_CACHE_KEY } from '@/query-client';
import { TOKEN_KEY } from '@/contexts/session';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isRecovering: boolean;
}

export class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isRecovering: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, isRecovering: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  handleRecovery = async () => {
    this.setState({ isRecovering: true });

    try {
      await AsyncStorage.removeItem(TANSTACK_QUERY_CACHE_KEY);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      queryClient.clear();
      this.setState({ hasError: false, isRecovering: false });
    } catch (e) {
      console.error('Failed to clear cache:', e);
      this.setState({ isRecovering: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>The app encountered an error. Try clearing the cache to recover.</Text>
          <Button
            variant="primary"
            text="Clear Cache & Retry"
            onPress={this.handleRecovery}
            isLoading={this.state.isRecovering}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.cream[100],
  },
  title: {
    fontSize: 24,
    fontFamily: 'Satoshi-Bold',
    color: colors.brown[900],
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Satoshi-Regular',
    color: colors.brown[700],
    textAlign: 'center',
    marginBottom: 24,
  },
});
