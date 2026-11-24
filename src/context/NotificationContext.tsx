import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const registeredUidRef = useRef<string | null>(null);
  const registeringUidRef = useRef<string | null>(null);

  useEffect(() => {
    const uid = authUser?.uid;
    if (!uid) {
      registeredUidRef.current = null;
      registeringUidRef.current = null;
      setNotificationPermission('undetermined');
      setExpoPushToken(null);
      setFcmToken(null);
      setNotifications([]);
      return;
    }

    if (registeredUidRef.current === uid || registeringUidRef.current === uid) {
      return;
    }

    let cancelled = false;
    registeringUidRef.current = uid;

    const initializeNotifications = async () => {
      try {
        if (!Device.isDevice) {
          if (!cancelled) setNotificationPermission('denied');
          return;
        }

        const { status } = await Notifications.getPermissionsAsync();
        if (!cancelled) setNotificationPermission(status);
        console.log('[DIPLabs notifications] permission:', status);

        if (status !== 'granted') return;

        const result = await registerForPushNotificationsAsync(uid);
        if (cancelled) return;

        setExpoPushToken(result.expoPushToken);
        setNotificationPermission(result.permissionStatus.status);
        if (result.expoPushToken) {
          registeredUidRef.current = uid;
        }
        console.log('[DIPLabs notifications] registration complete:', Boolean(result.expoPushToken));
      } catch (error) {
        console.error('[DIPLabs notifications] registration failed:', error);
      } finally {
        if (registeringUidRef.current === uid) {
          registeringUidRef.current = null;
        }
      }
    };

    void initializeNotifications();
    return () => {
      cancelled = true;
    };
  }, [authUser?.uid]);

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