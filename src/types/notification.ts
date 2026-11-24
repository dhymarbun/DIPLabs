export type Laboratory = {
  id: string;
  name: string;
  room: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  updatedAt: string;
};

export type PushNotificationType =
  | 'session_opened'
  | 'schedule_updated'
  | 'permission_reviewed';

export type NotificationPayload = {
  type: PushNotificationType;
  sessionId?: string;
  sessionName?: string;
  className?: string;
  permissionId?: string;
  decision?: 'approved' | 'rejected';
  studentId?: string;
  changes?: string[];
};

export type FCMTokenData = {
  expoPushToken?: string;
  fcmToken?: string;
  deviceId?: string;
  platform: 'ios' | 'android';
  updatedAt: string;
};

export type NotificationLog = {
  id: string;
  recipientIds: string[];
  title: string;
  body: string;
  data: NotificationPayload;
  sentVia: 'expo' | 'fcm' | 'local';
  status: 'sent' | 'failed' | 'delivered';
  createdAt: string;
};

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined';

export type NotificationContextValue = {
  notificationPermission: NotificationPermissionStatus;
  expoPushToken: string | null;
  fcmToken: string | null;
  notifications: NotificationLog[];
  registerForPushNotifications: () => Promise<void>;
  clearNotifications: () => void;
};