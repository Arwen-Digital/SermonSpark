import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { isAuthenticatedOnline, isAuthenticatedOffline } from '../../services/authSession';

interface OfflineStatusIndicatorProps {
  style?: any;
  showDetails?: boolean;
}

interface OfflineStatus {
  isOnline: boolean;
  isAuthenticatedOnline: boolean;
  isAuthenticatedOffline: boolean;
  mode: 'offline' | 'online-authenticated' | 'online-anonymous';
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  style,
  showDetails = false
}) => {
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let networkListener: (() => void) | undefined;

    const updateStatus = async () => {
      try {
        const isOnline = Platform.OS === 'web' ? navigator.onLine : true; // Assume online on native unless network check fails
        const authOnline = await isAuthenticatedOnline();
        const authOffline = await isAuthenticatedOffline();

        let mode: OfflineStatus['mode'] = 'offline';
        if (isOnline && authOnline) {
          mode = 'online-authenticated';
        } else if (isOnline && authOffline) {
          mode = 'online-anonymous';
        }

        if (mounted) {
          setStatus({
            isOnline,
            isAuthenticatedOnline: authOnline,
            isAuthenticatedOffline: authOffline,
            mode
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to update offline status:', error);
        if (mounted) {
          setStatus({
            isOnline: false,
            isAuthenticatedOnline: false,
            isAuthenticatedOffline: true,
            mode: 'offline'
          });
          setIsLoading(false);
        }
      }
    };

    // Initial status check
    updateStatus();

    // Set up network monitoring for web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleNetworkChange = () => {
        updateStatus();
      };

      window.addEventListener('online', handleNetworkChange);
      window.addEventListener('offline', handleNetworkChange);
      
      networkListener = () => {
        window.removeEventListener('online', handleNetworkChange);
        window.removeEventListener('offline', handleNetworkChange);
      };
    }

    // Periodic status updates
    const interval = setInterval(updateStatus, 30000); // Check every 30 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
      if (networkListener) {
        networkListener();
      }
    };
  }, []);

  if (isLoading || !status) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.indicator, styles.loadingIndicator]} />
        <Text style={styles.statusText}>Checking...</Text>
      </View>
    );
  }

  const getIndicatorColor = () => {
    switch (status.mode) {
      case 'online-authenticated':
        return '#4CAF50'; // Green - fully online and authenticated
      case 'online-anonymous':
        return '#FF9800'; // Orange - online but anonymous
      case 'offline':
        return '#9E9E9E'; // Gray - offline mode
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (status.mode) {
      case 'online-authenticated':
        return 'Online';
      case 'online-anonymous':
        return 'Online (Local)';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getDetailText = () => {
    switch (status.mode) {
      case 'online-authenticated':
        return 'Syncing enabled';
      case 'online-anonymous':
        return 'Local storage only';
      case 'offline':
        return 'Working offline';
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.indicator, { backgroundColor: getIndicatorColor() }]} />
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {showDetails && (
          <Text style={styles.detailText}>{getDetailText()}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  loadingIndicator: {
    backgroundColor: '#E0E0E0',
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  detailText: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
});

export default OfflineStatusIndicator;