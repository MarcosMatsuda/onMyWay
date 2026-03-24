import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { fcmService } from '@infrastructure/notifications';

export interface UseNotifications {
  fcmToken: string | null;
  permissionGranted: boolean;
  requestPermission(): Promise<void>;
}

export function useNotifications(): UseNotifications {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const initializeFCM = async (): Promise<void> => {
      try {
        // Request permission from user
        const granted = await fcmService.requestPermission();
        setPermissionGranted(granted);

        // Get FCM token if permission granted
        if (granted) {
          const token = await fcmService.getToken();
          setFcmToken(token);
        }

        // Subscribe to foreground messages
        const unsubscribe = fcmService.onMessage(async (notification) => {
          // Display local notification
          await Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title || 'Notification',
              body: notification.body || '',
              data: notification.data,
            },
            trigger: null, // Show immediately
          });
        });

        // Handle background messages
        fcmService.onBackgroundMessage(async (notification) => {
          // Background message is handled by Firebase
          // We just log it here for debugging
          console.log('Background notification received:', notification);
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.warn('Failed to initialize FCM:', error);
      }
    };

    void initializeFCM();
  }, []);

  const requestPermission = async (): Promise<void> => {
    try {
      const granted = await fcmService.requestPermission();
      setPermissionGranted(granted);

      if (granted) {
        const token = await fcmService.getToken();
        setFcmToken(token);
      }
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
    }
  };

  return {
    fcmToken,
    permissionGranted,
    requestPermission,
  };
}
