import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Wallet } from '../lib/types';

interface Props {
  wallet: Wallet;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

export const RealisticCard: React.FC<Props> = ({ wallet }) => {
  const isCash = wallet.type === 'cash';

  if (isCash) {
    return (
      <View style={[styles.cardContainer, styles.cashCard]}>
        {/* Banknote Watermark / Border */}
        <View style={styles.cashBorder}>
          <View style={styles.topRow}>
            <View style={styles.badgeRow}>
              <Text style={styles.cashIcon}>💵</Text>
              <Text style={styles.cashTitle}>CASH WALLET • كاش</Text>
            </View>
            <Text style={styles.currencyBadge}>EGP • ج.م</Text>
          </View>

          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>AVAILABLE CASH</Text>
            <Text style={styles.cashBalanceValue}>
              {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <Text style={styles.currencySymbol}> EGP</Text>
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.cashSub}>DIRECT TENDER • نقد في المحفظة</Text>
            <View style={styles.cashRosette}>
              <Ionicons name="cash-outline" size={18} color="#34d399" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Credit / Debit Bank Card Style
  return (
    <View style={[styles.cardContainer, styles.bankCard]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.bankName}>{wallet.institution || 'EchoSpend Card'}</Text>
          <Text style={styles.cardType}>{wallet.type.toUpperCase()} CARD</Text>
        </View>
        <Ionicons name="wifi" size={20} color="#94a3b8" style={{ transform: [{ rotate: '90deg' }] }} />
      </View>

      {/* Chip */}
      <View style={styles.chipContainer}>
        <View style={styles.chipInner} />
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
        <Text style={styles.balanceValue}>
          {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          <Text style={styles.currencySymbol}> EGP</Text>
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.cardNumber}>•••• •••• •••• {wallet.lastFourDigits || '8842'}</Text>
        <Text style={styles.cardBrand}>{wallet.name}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    marginVertical: 10,
    alignSelf: 'center'
  },
  bankCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  cashCard: {
    backgroundColor: '#064e3b',
    borderWidth: 1.5,
    borderColor: '#059669',
    padding: 12
  },
  cashBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderRadius: 14,
    borderStyle: 'dashed',
    padding: 12,
    justifyContent: 'space-between'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cashIcon: {
    fontSize: 18,
    marginRight: 6
  },
  cashTitle: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1
  },
  currencyBadge: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(5, 150, 105, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  bankName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  cardType: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2
  },
  chipContainer: {
    width: 38,
    height: 28,
    backgroundColor: '#eab308',
    borderRadius: 6,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chipInner: {
    width: '100%',
    height: '100%',
    borderColor: '#ca8a04',
    borderWidth: 1,
    borderRadius: 3
  },
  balanceSection: {
    marginVertical: 4
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2
  },
  balanceValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800'
  },
  cashBalanceValue: {
    color: '#ecfdf5',
    fontSize: 26,
    fontWeight: '800'
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34d399'
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardNumber: {
    color: '#cbd5e1',
    fontSize: 13,
    fontFamily: 'Courier',
    letterSpacing: 1.5
  },
  cardBrand: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700'
  },
  cashSub: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '600'
  },
  cashRosette: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(5, 150, 105, 0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
