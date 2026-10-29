import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import {
  MASEHI_MONTHS,
  HARI,
  toHijri,
  formatHijri,
  formatMasehi,
  toDateStr,
  HIJRI_MONTHS,
} from "@/utils/dates";
import {
  KajianData,
  getEventsForDate,
  DayEvent,
} from "@/utils/kajianSchedule";

interface FullCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  kajianData: KajianData;
  onSyncNotif?: () => void;
}

export function FullCalendarModal({
  visible,
  onClose,
  kajianData,
  onSyncNotif,
}: FullCalendarModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(() => today);

  const prevMonth = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now);
  };

  // Matriks kalender bulan terpilih (minggu dimulai dari Ahad: index 0)
  const monthMatrix = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Ahad
    const daysInMonth = lastDay.getDate();

    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // Hari kosong di awal
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Hari kosong di akhir
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentYear, currentMonth]);

  // Event pada tanggal yang dipilih
  const selectedEvents = useMemo(() => {
    return getEventsForDate(selectedDate, kajianData);
  }, [selectedDate, kajianData]);

  // Rentang bulan Hijriah untuk header
  const hijriMonthSpan = useMemo(() => {
    const d1 = new Date(currentYear, currentMonth, 1);
    const d2 = new Date(currentYear, currentMonth + 1, 0);
    const h1 = toHijri(d1);
    const h2 = toHijri(d2);
    if (h1.month === h2.month) {
      return `${HIJRI_MONTHS[h1.month - 1]} ${h1.year} H`;
    }
    return `${HIJRI_MONTHS[h1.month - 1]} – ${HIJRI_MONTHS[h2.month - 1]} ${h2.year} H`;
  }, [currentYear, currentMonth]);

  const todayStr = toDateStr(today);
  const selectedStr = toDateStr(selectedDate);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header Modal */}
        <View
          style={[
            styles.modalHeader,
            {
              backgroundColor: colors.primary,
              paddingTop: insets.top + (Platform.OS === "web" ? 12 : 8),
            },
          ]}
        >
          <View style={styles.modalHeaderTop}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <Text style={styles.modalHeaderTitle}>Jadwal Kalender Lengkap</Text>
              <Text style={styles.modalHeaderSub}>Sinkron Masehi & Hijriah</Text>
            </View>
            <Pressable
              onPress={jumpToToday}
              style={({ pressed }) => [
                styles.todayBtn,
                { borderColor: colors.gold, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.todayBtnText, { color: colors.gold }]}>Hari Ini</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Kalender */}
          <View
            style={[
              styles.calendarCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* Navigasi Bulan */}
            <View style={[styles.monthNav, { borderBottomColor: colors.border }]}>
              <Pressable onPress={prevMonth} hitSlop={10} style={styles.navArrow}>
                <Feather name="chevron-left" size={20} color={colors.primary} />
              </Pressable>
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={[styles.monthTitle, { color: colors.foreground }]}>
                  {MASEHI_MONTHS[currentMonth]} {currentYear}
                </Text>
                <Text style={[styles.hijriSpan, { color: colors.gold }]}>
                  {hijriMonthSpan}
                </Text>
              </View>
              <Pressable onPress={nextMonth} hitSlop={10} style={styles.navArrow}>
                <Feather name="chevron-right" size={20} color={colors.primary} />
              </Pressable>
            </View>

            {/* Nama-Nama Hari */}
            <View style={styles.daysHeaderRow}>
              {HARI.map((h, idx) => (
                <View key={h} style={styles.dayCol}>
                  <Text
                    style={[
                      styles.dayColText,
                      { color: idx === 0 ? colors.destructive : colors.mutedForeground },
                    ]}
                  >
                    {h.slice(0, 3)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Matriks Tanggal */}
            {monthMatrix.map((week, wIdx) => (
              <View key={`week-${wIdx}`} style={styles.weekRow}>
                {week.map((date, dIdx) => {
                  if (!date) {
                    return <View key={`empty-${wIdx}-${dIdx}`} style={styles.dateCell} />;
                  }

                  const ds = toDateStr(date);
                  const isToday = ds === todayStr;
                  const isSelected = ds === selectedStr;
                  const events = getEventsForDate(date, kajianData);
                  const hasEvents = events.length > 0;
                  const hasBatal = events.some((e) => !!e.batal);
                  const hDate = toHijri(date);

                  return (
                    <Pressable
                      key={ds}
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                        setSelectedDate(date);
                      }}
                      style={({ pressed }) => [
                        styles.dateCell,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isToday
                            ? colors.highlight
                            : "transparent",
                          borderColor: isSelected
                            ? colors.primary
                            : isToday
                            ? colors.gold
                            : "transparent",
                          borderWidth: isToday || isSelected ? 1.5 : 0,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateCellMasehi,
                          {
                            color: isSelected
                              ? "#FFFFFF"
                              : dIdx === 0
                              ? colors.destructive
                              : colors.foreground,
                            fontFamily: isSelected || isToday ? "Inter_700Bold" : "Inter_500Medium",
                          },
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      <Text
                        style={[
                          styles.dateCellHijri,
                          {
                            color: isSelected
                              ? "rgba(255,255,255,0.75)"
                              : colors.mutedForeground,
                          },
                        ]}
                      >
                        {hDate.day}
                      </Text>

                      {/* Dot Penanda Kajian */}
                      {hasEvents && (
                        <View
                          style={[
                            styles.eventDot,
                            {
                              backgroundColor: isSelected
                                ? colors.gold
                                : hasBatal
                                ? "#EF4444"
                                : colors.gold,
                            },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Bagian Detail Tanggal Terpilih */}
          <View style={styles.selectedDetailSection}>
            <View style={styles.selectedDateHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedMasehiTitle, { color: colors.foreground }]}>
                  {formatMasehi(selectedDate)}
                </Text>
                <Text style={[styles.selectedHijriSubtitle, { color: colors.gold }]}>
                  {formatHijri(selectedDate)}
                </Text>
              </View>

              {onSyncNotif && (
                <Pressable
                  onPress={onSyncNotif}
                  style={({ pressed }) => [
                    styles.syncBtn,
                    { backgroundColor: colors.highlight, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="bell" size={13} color={colors.primary} />
                  <Text style={[styles.syncBtnText, { color: colors.primary }]}>Sinkron Notif</Text>
                </Pressable>
              )}
            </View>

            {selectedEvents.length === 0 ? (
              <View
                style={[
                  styles.noEventsBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Feather
                  name="calendar"
                  size={24}
                  color={colors.mutedForeground}
                  style={{ opacity: 0.5, marginBottom: 6 }}
                />
                <Text style={[styles.noEventsText, { color: colors.mutedForeground }]}>
                  Tidak ada jadwal kajian pada tanggal ini.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {selectedEvents.map((evt) => (
                  <Pressable
                    key={evt.kajian.id}
                    onPress={() => {
                      onClose();
                      router.push(`/kajian/${evt.kajian.id}`);
                    }}
                    style={({ pressed }) => [
                      styles.eventCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: evt.batal ? "#FCA5A5" : colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={styles.eventCardHeader}>
                      <View
                        style={[
                          styles.timeBadge,
                          {
                            backgroundColor: evt.batal
                              ? "#FEE2E2"
                              : colors.highlight,
                          },
                        ]}
                      >
                        <Feather
                          name="clock"
                          size={11}
                          color={evt.batal ? "#EF4444" : colors.primary}
                        />
                        <Text
                          style={[
                            styles.timeBadgeText,
                            { color: evt.batal ? "#EF4444" : colors.primary },
                          ]}
                        >
                          {evt.waktu}
                        </Text>
                      </View>

                      {evt.isRescheduled && !evt.batal && (
                        <View style={styles.rescheduleBadge}>
                          <Text style={styles.rescheduleText}>📌 Jadwal Diperbarui</Text>
                        </View>
                      )}

                      {evt.batal && (
                        <View style={styles.batalBadge}>
                          <Text style={styles.batalBadgeText}>⚠️ Dibatalkan</Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.eventJudul,
                        {
                          color: evt.batal ? colors.mutedForeground : colors.foreground,
                          textDecorationLine: evt.batal ? "line-through" : "none",
                        },
                      ]}
                    >
                      {evt.kajian.judul}
                    </Text>

                    <Text style={[styles.eventUstadz, { color: colors.mutedForeground }]}>
                      {evt.kajian.ustadz}
                    </Text>

                    {evt.batal ? (
                      <View style={styles.batalAlasanBox}>
                        <Feather name="alert-circle" size={12} color="#EF4444" />
                        <Text style={styles.batalAlasanText}>
                          Alasan: {evt.batal.alasan}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.eventLocRow}>
                        <Feather name="map-pin" size={11} color={colors.gold} />
                        <Text style={[styles.eventLocText, { color: colors.mutedForeground }]}>
                          {evt.kajian.lokasi}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  modalHeaderSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(201,162,39,0.15)",
  },
  todayBtnText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 20,
  },
  calendarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  navArrow: {
    padding: 6,
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  hijriSpan: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  daysHeaderRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayColText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  dateCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dateCellMasehi: {
    fontSize: 14,
  },
  dateCellHijri: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    marginTop: -1,
  },
  eventDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  selectedDetailSection: {
    marginTop: 4,
  },
  selectedDateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  selectedMasehiTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  selectedHijriSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  syncBtnText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  noEventsBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noEventsText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  eventCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  rescheduleBadge: {
    backgroundColor: "rgba(201,162,39,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rescheduleText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#C9A227",
  },
  batalBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  batalBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#EF4444",
  },
  eventJudul: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  eventUstadz: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
  },
  eventLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventLocText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  batalAlasanBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  batalAlasanText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#991B1B",
  },
});
