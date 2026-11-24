import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
  handleNotificationResponse,
  NotificationLog,
} from '../services/notifications';
import { isFirebaseConfigured } from '../firebase/config';
import { NotificationContextValue, NotificationPayload, NotificationPermissionStatus } from '../types/notification';

export type { NotificationContextValue, NotificationPermissionStatus };

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authUser } = useAuth();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus>('undetermined');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  useEffect(() => {
    if (!authUser) {
      setNotificationPermission('undetermined');
      setExpoPushToken(null);
      setFcmToken(null);
      setNotifications([]);
      return;
    }

    const initializeNotifications = async () => {
      if (!Device.isDevice) {
        setNotificationPermission('denied');
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status);

      if (status === 'granted') {
        await registerForPushNotificationsAsync(authUser.uid);
      }
    };

    initializeNotifications();
  }, [authUser]);

  useEffect(() => {
    if (!authUser || notificationPermission !== 'granted') return;

    const unsubscribe = setupNotificationListeners(
      (notification) => {
        const log: NotificationLog = {
          id: `local-${Date.now()}`,
          recipientIds: [authUser.uid],
          title: notification.request.content.title ?? '',
          body: notification.request.content.body ?? '',
          data: notification.request.content.data as unknown as NotificationPayload,
          sentVia: 'local',
          status: 'delivered',
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [log, ...prev.slice(0, 49)]);
      },
      (response) => {
        handleNotificationResponse(response, router, authUser);
      }
    );

    return () => unsubscribe();
  }, [authUser, notificationPermission, router]);

  const registerForPushNotifications = useCallback(async () => {
    if (!authUser) return;
    if (isRegistering) return;

    setIsRegistering(true);
    try {
      const result = await registerForPushNotificationsAsync(authUser.uid);
      setExpoPushToken(result.expoPushToken);
      setNotificationPermission(result.permissionStatus.status);
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
    } finally {
      setIsRegistering(false);
    }
  }, [authUser, isRegistering]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notificationPermission,
      expoPushToken,
      fcmToken,
      notifications,
      registerForPushNotifications,
      clearNotifications,
    }),
    [
      notificationPermission,
      expoPushToken,
      fcmToken,
      notifications,
      registerForPushNotifications,
      clearNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}