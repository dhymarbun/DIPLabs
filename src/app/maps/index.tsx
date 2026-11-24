import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAttendance } from '../../context/AttendanceContext';
import { GeoCoordinates, Laboratory } from '../../types/location';
import { subscribeLaboratories, watchDeviceLocation } from '../../services/location';

function matches(session: { labId?: string; room?: string }, lab: Laboratory) {
  return session.labId === lab.id || session.room?.toLowerCase() === lab.room.toLowerCase() || session.room?.toLowerCase() === lab.name.toLowerCase();
}

export default function LaboratoryMapScreen() {
  const router = useRouter();
  const { sessions } = useAttendance();
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [selected, setSelected] = useState<Laboratory>();
  const [userLocation, setUserLocation] = useState<GeoCoordinates>();
  const [locationMessage, setLocationMessage] = useState('Lokasi perangkat belum tersedia.');

  useEffect(() => subscribeLaboratories(setLaboratories, () => setLocationMessage('Data laboratorium gagal dimuat.')), []);
  useEffect(() => watchDeviceLocation(setUserLocation, (error) => setLocationMessage(error === 'denied' ? 'Izin lokasi ditolak.' : 'Lokasi perangkat tidak tersedia.')), []);
  const active = useMemo(() => selected ? sessions.find((session) => matches(session, selected) && session.status === 'open') : undefined, [selected, sessions]);
  const next = useMemo(() => selected ? sessions.filter((session) => matches(session, selected) && session.status === 'upcoming').sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))[0] : undefined, [selected, sessions]);
  const bounds = useMemo(() => {
    const lats = laboratories.map((lab) => lab.latitude).filter(Number.isFinite);
    const lons = laboratories.map((lab) => lab.longitude).filter(Number.isFinite);
    return { minLat: Math.min(...lats, 0), maxLat: Math.max(...lats, 0), minLon: Math.min(...lons, 0), maxLon: Math.max(...lons, 0) };
  }, [laboratories]);
  const markerPosition = (lab: GeoCoordinates) => ({ left: `${Math.max(4, Math.min(92, ((lab.longitude - bounds.minLon) / ((bounds.maxLon - bounds.minLon) || 1)) * 88 + 4))}%`, top: `${Math.max(4, Math.min(88, (1 - (lab.latitude - bounds.minLat) / ((bounds.maxLat - bounds.minLat) || 1)) * 80 + 4))}%` } as const);

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><View><Text style={styles.title}>Peta Laboratorium</Text><Text style={styles.subtitle}>Data lokasi dari Firestore</Text></View><Pressable onPress={() => router.back()}><Text style={styles.link}>Kembali</Text></Pressable></View>
    <View style={styles.map}><Text style={styles.mapLabel}>Peta lokasi laboratorium</Text>{laboratories.map((lab) => <Pressable key={lab.id} onPress={() => setSelected(lab)} style={[styles.marker, markerPosition(lab), selected?.id === lab.id && styles.selectedMarker]}><Text style={styles.markerText}>⌖</Text></Pressable>)}{userLocation ? <View style={[styles.userMarker, markerPosition(userLocation)]}><Text>●</Text></View> : null}</View>
    <Text style={styles.location}>{locationMessage}{userLocation ? ` ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}` : ''}</Text>
    {laboratories.length === 0 ? <View style={styles.empty}><Text>Belum ada laboratorium.</Text><Text style={styles.muted}>Asisten perlu menambahkan lokasi laboratorium terlebih dahulu.</Text></View> : null}
    {selected ? <View style={styles.card}><Text style={styles.heading}>{selected.name}</Text><Text style={styles.muted}>{selected.room}{selected.description ? ` · ${selected.description}` : ''}</Text><Text style={styles.section}>Sedang berlangsung</Text>{active ? <Text style={styles.muted}>{active.practicalName} · {active.className} · {active.startTime}–{active.endTime} ({active.status})</Text> : <Text style={styles.muted}>Tidak ada sesi aktif.</Text>}<Text style={styles.section}>Berikutnya</Text>{next ? <Text style={styles.muted}>{next.practicalName} · {next.className} · {next.date} {next.startTime}–{next.endTime}</Text> : <Text style={styles.muted}>Tidak ada sesi berikutnya.</Text>}</View> : <View style={styles.empty}><Text>Pilih marker laboratorium</Text><Text style={styles.muted}>Informasi sesi aktif dan berikutnya akan tampil di sini.</Text></View>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F8FAFC' }, content: { padding: 16, gap: 12 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { fontSize: 22, fontWeight: '800', color: '#0F172A' }, subtitle: { color: '#64748B', marginTop: 3 }, link: { color: '#2563EB', fontWeight: '700' }, map: { height: 300, backgroundColor: '#DBEAFE', borderRadius: 14, borderWidth: 1, borderColor: '#93C5FD', position: 'relative', overflow: 'hidden' }, mapLabel: { color: '#1E3A8A', textAlign: 'center', marginTop: 12, fontWeight: '600' }, marker: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }, selectedMarker: { backgroundColor: '#DC2626', transform: [{ scale: 1.15 }] }, markerText: { color: '#FFF', fontSize: 22 }, userMarker: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }, location: { color: '#475569', fontSize: 12 }, card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 7 }, heading: { fontSize: 17, fontWeight: '700', color: '#0F172A' }, section: { marginTop: 8, fontWeight: '700', color: '#334155' }, muted: { color: '#64748B', lineHeight: 19 }, empty: { backgroundColor: '#FFF', padding: 18, borderRadius: 12, alignItems: 'center', gap: 4 } });
