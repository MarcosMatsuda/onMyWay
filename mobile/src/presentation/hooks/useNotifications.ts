import { useEffect, useState, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { fcmService, type RemoteMessage } from '@infrastructure/notifications';

export interface UseNotifications {
  fcmToken: string | null;
  permissionGranted: boolean;
  requestPermission(): Promise<void>;
}

export const useNotifications = (): UseNotifications => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const handlerConfigured = useRef(false);

  // Request permission and get token on mount
  useEffect(() => {
    // Configure notification handler once inside the effect, not at module level
    if (!handlerConfigured.current) {
      handlerConfigured.current = true;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }

    const initializeNotifications = async (): Promise<() => void> => {
      try {
        // Request FCM permission
        const granted = await fcmService.requestPermission();
        setPermissionGranted(granted);

        if (granted) {
          // Get FCM token
          const token = await fcmService.getToken();
          setFcmToken(token);
        }

        // Handle foreground messages
        const unsubscribeForeground = fcmService.onMessage((message: RemoteMessage) => {
          // Show local notification
          void Notifications.scheduleNotificationAsync({
            content: {
              title: message.title || 'Notification',
              body: message.body || '',
              data: message.data,
            },
            trigger: null,
          }).catch((error) => {
            console.warn('Failed to schedule notification:', error);
          });
        });

        // Handle background messages
        fcmService.onBackgroundMessage((message: RemoteMessage) => {
          // Background message handler — notification already shown by FCM
          console.log('Background message received:', message);
        });

        return unsubscribeForeground;
      } catch (error) {
        console.warn('Notification initialization failed:', error);
        return () => {};
      }
    };

    let unsubscribe: (() => void) | null = null;

    initializeNotifications()
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => {
        console.warn('Error initializing notifications:', error);
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<void> => {
    try {
      const granted = await fcmService.requestPermission();
      setPermissionGranted(granted);

      if (granted) {
        const token = await fcmService.getToken();
        setFcmToken(token);
      }
    } catch (error) {
      console.warn('Permission request failed:', error);
    }
  }, []);

  return {
    fcmToken,
    permissionGranted,
    requestPermission,
  };
};
