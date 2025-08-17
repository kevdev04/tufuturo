import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { violetTheme } from '../theme/colors';
import { useRoute } from '@react-navigation/native';

type School = {
  name: string;
  type: string; // 'publica' | 'privada' | others
  position: { lat: number; lng: number };
  state?: string;
  cost?: number;
};

const HOST_BASE = 'https://tu-futuro-backend-production.up.railway.app';
const API_URLS = [`${HOST_BASE}/escuelas`, `${HOST_BASE}/api/escuelas`];

const sampleData: Record<string, School[]> = {
  // Minimal sample to ensure the screen renders if API is unavailable
  Mexico: [
    {
      name: 'Universidad Nacional Autónoma de México',
      type: 'publica',
      position: { lat: 19.3221533, lng: -99.1881455 },
    },
    {
      name: 'Tecnológico de Monterrey (Campus CDMX)',
      type: 'privada',
      position: { lat: 19.3622459, lng: -99.2623803 },
    },
  ],
};

function flattenSchoolsResponse(data: any): School[] {
  const result: School[] = [];
  if (!data) return result;

  const toNumber = (value: any): number | null => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const pickLat = (obj: any): number | null => {
    const candidates = [
      obj?.lat,
      obj?.latitude,
      obj?.latitud,
      obj?.position?.lat,
      obj?.ubicacion?.lat,
      obj?.coordenadas?.lat,
    ];
    for (const v of candidates) {
      const n = toNumber(v);
      if (n !== null) return n;
    }
    return null;
  };

  const pickLng = (obj: any): number | null => {
    const candidates = [
      obj?.lng,
      obj?.longitude,
      obj?.longitud,
      obj?.position?.lng,
      obj?.ubicacion?.lng,
      obj?.coordenadas?.lng,
    ];
    for (const v of candidates) {
      const n = toNumber(v);
      if (n !== null) return n;
    }
    return null;
  };

  const normalize = (raw: any, stateName?: string): School[] => {
    if (!raw || typeof raw !== 'object') return [];
    const name = raw.name ?? raw.nombre ?? raw.school_name ?? 'Escuela';
    const type = raw.type ?? raw.tipo ?? undefined;
    const state = stateName ?? raw.state ?? raw.estado ?? raw.entidad ?? undefined;
    const costVal = toNumber(raw.costo ?? raw.cost ?? raw.colegiatura);

    // Caso: ubicacion es una lista de coordenadas
    if (Array.isArray(raw?.ubicacion) && raw.ubicacion.length > 0) {
      const schools: School[] = [];
      for (const coord of raw.ubicacion) {
        const lat = pickLat(coord);
        const lng = pickLng(coord);
        if (lat === null || lng === null) continue;
        schools.push({ name, type, position: { lat, lng }, state, cost: costVal === null ? undefined : costVal });
      }
      if (schools.length) return schools;
    }

    // Caso: objeto plano con lat/lng
    const lat = pickLat(raw);
    const lng = pickLng(raw);
    if (lat === null || lng === null) return [];
    return [{ name, type, position: { lat, lng }, state, cost: costVal === null ? undefined : costVal }];
  };

  // Case 1: paginated or wrapped array { results: [...] }
  if (Array.isArray((data as any)?.results)) {
    for (const item of (data as any).results) {
      const items = normalize(item);
      for (const s of items) result.push(s);
    }
    return result;
  }

  // Case 2: plain array
  if (Array.isArray(data)) {
    for (const item of data) {
      const items = normalize(item);
      for (const s of items) result.push(s);
    }
    return result;
  }

  // Case 3: dictionary keyed by state/region -> School[]
  if (typeof data === 'object') {
    for (const key of Object.keys(data)) {
      const arr = Array.isArray((data as any)[key]) ? (data as any)[key] : [];
      for (const item of arr) {
        const items = normalize(item, key);
        for (const s of items) result.push(s);
      }
    }
  }
  return result;
}

