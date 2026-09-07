import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { Category, Wallet } from '../lib/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  data: {
    amount: number | null;
    merchant: string;
    categoryId: string;
    categoryName: string;
    walletId: string;
    type: 'expense' | 'income';
    transcript: string;
  } | null;
  categories: Category[];
  wallets: Wallet[];
  onConfirm: (tx: {
    amount: number;
    merchant: string;
    categoryId: string;
    walletId: string;
    type: 'expense' | 'income';
    note: string;
  }) => void;
}

export const VoiceConfirmModal: React.FC<Props> = ({
  visible,
  onClose,
  data,
  categories,
  wallets,
  onConfirm
}) => {
  const [amountStr, setAmountStr] = useState(data?.amount ? data.amount.toString() : '');
  const [merchant, setMerchant] = useState(data?.merchant || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(data?.categoryId || categories[0]?.id || '');
  const [selectedWalletId, setSelectedWalletId] = useState(data?.walletId || wallets[0]?.id || '');
  const [type, setType] = useState<'expense' | 'income'>(data?.type || 'expense');

  const [prevData, setPrevData] = useState(data);
  if (data !== prevData) {
    setPrevData(data);
    if (data) {
      setAmountStr(data.amount ? data.amount.toString() : '');
      setMerchant(data.merchant || '');
      setSelectedCategoryId(data.categoryId || categories[0]?.id || '');
      setSelectedWalletId(data.walletId || wallets[0]?.id || '');
      setType(data.type || 'expense');
    }
  }

  const handleSave = async () => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm({
      amount: val,
      merchant: merchant.trim() || 'General Expense',
      categoryId: selectedCategoryId,
      walletId: selectedWalletId,
      type,
      note: data?.transcript || ''
    });
    onClose();
  };

  if (!data) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.title}>Confirm Expense • تأكيد المعاملة</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Transcript Note */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>Spoken Transcript:</Text>
            <Text style={styles.transcriptText}>"{data.transcript}"</Text>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>AMOUNT (EGP)</Text>
              <View style={styles.amountInputRow}>
                <TextInput
                  style={styles.amountInput}
                  value={amountStr}
                  onChangeText={setAmountStr}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                />
                <Text style={styles.currencySuffix}>EGP</Text>
              </View>
            </View>

            {/* Merchant Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MERCHANT / DESCRIPTION</Text>
              <TextInput
                style={styles.textInput}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="e.g. Carrefour, Starbucks, Mobil"
                placeholderTextColor="#475569"
              />
            </View>

            {/* Wallet Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ACCOUNT / WALLET</Text>
              <View style={styles.chipsRow}>
                {wallets.map((w) => {
                  const isSelected = w.id === selectedWalletId;
                  const isCash = w.type === 'cash';
                  return (
                    <TouchableOpacity
                      key={w.id}
                      onPress={() => setSelectedWalletId(w.id)}
                      style={[
                        styles.walletChip,
                        isSelected && (isCash ? styles.cashChipSelected : styles.chipSelected)
                      ]}
                    >
                      <Text style={styles.chipIcon}>{isCash ? '💵' : '💳'}</Text>
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected
                        ]}
                      >
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CATEGORY</Text>
              <View style={styles.chipsRow}>
                {categories.map((c) => {
                  const isSelected = c.id === selectedCategoryId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCategoryId(c.id)}
                      style={[
                        styles.categoryChip,
                        isSelected && { borderColor: c.color, backgroundColor: `${c.color}20` }
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && { color: c.color, fontWeight: '700' }
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save Expense • حفظ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    color: '#f8fafc',
    fontSize: 17,
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
  transcriptBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 14
  },
  transcriptLabel: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  transcriptText: {
    color: '#e2e8f0',
    fontSize: 13,
    marginTop: 2,
    fontStyle: 'italic'
  },
  scrollArea: {
    marginBottom: 14
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  amountInput: {
    flex: 1,
    height: 48,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800'
  },
  currencySuffix: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '700'
  },
  textInput: {
    height: 44,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  chipSelected: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.18)'
  },
  cashChipSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)'
  },
  chipIcon: {
    fontSize: 13,
    marginRight: 6
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '700'
  },
  categoryChip: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  categoryChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600'
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});
