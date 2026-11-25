import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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
  const initialRegion = laboratories[0] ? { latitude: laboratories[0].latitude, longitude: laboratories[0].longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 } : undefined;

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><View><Text style={styles.title}>Peta Laboratorium</Text><Text style={styles.subtitle}>Data lokasi dari Firestore</Text></View><Pressable onPress={() => router.back()}><Text style={styles.link}>Kembali</Text></Pressable></View>
    <View style={styles.map}>{initialRegion ? <MapView style={StyleSheet.absoluteFill} initialRegion={initialRegion} showsUserLocation>{laboratories.map((lab) => <Marker key={lab.id} coordinate={{ latitude: lab.latitude, longitude: lab.longitude }} title={lab.name} description={lab.room} onPress={() => setSelected(lab)} />)}{userLocation ? <Marker coordinate={userLocation} title="Lokasi Anda" pinColor="orange" /> : null}</MapView> : <Text style={styles.mapLabel}>Belum ada lokasi laboratorium</Text>}</View>
    <Text style={styles.location}>{locationMessage}{userLocation ? ` ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}` : ''}</Text>
    {laboratories.length === 0 ? <View style={styles.empty}><Text>Belum ada laboratorium.</Text><Text style={styles.muted}>Asisten perlu menambahkan lokasi laboratorium terlebih dahulu.</Text></View> : null}
    {selected ? <View style={styles.card}><Text style={styles.heading}>{selected.name}</Text><Text style={styles.muted}>{selected.room}{selected.description ? ` · ${selected.description}` : ''}</Text><Text style={styles.section}>Sedang berlangsung</Text>{active ? <Text style={styles.muted}>{active.practicalName} · {active.className} · {active.startTime}–{active.endTime} ({active.status})</Text> : <Text style={styles.muted}>Tidak ada sesi aktif.</Text>}<Text style={styles.section}>Berikutnya</Text>{next ? <Text style={styles.muted}>{next.practicalName} · {next.className} · {next.date} {next.startTime}–{next.endTime}</Text> : <Text style={styles.muted}>Tidak ada sesi berikutnya.</Text>}</View> : <View style={styles.empty}><Text>Pilih marker laboratorium</Text><Text style={styles.muted}>Informasi sesi aktif dan berikutnya akan tampil di sini.</Text></View>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F2F1ED' }, content: { padding: 24, gap: 16 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { fontSize: 28, lineHeight: 34, fontWeight: '500', color: '#232420' }, subtitle: { color: '#5E5F58', marginTop: 4 }, link: { color: '#5E5F58', fontWeight: '600' }, map: { height: 320, backgroundColor: '#E3E7D8', borderRadius: 28, overflow: 'hidden' }, mapLabel: { color: '#5E5F58', textAlign: 'center', marginTop: 12, fontWeight: '600' }, marker: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }, selectedMarker: { backgroundColor: '#DC2626', transform: [{ scale: 1.15 }] }, markerText: { color: '#FFF', fontSize: 22 }, userMarker: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }, location: { color: '#5E5F58', fontSize: 12 }, card: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20, gap: 8 }, heading: { fontSize: 19, fontWeight: '600', color: '#232420' }, section: { marginTop: 10, fontWeight: '600', color: '#232420' }, muted: { color: '#5E5F58', lineHeight: 19 }, empty: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 28, alignItems: 'center', gap: 4 } });