const defaultRegion: Region = {
  latitude: 23.6345, // Mexico center approx
  longitude: -102.5528,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

const SchoolsMapScreen: React.FC = () => {
  const route = useRoute<any>();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [career, setCareer] = useState<string>(route?.params?.carrera ?? 'Biología');

  useEffect(() => {
    let isMounted = true;
    const fetchSchools = async () => {
      try {
        const carreraParam: string | undefined = career || route?.params?.carrera;
        const carreraQuery = encodeURIComponent(carreraParam || 'Biología');
        let fetched = false;
        for (const baseUrl of API_URLS) {
          const url = `${baseUrl}?carrera=${carreraQuery}`;
          const response = await fetch(url, { headers: { Accept: 'application/json' } });
          if (response.ok) {
            const json = await response.json();
            const flattened = flattenSchoolsResponse(json);
            if (isMounted) setSchools(flattened);
            fetched = true;
            break;
          }
        }
        if (!fetched) throw new Error('HTTP 404');
      } catch (error) {
        console.log('Failed to load schools from API. Using sample data.', error);
        if (isMounted) setSchools(flattenSchoolsResponse(sampleData as any));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSchools();
    return () => {
      isMounted = false;
    };
  }, [career, route?.params?.carrera]);

  const initialRegion: Region = useMemo(() => {
    if (!schools.length) return defaultRegion;
    const lat = schools.reduce((sum, s) => sum + s.position.lat, 0) / schools.length;
    const lng = schools.reduce((sum, s) => sum + s.position.lng, 0) / schools.length;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 8,
      longitudeDelta: 8,
    };
  }, [schools]);

  const getPinColor = (type: string | undefined): string => {
    if (!type) return violetTheme.colors.primary;
    const normalized = type.toLowerCase();
    if (normalized === 'publica') return violetTheme.colors.success; // verde para públicas
    if (normalized === 'privada') return violetTheme.colors.violet700; // morado para privadas
    return violetTheme.colors.primary;
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={violetTheme.colors.primary} />
          <Text style={styles.loaderText}>Loading map…</Text>
        </View>
      ) : (
        <View style={styles.mapWrapper}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.input}
              placeholder="Buscar por carrera (ej. Biología)"
              placeholderTextColor={violetTheme.colors.muted}
              value={career}
              onChangeText={setCareer}
              returnKeyType="search"
              onSubmitEditing={() => setCareer((c) => c.trim())}
            />
            <TouchableOpacity style={styles.searchButton} onPress={() => setCareer((c) => c.trim() || 'Biología')}>
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </View>
          <MapView style={styles.map} initialRegion={initialRegion}>
            {schools.map((school, index) => (
              <Marker
                key={`${school.name}-${index}`}
                coordinate={{ latitude: school.position.lat, longitude: school.position.lng }}
                title={school.name}
                pinColor={getPinColor(school.type)}
              >
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{school.name}</Text>
                    <View style={styles.badgeRow}>
                      {school.type ? (
                        <View
                          style={[
                            styles.badge,
                            school.type.toLowerCase() === 'publica'
                              ? styles.badgePublic
                              : styles.badgePrivate,
                          ]}
                        >
                          <Text style={styles.badgeText}>
                            {school.type.charAt(0).toUpperCase() + school.type.slice(1)}
                          </Text>
                        </View>
                      ) : null}
                      {school.state ? (
                        <View style={[styles.badge, styles.badgeNeutral]}>
                          <Text style={styles.badgeText}>{school.state}</Text>
                        </View>
                      ) : null}
                    </View>
                    {typeof school.cost === 'number' ? (
                      <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Costo aproximado</Text>
                        <Text style={styles.costValue}>
                          {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                            maximumFractionDigits: 0,
                          }).format(school.cost)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Legend</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: violetTheme.colors.success }]} />
              <Text style={styles.legendText}>Pública</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: violetTheme.colors.violet700 }]} />
              <Text style={styles.legendText}>Privada</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: violetTheme.colors.background,
  },
  mapWrapper: {
    flex: 1,
  },
  searchBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    backgroundColor: violetTheme.colors.background,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    gap: 8,
    shadowColor: violetTheme.shadows.md.shadowColor,
    shadowOffset: violetTheme.shadows.md.shadowOffset,
    shadowOpacity: violetTheme.shadows.md.shadowOpacity,
    shadowRadius: violetTheme.shadows.md.shadowRadius,
    elevation: violetTheme.shadows.md.elevation,
  },
  input: {
    flex: 1,
    color: violetTheme.colors.foreground,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  searchButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: violetTheme.colors.violet700,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 8,
    color: violetTheme.colors.muted,
  },
  callout: {
    minWidth: 180,
  },
  calloutTitle: {
    fontWeight: '700',
    color: violetTheme.colors.foreground,
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgePublic: {
    backgroundColor: `${violetTheme.colors.success}22`,
  },
  badgePrivate: {
    backgroundColor: `${violetTheme.colors.violet700}22`,
  },
  badgeNeutral: {
    backgroundColor: `${violetTheme.colors.muted}22`,
  },
  badgeText: {
    color: violetTheme.colors.foreground,
    fontSize: 12,
    fontWeight: '500',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  costLabel: {
    color: violetTheme.colors.muted,
  },
  costValue: {
    color: violetTheme.colors.violet700,
    fontWeight: '700',
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: violetTheme.colors.background,
    borderRadius: 12,
    padding: 12,
    shadowColor: violetTheme.shadows.md.shadowColor,
    shadowOffset: violetTheme.shadows.md.shadowOffset,
    shadowOpacity: violetTheme.shadows.md.shadowOpacity,
    shadowRadius: violetTheme.shadows.md.shadowRadius,
    elevation: violetTheme.shadows.md.elevation,
  },
  legendTitle: {
    fontWeight: '600',
    marginBottom: 6,
    color: violetTheme.colors.foreground,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: violetTheme.colors.foreground,
  },
});

export default SchoolsMapScreen;


