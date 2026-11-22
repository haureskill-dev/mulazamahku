import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Kajian, Flyer } from "@/types";
import {
  ADMIN_KAJIAN_CONTACTS,
  OJEK_CONTACTS,
  PENGAJAR_PROFILES,
} from "@/services/dummyData";
import { ProgressService } from "@/services/progressService";
import { isKajianOnDate } from "@/utils/kajianSchedule";
import { formatMasehi, formatHijri, toDateStr, parseDateStr } from "@/utils/dates";

interface ChatAction {
  label: string;
  type: "wa" | "kajian";
  phone?: string;
  waText?: string;
  kajianId?: string;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  actions?: ChatAction[];
}

interface MulazamahChatbotModalProps {
  visible: boolean;
  onClose: () => void;
  allKajianList: Kajian[];
  flyers: Flyer[];
  batalList: any[];
  highlight: Kajian | null;
}

const QUICK_PROMPTS = [
  "Jadwal hari ini",
  "Jadwal besok",
  "Kajian terdekat",
  "Materi sampai mana?",
  "Ada kajian batal?",
  "Nomor WA Admin",
];

function openWhatsApp(phone: string, text: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  Linking.openURL(url).catch(() => {});
}

function findMatchingAdmin(lokasi?: string) {
  if (!lokasi) return ADMIN_KAJIAN_CONTACTS[0];
  const lower = lokasi.toLowerCase();
  return (
    ADMIN_KAJIAN_CONTACTS.find(
      (c) =>
        lower.includes(c.lokasi.toLowerCase()) ||
        c.lokasi.toLowerCase().includes(lower) ||
        lower.split(" ").some((w) => w.length > 3 && c.lokasi.toLowerCase().includes(w))
    ) || ADMIN_KAJIAN_CONTACTS[0]
  );
}

