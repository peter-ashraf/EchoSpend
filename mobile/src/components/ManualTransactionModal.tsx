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
  categories: Category[];
  wallets: Wallet[];
  defaultWalletId: string;
  onSave: (tx: {
    amount: number;
    merchant: string;
    categoryId: string;
    walletId: string;
    type: 'expense' | 'income';
    note?: string;
  }) => void;
}

export const ManualTransactionModal: React.FC<Props> = ({
  visible,
  onClose,
  categories,
  wallets,
  defaultWalletId,
  onSave
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [selectedWalletId, setSelectedWalletId] = useState(defaultWalletId || wallets[0]?.id || '');
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const handleSave = async () => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      amount: val,
      merchant: merchant.trim() || (type === 'income' ? 'Income Deposit' : 'Expense'),
      categoryId: selectedCategoryId,
      walletId: selectedWalletId,
      type
    });
    setAmountStr('');
    setMerchant('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Transaction • معاملة جديدة</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Type Segment (Expense vs Income) */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              onPress={() => setType('expense')}
              style={[styles.segmentBtn, type === 'expense' && styles.segmentBtnActiveExpense]}
            >
              <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>
                Expense • مصروف
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType('income')}
              style={[styles.segmentBtn, type === 'income' && styles.segmentBtnActiveIncome]}
            >
              <Text style={[styles.segmentText, type === 'income' && styles.segmentTextActive]}>
                Income • دخل
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>AMOUNT (EGP)</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={styles.amountInput}
                  value={amountStr}
                  onChangeText={setAmountStr}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                  autoFocus
                />
                <Text style={styles.currencySuffix}>EGP</Text>
              </View>
            </View>

            {/* Merchant / Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DESCRIPTION / MERCHANT</Text>
              <TextInput
                style={styles.textInput}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="e.g. Groceries, Carrefour, Salary"
                placeholderTextColor="#475569"
              />
            </View>

            {/* Wallet Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>WALLET</Text>
              <View style={styles.chipsRow}>
                {wallets.map((w) => {
                  const isSelected = w.id === selectedWalletId;
                  const isCash = w.type === 'cash';
                  return (
                    <TouchableOpacity
                      key={w.id}
                      onPress={() => setSelectedWalletId(w.id)}
                      style={[
                        styles.chip,
                        isSelected && (isCash ? styles.cashChipSelected : styles.chipSelected)
                      ]}
                    >
                      <Text style={styles.chipIcon}>{isCash ? '💵' : '💳'}</Text>
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
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
                {categories
                  .filter((c) => (type === 'income' ? c.type === 'income' : c.type === 'expense'))
                  .map((c) => {
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

          {/* Submit */}
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save Transaction • حفظ</Text>
          </TouchableOpacity>
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
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  segmentBtnActiveExpense: {
    backgroundColor: '#ef4444'
  },
  segmentBtnActiveIncome: {
    backgroundColor: '#10b981'
  },
  segmentText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '700'
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
  amountRow: {
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
  chip: {
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
  saveBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  }
});
