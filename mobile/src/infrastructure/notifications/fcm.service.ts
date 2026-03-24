import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface RemoteMessage {
  title: string | undefined;
  body: string | undefined;
  data: Record<string, string>;
}

export interface IFCMService {
  requestPermission(): Promise<boolean>;
  getToken(): Promise<string | null>;
  onMessage(handler: (notification: RemoteMessage) => void): () => void;
  onBackgroundMessage(handler: (notification: RemoteMessage) => void): void;
}

class FCMService implements IFCMService {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.warn('FCM permission request failed:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const { data } = await Notifications.getDevicePushTokenAsync();
      return data ?? null;
    } catch (error) {
      console.warn('FCM token retrieval failed:', error);
      return null;
    }
  }

  onMessage(handler: (notification: RemoteMessage) => void): () => void {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      handler({
        title: notification.request.content.title ?? undefined,
        body: notification.request.content.body ?? undefined,
        data: (notification.request.content.data as Record<string, string>) ?? {},
      });
    });
    return () => subscription.remove();
  }

  onBackgroundMessage(_handler: (notification: RemoteMessage) => void): void {
    // Background notifications are handled natively by expo-notifications
    // No explicit listener needed here
  }
}

export const fcmService = new FCMService();
