import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { Category, Transaction, Wallet } from '../lib/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  categories: Category[];
  wallets: Wallet[];
  onSave: (tx: Transaction) => void;
  onDelete: (id: string, merchant: string) => void;
}

export const EditTransactionModal: React.FC<Props> = ({
  visible,
  onClose,
  transaction,
  categories,
  wallets,
  onSave,
  onDelete
}) => {
  const [amountStr, setAmountStr] = useState(transaction?.amount ? transaction.amount.toString() : '');
  const [merchant, setMerchant] = useState(transaction?.merchant || '');
  const [note, setNote] = useState(transaction?.note || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(transaction?.categoryId || categories[0]?.id || '');
  const [selectedWalletId, setSelectedWalletId] = useState(transaction?.walletId || wallets[0]?.id || '');
  const [type, setType] = useState<'expense' | 'income'>(transaction?.type || 'expense');

  const [prevTx, setPrevTx] = useState(transaction);
  if (transaction !== prevTx) {
    setPrevTx(transaction);
    if (transaction) {
      setAmountStr(transaction.amount ? transaction.amount.toString() : '');
      setMerchant(transaction.merchant || '');
      setNote(transaction.note || '');
      setSelectedCategoryId(transaction.categoryId || categories[0]?.id || '');
      setSelectedWalletId(transaction.walletId || wallets[0]?.id || '');
      setType(transaction.type);
    }
  }

  if (!transaction) return null;

  const handleSave = async () => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      ...transaction,
      amount: val,
      merchant: merchant.trim() || (type === 'income' ? 'Income Deposit' : 'Expense'),
      note: note.trim(),
      categoryId: selectedCategoryId,
      walletId: selectedWalletId,
      type
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(transaction.id, transaction.merchant || 'Expense');
    onClose();
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
              <Ionicons name="create-outline" size={22} color="#10b981" />
              <Text style={styles.title}>Edit Transaction • تعديل المعاملة</Text>
            </View>
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
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                  keyboardType="decimal-pad"
                  value={amountStr}
                  onChangeText={setAmountStr}
                  autoFocus={false}
                />
                <Text style={styles.currencySuffix}>EGP</Text>
              </View>
            </View>

            {/* Merchant / Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MERCHANT / PLACE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Carrefour, Starbucks, Shell..."
                placeholderTextColor="#64748b"
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>

            {/* Note */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOTE (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Add details or context..."
                placeholderTextColor="#64748b"
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {categories.map((c) => {
                  const isSelected = c.id === selectedCategoryId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCategoryId(c.id)}
                      style={[
                        styles.chip,
                        isSelected && { borderColor: c.color, backgroundColor: `${c.color}25` }
                      ]}
                    >
                      <Ionicons name={(c.iconName as any) || 'pricetag'} size={16} color={isSelected ? c.color : '#94a3b8'} />
                      <Text style={[styles.chipText, isSelected && { color: '#ffffff', fontWeight: '700' }]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Account / Wallet Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PAID WITH</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {wallets.map((w) => {
                  const isSelected = w.id === selectedWalletId;
                  const isCash = w.type === 'cash';
                  return (
                    <TouchableOpacity
                      key={w.id}
                      onPress={() => setSelectedWalletId(w.id)}
                      style={[
                        styles.chip,
                        isSelected && { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)' }
                      ]}
                    >
                      <Text style={styles.chipEmoji}>{isCash ? '💵' : '💳'}</Text>
                      <Text style={[styles.chipText, isSelected && { color: '#ffffff', fontWeight: '700' }]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!amountStr || parseFloat(amountStr) <= 0}
              style={[
                styles.saveBtn,
                (!amountStr || parseFloat(amountStr) <= 0) && styles.saveBtnDisabled
              ]}
            >
              <Ionicons name="checkmark-sharp" size={18} color="#000000" />
              <Text style={styles.saveBtnText}>Save</Text>
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
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 4
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
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
    marginBottom: 18
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  amountInput: {
    flex: 1,
    color: '#10b981',
    fontSize: 28,
    fontWeight: '800',
    paddingVertical: 12
  },
  currencySuffix: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '700'
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  chipsScroll: {
    flexDirection: 'row',
    paddingVertical: 4
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 6
  },
  chipEmoji: {
    fontSize: 14
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)'
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelBtnText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600'
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  saveBtnDisabled: {
    opacity: 0.4
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700'
  }
});
