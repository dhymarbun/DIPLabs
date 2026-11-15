import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { classifyPermissionReason } from '../services/ai';
import {
  createPermissionDoc,
  updatePermissionReviewDoc,
} from '../services/firestore';
import {
  AIClassification,
  PermissionContextValue,
  PermissionRequest,
  PermissionStatus,
} from '../types/attendance';
import { useAuth } from './AuthContext';

const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined
);

export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser } = useAuth();
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !authUser) {
      setPermissions([]);
      setPermissionsLoading(false);
      return;
    }

    setPermissionsLoading(true);
    setPermissionsError(null);

    const baseCollection = collection(db, 'permissionRequests');
    const q =
      authUser.role === 'asisten'
        ? baseCollection
        : query(baseCollection, where('studentId', '==', authUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: PermissionRequest[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const status: PermissionStatus =
            d.status === 'approved' || d.status === 'rejected'
              ? d.status
              : 'pending';
          return {
            id: docSnap.id,
            sessionId: String(d.sessionId ?? ''),
            studentId: String(d.studentId ?? ''),
            studentName: String(d.studentName ?? ''),
            reason: String(d.reason ?? ''),
            aiCategory: d.aiCategory ? String(d.aiCategory) : undefined,
            aiConfidence:
              typeof d.aiConfidence === 'number' ? d.aiConfidence : undefined,
            status,
            createdAt: String(d.createdAt ?? ''),
            reviewedAt: d.reviewedAt ? String(d.reviewedAt) : undefined,
            reviewedBy: d.reviewedBy ? String(d.reviewedBy) : undefined,
            reviewerNote: d.reviewerNote ? String(d.reviewerNote) : undefined,
          };
        });
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setPermissions(list);
        setPermissionsLoading(false);
      },
      (err) => {
        setPermissionsError(
          err.message || 'Gagal memuat data pengajuan izin dari Firestore.'
        );
        setPermissionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  const myPermissions = useMemo(() => {
    if (!authUser) return [];
    return permissions.filter((p) => p.studentId === authUser.uid);
  }, [permissions, authUser]);

  const pendingPermissions = useMemo(() => {
    return permissions.filter((p) => p.status === 'pending');
  }, [permissions]);

  const submitPermission = useCallback(
    async (
      sessionId: string,
      reason: string
    ): Promise<{
      ok: boolean;
      error?: string;
      aiClassification?: AIClassification;
    }> => {
      const trimmedReason = reason.trim();
      if (!sessionId) {
        return { ok: false, error: 'Pilih sesi praktikum terlebih dahulu.' };
      }
      if (!trimmedReason) {
        return { ok: false, error: 'Alasan izin wajib diisi.' };
      }
      if (!authUser) {
        return {
          ok: false,
          error: 'Anda harus login terlebih dahulu untuk mengajukan izin.',
        };
      }

      let aiResult: AIClassification = { category: 'tidak_diketahui' };
      try {
        aiResult = await classifyPermissionReason(trimmedReason);
      } catch {
        aiResult = { category: 'tidak_diketahui' };
      }

      const newRequest: Omit<PermissionRequest, 'id'> = {
        sessionId,
        studentId: authUser.uid,
        studentName: authUser.name,
        reason: trimmedReason,
        aiCategory: aiResult.category,
        aiConfidence: aiResult.confidence,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      try {
        if (isFirebaseConfigured) {
          await createPermissionDoc(newRequest);
        } else {
          setPermissions((prev) => [
            { ...newRequest, id: `perm-${Date.now()}` },
            ...prev,
          ]);
        }
        return {
          ok: true,
          aiClassification: aiResult,
        };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Gagal menyimpan pengajuan izin ke Firestore.',
          aiClassification: aiResult,
        };
      }
    },
    [authUser]
  );

  const reviewPermission = useCallback(
    async (
      requestId: string,
      decision: 'approved' | 'rejected',
      note?: string
    ) => {
      const reviewer = authUser?.name ?? authUser?.uid ?? 'Asisten';
      if (isFirebaseConfigured && authUser) {
        await updatePermissionReviewDoc(requestId, decision, reviewer, note);
      } else {
        setPermissions((prev) =>
          prev.map((p) =>
            p.id === requestId
              ? {
                  ...p,
                  status: decision,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: reviewer,
                  reviewerNote: note,
                }
              : p
          )
        );
      }
    },
    [authUser]
  );

  const value = useMemo<PermissionContextValue>(
    () => ({
      myPermissions,
      pendingPermissions,
      allPermissions: permissions,
      permissionsLoading,
      permissionsError,
      submitPermission,
      reviewPermission,
    }),
    [
      myPermissions,
      pendingPermissions,
      permissions,
      permissionsLoading,
      permissionsError,
      submitPermission,
      reviewPermission,
    ]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