export function MulazamahChatbotModal({
  visible,
  onClose,
  allKajianList,
  flyers,
  batalList,
  highlight,
}: MulazamahChatbotModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "bot",
      text:
        "Assalamu'alaikum! Saya Asisten Admin Mulazamahku.\n\n" +
        "Silakan tanya seputar jadwal kajian hari ini/besok, lokasi, kitab yang dibahas, catatan materi, kajian dibatalkan, ojek muslimah, atau langsung terhubung dengan nomor WA Admin.",
    },
  ]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [visible, messages.length]);

  const buildReply = async (rawQuery: string): Promise<ChatMessage> => {
    const q = rawQuery.trim().toLowerCase();
    const now = new Date();
    const todayStr = toDateStr(now);

    const checkBatalOnDate = (kajianId: string, dateStr: string) =>
      batalList.find((b) => b.kajian_id === kajianId && b.tanggal === dateStr);

    // 1. Tanya Nomor WA Admin / Kontak CP
    if (/\b(wa|whatsapp|admin|cp|kontak|hubungi|nomor|telp|telepon)\b/.test(q)) {
      const matchedKajian = allKajianList.find(
        (k) =>
          q.includes(k.judul.toLowerCase()) ||
          q.includes(k.lokasi.toLowerCase()) ||
          k.lokasi.toLowerCase().split(" ").some((w) => w.length > 3 && q.includes(w))
      );

      if (matchedKajian) {
        const cpPhone = matchedKajian.cp_telepon || findMatchingAdmin(matchedKajian.lokasi).phone;
        const cpName = matchedKajian.cp_nama || findMatchingAdmin(matchedKajian.lokasi).nama;
        return {
          id: `${Date.now()}-bot`,
          sender: "bot",
          text: `Kontak Admin untuk kajian ${matchedKajian.judul} (${matchedKajian.lokasi}):\n• ${cpName} (+${cpPhone})`,
          actions: [
            {
              label: `Chat WA ${cpName}`,
              type: "wa",
              phone: cpPhone,
              waText: `Assalamu'alaikum ${cpName}, saya ingin bertanya mengenai kajian ${matchedKajian.judul} di ${matchedKajian.lokasi}.`,
            },
          ],
        };
      }

      const listText = ADMIN_KAJIAN_CONTACTS.slice(0, 8)
        .map((c) => `• ${c.lokasi}: ${c.nama} (+${c.phone})`)
        .join("\n");
      return {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text:
          `Berikut daftar kontak Admin Kajian Mulazamahku:\n\n${listText}\n\n` +
          `Ketuk tombol di bawah untuk langsung chat via WhatsApp:`,
        actions: ADMIN_KAJIAN_CONTACTS.slice(0, 4).map((c) => ({
          label: `WA ${c.nama} (${c.lokasi.split(" ")[0]})`,
          type: "wa",
          phone: c.phone,
          waText: `Assalamu'alaikum ${c.nama}, saya ingin bertanya terkait kajian di ${c.lokasi}.`,
        })),
      };
    }

    // 2. Tanya Ojek Muslimah
    if (/\b(ojek|antar|jemput|kendaraan|transport)\b/.test(q)) {
      const drivers = OJEK_CONTACTS.map((d) => `• ${d.nama} (+${d.phone})`).join("\n");
      return {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text: `Layanan Ojek Muslimah Mulazamahku:\n\n${drivers}\n\nKlik tombol di bawah untuk langsung menghubungi via WhatsApp:`,
        actions: OJEK_CONTACTS.map((d) => ({
          label: `Pesan WA ${d.nama}`,
          type: "wa",
          phone: d.phone,
          waText: `Assalamu'alaikum ${d.nama}, saya ingin memesan layanan Ojek Muslimah untuk menuju lokasi kajian.`,
        })),
      };
    }

    // 3. Tanya Materi / Progress kajian terdekat
    if (/\b(materi|progress|progres|sampai mana|halaman|bab)\b/.test(q)) {
      if (!highlight) {
        return {
          id: `${Date.now()}-bot`,
          sender: "bot",
          text: "Belum ada data kajian terdekat saat ini.",
        };
      }
      const prog = await ProgressService.get(highlight.id);
      const tgl = prog.tanggal_kajian && parseDateStr(prog.tanggal_kajian);
      const cp = findMatchingAdmin(highlight.lokasi);
      return {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text:
          `Catatan Materi Kajian Terdekat:\n` +
          `• Kajian: ${highlight.judul}\n` +
          `• Jadwal: ${highlight.hari} (${highlight.waktu})\n` +
          (tgl ? `• Untuk tanggal: ${formatMasehi(tgl)}\n` : "") +
          `• Materi sampai: ${prog.progress?.trim() || "Belum ada catatan materi dari pengajar."}`,
        actions: [
          { label: "Buka Detail Kajian", type: "kajian", kajianId: highlight.id },
          {
            label: `Tanya Admin (${cp.nama})`,
            type: "wa",
            phone: highlight.cp_telepon || cp.phone,
            waText: `Assalamu'alaikum, izin bertanya tentang materi kajian ${highlight.judul}.`,
          },
        ],
      };
    }

    // 4. Tanya kajian dibatalkan / libur
    if (/\b(batal|dibatalkan|libur|cancel|tidak ada)\b/.test(q)) {
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const upcomingBatal = batalList.filter((b) => new Date(b.tanggal) >= todayMidnight);
      if (upcomingBatal.length === 0) {
        return {
          id: `${Date.now()}-bot`,
          sender: "bot",
          text: "Alhamdulillah, saat ini tidak ada jadwal kajian yang dibatalkan. Semua jadwal berjalan sesuai kalender.",
        };
      }
      const lines = upcomingBatal.map((b) => {
        const k = allKajianList.find((x) => x.id === b.kajian_id);
        const d = parseDateStr(b.tanggal);
        return `• ${k?.judul || b.kajian_id} (${d ? formatMasehi(d) : b.tanggal})\n  Alasan: ${b.alasan}`;
      });
      return {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text: `Daftar kajian yang dibatalkan:\n\n${lines.join("\n\n")}`,
      };
    }

    // 5. Tanya Kajian Terdekat
    if (/\b(terdekat|berikutnya|selanjutnya|next)\b/.test(q)) {
      if (!highlight) {
        return {
          id: `${Date.now()}-bot`,
          sender: "bot",
          text: "Belum ada kajian terdekat yang terjadwal.",
        };
      }
      const cp = findMatchingAdmin(highlight.lokasi);
      return {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text:
          `Kajian Terdekat:\n` +
          `• Judul: ${highlight.judul}\n` +
          `• Hari & Waktu: ${highlight.hari} · ${highlight.waktu}\n` +
          `• Lokasi: ${highlight.lokasi}\n` +
          `• Pengajar: ${highlight.ustadz}`,
        actions: [
          { label: "Buka Detail Kajian", type: "kajian", kajianId: highlight.id },
          {
            label: `WA Admin (${cp.nama})`,
            type: "wa",
            phone: highlight.cp_telepon || cp.phone,
            waText: `Assalamu'alaikum, saya ingin bertanya tentang kajian terdekat ${highlight.judul}.`,
          },
        ],
      };
    }

    // 6. Tanya Jadwal Hari Ini atau Besok
    if (/\b(hari ini|sekarang|today|besok|tomorrow)\b/.test(q)) {
      const isBesok = /\b(besok|tomorrow)\b/.test(q);
      const targetDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + (isBesok ? 1 : 0)
      );
      const targetStr = toDateStr(targetDate);
      const events = allKajianList.filter((k) => isKajianOnDate(k, targetDate, flyers));
      const labelHari = isBesok ? "Besok" : "Hari Ini";

      if (events.length === 0) {
        return {
          id: `${Date.now()}-bot`,
          sender: "bot",
          text:
            `Tidak ada jadwal kajian rutin pada ${labelHari.toLowerCase()} (${formatMasehi(targetDate)} / ${formatHijri(targetDate)}).\n` +
            `Pekan saat ini: Pekan ${Math.ceil(targetDate.getDate() / 7)}.`,
        };
      }

      const lines = events.map((k) => {
        const batal = checkBatalOnDate(k.id, targetStr);
        return (
          `• ${k.judul}\n` +
          `  Jam: ${k.waktu} | Lokasi: ${k.lokasi}` +
          (batal ? `\n  ⚠️ Dibatalkan: ${batal.alasan}` : "")
        );
      });

      return {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text:
          `Jadwal Kajian ${labelHari} (${formatMasehi(targetDate)} · Pekan ${Math.ceil(targetDate.getDate() / 7)}):\n\n` +
          lines.join("\n\n"),
        actions: events.slice(0, 2).map((k) => ({
          label: `Detail ${k.judul.slice(0, 18)}`,
          type: "kajian",
          kajianId: k.id,
        })),
      };
    }

    // 7. Tanya berdasarkan nama hari (Senin - Ahad / Minggu)
    const dayMap: Record<string, string> = {
      senin: "Senin",
      selasa: "Selasa",
      rabu: "Rabu",
      kamis: "Kamis",
      jumat: "Jumat",
      "jum'at": "Jumat",
      sabtu: "Sabtu",
      ahad: "Ahad",
      minggu: "Ahad",
    };
    const matchedDayKey = Object.keys(dayMap).find((d) => q.includes(d));
    if (matchedDayKey) {
      const dayName = dayMap[matchedDayKey];
      const matches = allKajianList.filter((k) =>
        k.hari.toLowerCase().includes(dayName.toLowerCase())
      );
      if (matches.length === 0) {
        return {
          id: `${Date.now()}-bot`,
          sender: "bot",
          text: `Belum ada jadwal kajian rutin di hari ${dayName}.`,
        };
      }
      const lines = matches.map(
        (k) => `• ${k.judul}\n  ${k.hari} · ${k.waktu}\n  Lokasi: ${k.lokasi}`
      );
      return {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text: `Jadwal Kajian Hari ${dayName}:\n\n${lines.join("\n\n")}`,
        actions: matches.slice(0, 2).map((k) => ({
          label: `Detail ${k.judul.slice(0, 18)}`,
          type: "kajian",
          kajianId: k.id,
        })),
      };
    }

    // 8. Tanya profil Pengajar / Ustadzah
    if (/\b(ustadzah|pengajar|rubeya|guru|pemateri)\b/.test(q)) {
      const p = PENGAJAR_PROFILES[0];
      return {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text:
          `Pengajar Kajian Mulazamahku:\n` +
          `• Ustadzah ${p.nama}, ${p.gelar}\n` +
          `• Domisili: ${p.alamat}\n` +
          `• Aktivitas: ${p.aktivitasSaatIni.slice(0, 2).join(", ")}`,
      };
    }

    // 9. Pencarian kata kunci pada judul / lokasi kajian
    const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
    const matchingKajian = allKajianList.filter((k) => {
      const hay = `${k.judul} ${k.lokasi} ${k.hari} ${k.deskripsi || ""}`.toLowerCase();
      return tokens.some((t) => hay.includes(t));
    });

    if (matchingKajian.length > 0) {
      const first = matchingKajian[0];
      const cp = findMatchingAdmin(first.lokasi);
      const list = matchingKajian
        .slice(0, 4)
        .map((k) => `• ${k.judul}\n  ${k.hari} · ${k.waktu}\n  Lokasi: ${k.lokasi}`)
        .join("\n\n");
      return {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text: `Saya menemukan kajian yang sesuai:\n\n${list}`,
        actions: [
          { label: `Buka ${first.judul.slice(0, 18)}`, type: "kajian", kajianId: first.id },
          {
            label: `WA Admin (${cp.nama})`,
            type: "wa",
            phone: first.cp_telepon || cp.phone,
            waText: `Assalamu'alaikum ${cp.nama}, saya ingin bertanya tentang kajian ${first.judul}: "${rawQuery}"`,
          },
        ],
      };
    }

    // 10. Fallback ramah + hubungkan langsung ke WA Admin
    const defaultAdmin = ADMIN_KAJIAN_CONTACTS[0];
    return {
      id: `${Date.now()}-bot`,
      sender: "bot",
      text:
        `Mohon maaf, saya belum menemukan jawaban spesifik untuk "${rawQuery}" di data jadwal.\n\n` +
        `Anda bisa bertanya tentang: jadwal hari ini/besok, nama hari (misal "jadwal Rabu"), nama kitab/lokasi, catatan materi, kajian batal, atau langsung chat Admin via WhatsApp di bawah ini:`,
      actions: [
        {
          label: `Tanya Admin via WA (${defaultAdmin.nama})`,
          type: "wa",
          phone: defaultAdmin.phone,
          waText: `Assalamu'alaikum, saya ingin bertanya: ${rawQuery}`,
        },
      ],
    };
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");

    const reply = await buildReply(query);
    setMessages((prev) => [...prev, reply]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.primary,
              paddingTop: insets.top + (Platform.OS === "web" ? 14 : 10),
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.botAvatar, { backgroundColor: "rgba(201,162,39,0.22)", borderColor: colors.gold }]}>
              <Feather name="message-square" size={18} color={colors.gold} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Asisten Mulazamahku</Text>
              <Text style={styles.headerSub}>Admin Kajian Otomatis · Terhubung WA</Text>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Quick Prompts */}
        <View style={[styles.quickBar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => handleSend(prompt)}
                style={({ pressed }) => [
                  styles.quickChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text style={[styles.quickChipText, { color: colors.accentText }]}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 24,
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
            gap: 12,
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  { justifyContent: isUser ? "flex-end" : "flex-start" },
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                      : {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderWidth: 1,
                          borderBottomLeftRadius: 4,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: isUser ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {msg.text}
                  </Text>

                  {msg.actions && msg.actions.length > 0 && (
                    <View style={styles.actionsWrap}>
                      {msg.actions.map((act, idx) => (
                        <Pressable
                          key={`${msg.id}-act-${idx}`}
                          onPress={() => {
                            if (act.type === "wa" && act.phone) {
                              openWhatsApp(act.phone, act.waText || "");
                            } else if (act.type === "kajian" && act.kajianId) {
                              onClose();
                              router.push(`/kajian/${act.kajianId}`);
                            }
                          }}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            act.type === "wa"
                              ? { backgroundColor: "#25D366" }
                              : { backgroundColor: colors.highlight, borderWidth: 1, borderColor: colors.border },
                            { opacity: pressed ? 0.8 : 1 },
                          ]}
                        >
                          {act.type === "wa" ? (
                            <FontAwesome name="whatsapp" size={14} color="#FFFFFF" />
                          ) : (
                            <Feather name="book-open" size={13} color={colors.accentText} />
                          )}
                          <Text
                            style={[
                              styles.actionBtnText,
                              { color: act.type === "wa" ? "#FFFFFF" : colors.accentText },
                            ]}
                          >
                            {act.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={styles.inputBarInner}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSend()}
              placeholder="Tanya jadwal, lokasi, materi, atau WA admin..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => handleSend()}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="send" size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#F5E6A3",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  quickBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  msgRow: {
    flexDirection: "row",
    width: "100%",
  },
  bubble: {
    maxWidth: "86%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleText: {
    fontSize: 13.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  actionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  inputBar: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  inputBarInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
