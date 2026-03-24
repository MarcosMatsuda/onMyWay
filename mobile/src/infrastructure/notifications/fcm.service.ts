import messaging from '@react-native-firebase/messaging';

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
    try {
      const authorizationStatus = await messaging().requestPermission();
      // 1 = granted, 0 = not determined, 2 = denied, 3 = provisional
      return (
        authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.warn('FCM permission request failed:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token || null;
    } catch (error) {
      console.warn('FCM token retrieval failed:', error);
      return null;
    }
  }

  onMessage(handler: (notification: RemoteMessage) => void): () => void {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const data: Record<string, string> = {};
      if (remoteMessage.data) {
        Object.entries(remoteMessage.data).forEach(([key, value]) => {
          if (typeof value === 'string') {
            data[key] = value;
          }
        });
      }

      handler({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data,
      });
    });

    return unsubscribe;
  }

  onBackgroundMessage(handler: (notification: RemoteMessage) => void): void {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      const data: Record<string, string> = {};
      if (remoteMessage.data) {
        Object.entries(remoteMessage.data).forEach(([key, value]) => {
          if (typeof value === 'string') {
            data[key] = value;
          }
        });
      }

      handler({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data,
      });
    });
  }
}

export const fcmService = new FCMService();
