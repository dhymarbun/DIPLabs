import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { FCMTokenData, NotificationPayload } from '../types/notification';

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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissionsAsync(): Promise<Notifications.NotificationPermissionsStatus> {
  if (!Device.isDevice) {
    const current = await Notifications.getPermissionsAsync();
    return { ...current, status: Notifications.PermissionStatus.DENIED, granted: false };
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === Notifications.PermissionStatus.GRANTED) return current;
  return Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
}

export async function getExpoPushTokenAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  const result = await Notifications.getExpoPushTokenAsync({ projectId });
  return result.data;
}

export async function saveTokenToUser(uid: string, tokenData: FCMTokenData): Promise<void> {
  if (!isFirebaseConfigured) return;
  await updateDoc(doc(db, 'users', uid), {
    fcmTokens: arrayUnion(tokenData.expoPushToken ?? tokenData.fcmToken),
    updatedAt: serverTimestamp(),
  });
}

export function createNotificationPayload(
  type: NotificationPayload['type'],
  options: Partial<NotificationPayload> = {}
): NotificationPayload {
  return { type, ...options };
}

export function generateNotificationTitle(payload: NotificationPayload): string {
  if (payload.type === 'session_opened') return `Sesi Dibuka: ${payload.sessionName ?? 'Praktikum'}`;
  if (payload.type === 'schedule_updated') return `Jadwal Diubah: ${payload.sessionName ?? 'Praktikum'}`;
  return `Izin ${payload.decision === 'approved' ? 'Disetujui' : 'Ditolak'}`;
}

export function generateNotificationBody(payload: NotificationPayload): string {
  if (payload.type === 'session_opened') return `Sesi ${payload.sessionName ?? 'praktikum'} telah dibuka.`;
  if (payload.type === 'schedule_updated') return `Jadwal ${payload.sessionName ?? 'praktikum'} telah diperbarui.`;
  return `Pengajuan izin Anda telah ${payload.decision === 'approved' ? 'disetujui' : 'ditolak'}.`;
}

export async function sendPushNotificationToUsers(
  recipientIds: string[],
  payload: NotificationPayload
): Promise<NotificationLog[]> {
  const logs: NotificationLog[] = [];
  if (!isFirebaseConfigured) return logs;
  const tokens: string[] = [];
  for (const uid of recipientIds) {
    const snapshot = await getDoc(doc(db, 'users', uid));
    const values = snapshot.data()?.fcmTokens;
    if (Array.isArray(values)) tokens.push(...values.filter((value): value is string => typeof value === 'string'));
  }
  if (tokens.length === 0) return logs;
  const messages = tokens.map((token) => ({
    to: token,
    title: generateNotificationTitle(payload),
    body: generateNotificationBody(payload),
    data: payload,
    sound: 'default',
    priority: 'high',
    channelId: 'diplabs-default',
  }));
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  const result = (await response.json()) as { data?: Array<{ status?: string }> };
  (result.data ?? []).forEach((item, index) => logs.push({
    id: `log-${Date.now()}-${index}`,
    recipientIds: [recipientIds[index] ?? ''],
    title: generateNotificationTitle(payload),
    body: generateNotificationBody(payload),
    data: payload,
    sentVia: 'expo',
    status: item.status === 'ok' ? 'sent' : 'failed',
    createdAt: new Date().toISOString(),
  }));
  return logs;
}

export async function scheduleLocalNotification(payload: NotificationPayload): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title: generateNotificationTitle(payload), body: generateNotificationBody(payload), data: payload, sound: 'default' },
    trigger: null,
  });
}

export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
): () => void {
  const received = Notifications.addNotificationReceivedListener(onNotificationReceived);
  const response = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
  return () => { received.remove(); response.remove(); };
}

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  router: { push: (href: string) => void },
  authUser: { role: string } | null
): void {
  const data = response.notification.request.content.data as NotificationPayload;
  if (data.type === 'permission_reviewed') router.push(authUser?.role === 'asisten' ? '/asisten/izin' : '/praktikan/izin');
  else if (data.sessionId) router.push(`${authUser?.role === 'asisten' ? '/asisten' : '/praktikan'}/${data.sessionId}`);
}

export async function registerForPushNotificationsAsync(uid: string): Promise<{ expoPushToken: string | null; permissionStatus: Notifications.NotificationPermissionsStatus }> {
  const permissionStatus = await requestNotificationPermissionsAsync();
  if (permissionStatus.status !== Notifications.PermissionStatus.GRANTED) return { expoPushToken: null, permissionStatus };
  const expoPushToken = await getExpoPushTokenAsync();
  if (expoPushToken) await saveTokenToUser(uid, { expoPushToken, platform: Platform.OS as 'ios' | 'android', updatedAt: new Date().toISOString() });
  return { expoPushToken, permissionStatus };
}

export async function createNotificationLogDoc(log: Omit<NotificationLog, 'id'>): Promise<string> {
  if (!isFirebaseConfigured) return `local-${Date.now()}`;
  const reference = await addDoc(collection(db, 'notifications'), { ...log, createdAt: serverTimestamp() });
  return reference.id;
}
