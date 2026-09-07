import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { Category, Transaction, Wallet } from './src/lib/types';
import { initStorage, saveTransaction, updateTransaction, deleteTransaction } from './src/lib/storage';
import { RealisticCard } from './src/components/RealisticCard';
import { VoiceRecordModal } from './src/components/VoiceRecordModal';
import { VoiceConfirmModal } from './src/components/VoiceConfirmModal';
import { ManualTransactionModal } from './src/components/ManualTransactionModal';
import { EditTransactionModal } from './src/components/EditTransactionModal';

export default function App() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(25000);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isVoiceRecordOpen, setIsVoiceRecordOpen] = useState(false);
  const [isManualTxOpen, setIsManualTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [pendingParsedData, setPendingParsedData] = useState<{
    amount: number | null;
    merchant: string;
    categoryId: string;
    categoryName: string;
    walletId: string;
    type: 'expense' | 'income';
    transcript: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    const data = await initStorage();
    setWallets(data.wallets);
    setCategories(data.categories);
    setTransactions(data.transactions);
    setMonthlyBudget(data.monthlyBudget);
  }, []);

  useEffect(() => {
    let active = true;
    initStorage().then((data) => {
      if (active) {
        setWallets(data.wallets);
        setCategories(data.categories);
        setTransactions(data.transactions);
        setMonthlyBudget(data.monthlyBudget);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const activeWallet = wallets[activeWalletIndex] || wallets[0];

  // Budget calculations: strictly current month & year
  const now = new Date();
  const currentMonthExpenses = transactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const budgetProgress = monthlyBudget > 0 ? Math.min(currentMonthExpenses / monthlyBudget, 1) : 0;

  // Handle Voice Parse Result
  const handleVoiceParsed = (parsed: {
    amount: number | null;
    merchant: string;
    categoryId: string;
    categoryName: string;
    walletId: string;
    type: 'expense' | 'income';
    transcript: string;
  }) => {
    setPendingParsedData(parsed);
  };

  // Confirm and save transaction
  const handleConfirmTransaction = async (txData: {
    amount: number;
    merchant: string;
    categoryId: string;
    walletId: string;
    type: 'expense' | 'income';
    note?: string;
  }) => {
    await saveTransaction({
      ...txData,
      currency: 'EGP'
    });
    await loadData();
  };

  // Update existing transaction
  const handleSaveEditTx = async (tx: Transaction) => {
    await updateTransaction(tx);
    await loadData();
  };

  // Delete transaction
  const handleDeleteTx = (txId: string, merchant: string) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${merchant}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deleteTransaction(txId);
            await loadData();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="sparkles" size={16} color="#10b981" />
          </View>
          <Text style={styles.brandTitle}>EchoSpend</Text>
          <View style={styles.offlinePill}>
            <Ionicons name="cloud-offline" size={12} color="#10b981" />
            <Text style={styles.offlinePillText}>Local Engine</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsManualTxOpen(true)}
          style={styles.headerAddBtn}
        >
          <Ionicons name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.mainScrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Switcher Tabs */}
        <View style={styles.walletTabsRow}>
          {wallets.map((w, index) => {
            const isSelected = index === activeWalletIndex;
            const isCash = w.type === 'cash';
            return (
              <TouchableOpacity
                key={w.id}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setActiveWalletIndex(index);
                }}
                style={[
                  styles.walletTabBtn,
                  isSelected && (isCash ? styles.cashTabActive : styles.walletTabActive)
                ]}
              >
                <Text style={styles.tabIcon}>{isCash ? '💵' : '💳'}</Text>
                <Text
                  style={[
                    styles.walletTabText,
                    isSelected && styles.walletTabTextActive
                  ]}
                >
                  {w.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Realistic Interactive Card */}
        {activeWallet && <RealisticCard wallet={activeWallet} />}

        {/* Monthly Budget Meter */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetTop}>
            <View>
              <Text style={styles.budgetLabel}>MONTHLY BUDGET PROGRESS</Text>
              <Text style={styles.budgetSpent}>
                {currentMonthExpenses.toLocaleString()}
                <Text style={styles.budgetLimit}> / {monthlyBudget.toLocaleString()} EGP</Text>
              </Text>
            </View>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>
                {Math.round(budgetProgress * 100)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(budgetProgress * 100, 100)}%` },
                budgetProgress > 0.85 && { backgroundColor: '#ef4444' }
              ]}
            />
          </View>
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.txSectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions • المعاملات</Text>
          <Text style={styles.txCount}>{transactions.length} items</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={44} color="#334155" />
            <Text style={styles.emptyText}>No expenses recorded yet</Text>
            <Text style={styles.emptySubText}>
              Tap the green microphone button below to log your first voice expense offline!
            </Text>
          </View>
        ) : (
          transactions.slice(0, 20).map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const isIncome = tx.type === 'income';
            const w = wallets.find((item) => item.id === tx.walletId);
            const isCash = w?.type === 'cash';

            return (
              <TouchableOpacity
                key={tx.id}
                onPress={() => setEditingTx(tx)}
                onLongPress={() => handleDeleteTx(tx.id, tx.merchant || 'Expense')}
                activeOpacity={0.7}
                style={styles.txItem}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: cat?.color ? `${cat.color}20` : '#1e293b' }]}>
                  <Ionicons
                    name={(cat?.iconName as any) || 'pricetag'}
                    size={20}
                    color={cat?.color || '#94a3b8'}
                  />
                </View>

                <View style={styles.txInfo}>
                  <Text style={styles.txMerchant} numberOfLines={1}>
                    {tx.merchant || 'Expense'}
                  </Text>
                  <View style={styles.txMetaRow}>
                    <Text style={styles.txCategory}>{cat?.name || 'General'}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.txWalletHint}>
                      {isCash ? '💵 Cash' : `💳 ${w?.name || 'Card'}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.txAmountWrap}>
                  <Text style={[styles.txAmount, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
                    {isIncome ? '+' : '-'}{tx.amount.toLocaleString()}
                    <Text style={styles.txCurrency}> EGP</Text>
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Bottom Voice Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => setIsManualTxOpen(true)}
          style={styles.bottomSecondaryBtn}
        >
          <Ionicons name="create-outline" size={22} color="#cbd5e1" />
        </TouchableOpacity>

        {/* Main Pulsating Voice Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setIsVoiceRecordOpen(true)}
          style={styles.mainVoiceBtn}
        >
          <Ionicons name="mic" size={32} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await Haptics.selectionAsync();
            setActiveWalletIndex((prev) => (wallets.length > 0 ? (prev + 1) % wallets.length : 0));
          }}
          style={styles.bottomSecondaryBtn}
        >
          <Ionicons name="wallet-outline" size={22} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      {/* Voice Recording Modal */}
      <VoiceRecordModal
        visible={isVoiceRecordOpen}
        onClose={() => setIsVoiceRecordOpen(false)}
        categories={categories}
        wallets={wallets}
        defaultWalletId={activeWallet?.id || 'wallet-main'}
        onParsed={handleVoiceParsed}
      />

      {/* Confirmation Modal */}
      <VoiceConfirmModal
        visible={!!pendingParsedData}
        onClose={() => setPendingParsedData(null)}
        data={pendingParsedData}
        categories={categories}
        wallets={wallets}
        onConfirm={handleConfirmTransaction}
      />

      {/* Manual Entry Modal */}
      <ManualTransactionModal
        visible={isManualTxOpen}
        onClose={() => setIsManualTxOpen(false)}
        categories={categories}
        wallets={wallets}
        defaultWalletId={activeWallet?.id || 'wallet-main'}
        onSave={handleConfirmTransaction}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        visible={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        categories={categories}
        wallets={wallets}
        onSave={handleSaveEditTx}
        onDelete={handleDeleteTx}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: StatusBar.currentHeight || 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)'
  },
  offlinePillText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  mainScrollView: {
    flex: 1
  },
  walletTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 8
  },
  walletTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  walletTabActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)'
  },
  cashTabActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)'
  },
  tabIcon: {
    fontSize: 13,
    marginRight: 6
  },
  walletTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },
  walletTabTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  budgetCard: {
    backgroundColor: '#141416',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  budgetLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1
  },
  budgetSpent: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2
  },
  budgetLimit: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  },
  percentageBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  percentageText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '800'
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4
  },
  txSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700'
  },
  txCount: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 30
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12
  },
  emptySubText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131315',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)'
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  txInfo: {
    flex: 1
  },
  txMerchant: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  txCategory: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500'
  },
  dotSeparator: {
    color: '#475569',
    marginHorizontal: 6,
    fontSize: 10
  },
  txWalletHint: {
    color: '#64748b',
    fontSize: 11
  },
  txAmountWrap: {
    alignItems: 'flex-end'
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800'
  },
  expenseAmount: {
    color: '#f8fafc'
  },
  incomeAmount: {
    color: '#10b981'
  },
  txCurrency: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  txDate: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2
  },
  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(20, 20, 22, 0.95)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12
  },
  bottomSecondaryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mainVoiceBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10
  }
});
