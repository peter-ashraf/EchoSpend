import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { parseExpense } from '../lib/parser';
import type { Category, Wallet } from '../lib/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  wallets: Wallet[];
  defaultWalletId: string;
  onParsed: (data: {
    amount: number | null;
    merchant: string;
    categoryId: string;
    categoryName: string;
    walletId: string;
    type: 'expense' | 'income';
    transcript: string;
  }) => void;
}

export const VoiceRecordModal: React.FC<Props> = ({
  visible,
  onClose,
  categories,
  wallets,
  defaultWalletId,
  onParsed
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcriptText, setTranscriptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 650,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Request audio recording permissions
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setErrorMessage('Microphone access is required for voice input.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Failed to start recording:', err);
      setErrorMessage(err?.message || 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (timerRef.current) clearInterval(timerRef.current);

      setIsRecording(false);
      setIsProcessing(true);

      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;

      // Provide clear guidance for offline voice dictation via keyboard mic
      setErrorMessage('Audio captured. Use the keyboard microphone 🎙️ below to transcribe speech offline.');
      setIsProcessing(false);
    } catch (err: any) {
      console.warn('Failed to stop recording:', err);
      setIsProcessing(false);
    }
  };

  const handleProcessText = async (textToParse: string) => {
    const raw = textToParse.trim();
    if (!raw) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProcessing(true);

    // Run our local parsing engine
    const parsed = parseExpense(raw, categories, wallets, defaultWalletId);

    setIsProcessing(false);
    setTranscriptText('');
    onClose();

    onParsed({
      ...parsed,
      transcript: raw
    });
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="mic-circle" size={24} color="#10b981" />
              <Text style={styles.title}>Voice Input • تسجيل صوتي</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Speak in Egyptian Arabic or English (e.g., "صرفت ميتين جنيه في كارفور", "بنزين 350", "paid 85 at Starbucks")
          </Text>

          {/* Pulsating Record Button */}
          <View style={styles.micSection}>
            <Animated.View
              style={[
                styles.micPulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: isRecording ? 0.4 : 0
                }
              ]}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={isRecording ? stopRecording : startRecording}
              style={[styles.micButton, isRecording && styles.micButtonRecording]}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={36}
                color={isRecording ? '#ef4444' : '#ffffff'}
              />
            </TouchableOpacity>

            <Text style={styles.timerText}>
              {isRecording ? formatTimer(recordingDuration) : 'Tap microphone to speak'}
            </Text>
          </View>

          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {/* Quick Voice / Text Dictation Bar (uses iPhone keyboard's native mic) */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Quick Dictation or Type (Tap keyboard mic 🎙️ for instant offline speech)
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="تكلم أو اكتب هنا... (مثال: قهوة 50 جنيه في ستاربكس)"
                placeholderTextColor="#64748b"
                value={transcriptText}
                onChangeText={setTranscriptText}
                onSubmitEditing={() => handleProcessText(transcriptText)}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => handleProcessText(transcriptText)}
                disabled={!transcriptText.trim() || isProcessing}
                style={[
                  styles.parseBtn,
                  !transcriptText.trim() && styles.parseBtnDisabled
                ]}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Pre-filled Examples */}
          <View style={styles.examplesRow}>
            <TouchableOpacity
              onPress={() => handleProcessText('صرفت ميتين وخمسين جنيه في كارفور كاش')}
              style={styles.exampleChip}
            >
              <Text style={styles.exampleText}>🛒 كارفور ٢٥٠ كاش</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleProcessText('بنزين موبيل بـ 350 جنيه')}
              style={styles.exampleChip}
            >
              <Text style={styles.exampleText}>⛽ بنزين موبيل ٣٥٠</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleProcessText('ستاربكس قهوة بـ 85 LE')}
              style={styles.exampleChip}
            >
              <Text style={styles.exampleText}>☕ Starbucks 85</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18
  },
  micSection: {
    alignItems: 'center',
    marginVertical: 24
  },
  micPulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#10b981'
  },
  micButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  micButtonRecording: {
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#ef4444'
  },
  timerText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8
  },
  inputSection: {
    marginTop: 6
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12
  },
  textInput: {
    flex: 1,
    height: 48,
    color: '#ffffff',
    fontSize: 14
  },
  parseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  parseBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    marginBottom: 10
  },
  exampleChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  exampleText: {
    color: '#cbd5e1',
    fontSize: 11
  }
});
