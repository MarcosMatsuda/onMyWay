import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export interface RemoteMessage {
  title: string | undefined;
  body: string | undefined;
  data: Record<string, string>;
}

export interface FCMService {
  requestPermission(): Promise<boolean>;
  getToken(): Promise<string | null>;
  onMessage(handler: (notification: RemoteMessage) => void): () => void;
  onBackgroundMessage(handler: (notification: RemoteMessage) => void): void;
}

class FCMServiceImpl implements FCMService {
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.warn('Failed to request messaging permission:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token || null;
    } catch (error) {
      console.warn('Failed to get FCM token:', error);
      return null;
    }
  }

  onMessage(handler: (notification: RemoteMessage) => void): () => void {
    const unsubscribe = messaging().onMessage(
      (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const notification: RemoteMessage = {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data || {},
        };
        handler(notification);
      },
    );

    return unsubscribe;
  }

  onBackgroundMessage(handler: (notification: RemoteMessage) => void): void {
    messaging().setBackgroundMessageHandler(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const notification: RemoteMessage = {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data || {},
        };
        handler(notification);
      },
    );
  }
}

export const fcmService = new FCMServiceImpl();
