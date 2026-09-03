import React from 'react';
import type { Wallet } from '../../lib/db';

interface RealisticCardProps {
  wallet: Partial<Wallet>;
  spentThisMonth?: number;
  currencySymbol?: string;
  showBalance?: boolean;
  className?: string;
  onClick?: () => void;
}

// ── Realistic EMV Chip ──────────────────────────────────────────────
export function EmvChip({ className = 'w-11 h-8' }: { className?: string }) {
  return (
    <div
      className={`relative rounded-md p-0.5 shadow-md flex items-center justify-center overflow-hidden border border-[#967420] shrink-0 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #e6c875 0%, #d4af37 40%, #aa820a 70%, #f3e5ab 100%)',
      }}
    >
      {/* Precision etched circuit patterns */}
      <div className="w-full h-full border border-[#8a6818]/60 rounded-sm relative flex flex-col justify-between p-0.5">
        <div className="flex justify-between w-full h-[30%]">
          <div className="w-[35%] border-r border-b border-[#73540e]/60" />
          <div className="w-[35%] border-l border-b border-[#73540e]/60" />
        </div>
        <div className="w-full h-[25%] border-t border-b border-[#73540e]/60" />
        <div className="flex justify-between w-full h-[30%]">
          <div className="w-[35%] border-r border-t border-[#73540e]/60" />
          <div className="w-[35%] border-l border-t border-[#73540e]/60" />
        </div>
      </div>
      {/* Metallic specular sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
    </div>
  );
}

// ── Contactless Wave Icon ───────────────────────────────────────────
export function ContactlessWave({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 7.5C8.8 8.8 9.5 10.4 9.5 12C9.5 13.6 8.8 15.2 7.5 16.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 5C12.9 6.9 14 9.4 14 12C14 14.6 12.9 17.1 11 19" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14.5 2.5C17 5 18.5 8.3 18.5 12C18.5 15.7 17 19 14.5 21.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Bank Logos ──────────────────────────────────────────────────────
export function BankLogoBadge({ bank, tier, isDebit }: { bank?: string; tier?: string; isDebit?: boolean }) {
  if (bank === 'cib' || !bank) {
    return (
      <div className="flex items-center gap-1.5">
        {/* CIB stylized globe emblem */}
        <div className="flex items-center">
          <span className="font-black tracking-tighter text-lg font-sans flex items-center text-white">
            <span className="relative inline-flex items-center justify-center mr-0.5">
              <span className="text-xl font-black">C</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] absolute inset-0 m-auto flex items-center justify-center">
                <span className="w-1.5 h-1.5 border border-white/80 rounded-full" />
              </span>
            </span>
            <span>IB</span>
          </span>
          {isDebit && tier && tier !== 'standard' && (
            <span className="ml-1.5 pl-1.5 border-l border-white/40 text-xs tracking-wider uppercase font-semibold text-white/90">
              {tier}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (bank === 'nbe') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-md bg-[#05472A] border border-[#d4af37] flex items-center justify-center text-[#d4af37] font-serif font-black text-xs">
          NBE
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-bold text-white tracking-wide">National Bank of Egypt</p>
          <p className="text-[9px] text-amber-200/80 uppercase tracking-wider font-semibold">البنك الأهلي المصري</p>
        </div>
      </div>
    );
  }

  if (bank === 'banque-misr') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-md bg-[#7A1B28] border border-amber-300 flex items-center justify-center text-amber-300 font-bold text-xs">
          BM
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-bold text-white tracking-wide">Banque Misr</p>
          <p className="text-[9px] text-red-200/80 uppercase tracking-wider font-semibold">بنك مصر</p>
        </div>
      </div>
    );
  }

  if (bank === 'qnb') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-md bg-[#4B1124] border border-amber-400/60 flex items-center justify-center text-white font-extrabold text-xs">
          QNB
        </div>
        <span className="text-xs font-extrabold text-white tracking-wider">QNB ALAHLI</span>
      </div>
    );
  }

  if (bank === 'hsbc') {
    return (
      <div className="flex items-center gap-2">
        {/* HSBC Red and White Hexagon */}
        <div className="w-5 h-5 relative flex items-center justify-center">
          <div className="w-4 h-4 bg-red-600 rotate-45 flex items-center justify-center">
            <div className="w-2 h-2 bg-white" />
          </div>
        </div>
        <span className="text-xs font-black tracking-widest text-white">HSBC</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-extrabold tracking-widest uppercase text-white/90">
        {bank || 'PREMIUM BANK'}
      </span>
    </div>
  );
}

// ── Payment Network Logos ───────────────────────────────────────────
export function NetworkLogo({ network = 'mastercard' }: { network?: 'mastercard' | 'visa' | 'meeza' }) {
  if (network === 'visa') {
    return (
      <span className="font-black italic text-xl tracking-tighter text-white drop-shadow-md select-none font-sans">
        VISA
      </span>
    );
  }

  if (network === 'meeza') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/90 text-neutral-950 font-black text-[10px] tracking-wider select-none shadow-sm">
        <span className="text-[#0a7ea4]">M</span>EEZA ميزة
      </div>
    );
  }

  // Mastercard default
  return (
    <div className="flex items-center -space-x-2.5 relative select-none">
      <div className="w-7 h-7 rounded-full bg-[#EB001B] shadow-sm" />
      <div className="w-7 h-7 rounded-full bg-[#F79E1B]/90 shadow-sm mix-blend-screen" />
    </div>
  );
}

// ── Main Photorealistic Physical Card ───────────────────────────────
export function RealisticCard({
  wallet,
  spentThisMonth = 0,
  currencySymbol = 'EGP',
  showBalance = true,
  className = '',
  onClick
}: RealisticCardProps) {
  const isCredit = wallet.type === 'credit';
  const isDebit = wallet.type === 'checking' || wallet.type === 'savings' || !isCredit;
  const bank = wallet.bank || 'cib';
  const accountTier = wallet.accountTier || 'prime';
  const creditTier = wallet.creditTier || 'platinum';
  const network = wallet.network || 'mastercard';

  // Determine card visual theme
  const isCibPlatinum = bank === 'cib' && isCredit && creditTier === 'platinum';
  const isCibPrime = bank === 'cib' && isDebit && accountTier === 'prime';
  const isCibPlus = bank === 'cib' && isDebit && accountTier === 'plus';
  const isCibWealth = bank === 'cib' && isDebit && accountTier === 'wealth';
  const isCibPrivate = bank === 'cib' && isDebit && accountTier === 'private';

  // Tier Title display
  const tierTitle = isCredit
    ? creditTier.toUpperCase()
    : accountTier.toUpperCase();

  // Background styling & textures
  const getCardBackgroundStyle = (): React.CSSProperties => {
    // 1. CIB Platinum Credit Card (Real reference image or CSS celestial orbits)
    if (isCibPlatinum) {
      return {
        backgroundImage: 'url(/cards/cib_platinum_credit.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#0c0d0e'
      };
    }

    // 2. CIB Prime Debit Card (Real reference image or CSS segmented globe)
    if (isCibPrime) {
      return {
        backgroundImage: 'url(/cards/cib_prime_debit.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#35989e'
      };
    }

    // 3. CIB Plus Debit (Cobalt Blue Metallic with Silver accents)
    if (isCibPlus) {
      return {
        background: 'linear-gradient(135deg, #0d3268 0%, #154c9a 45%, #082147 100%)',
      };
    }

    // 4. CIB Wealth (Luxury Dark Slate with Champagne Gold)
    if (isCibWealth) {
      return {
        background: 'linear-gradient(135deg, #1f252d 0%, #14171c 60%, #0a0c0e 100%)',
      };
    }

    // 5. CIB Private (Pure Obsidian with Gold Trim)
    if (isCibPrivate) {
      return {
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 60%, #000000 100%)',
      };
    }

    // 6. Credit Tiers
    if (isCredit) {
      if (creditTier === 'gold') {
        return {
          background: 'linear-gradient(135deg, #d4af37 0%, #f3e5ab 35%, #aa7c11 70%, #684904 100%)',
        };
      }
      if (creditTier === 'titanium') {
        return {
          background: 'linear-gradient(135deg, #4a5568 0%, #718096 40%, #2d3748 75%, #1a202c 100%)',
        };
      }
      if (creditTier === 'world' || creditTier === 'world-elite') {
        return {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #020617 100%)',
        };
      }
    }

    // 7. Other Egyptian Banks
    if (bank === 'nbe') {
      return {
        background: 'linear-gradient(135deg, #05472a 0%, #0b6940 50%, #022314 100%)',
      };
    }
    if (bank === 'banque-misr') {
      return {
        background: 'linear-gradient(135deg, #7a1b28 0%, #9e2334 50%, #460f17 100%)',
      };
    }
    if (bank === 'qnb') {
      return {
        background: 'linear-gradient(135deg, #4b1124 0%, #6b1d36 50%, #1a060d 100%)',
      };
    }
    if (bank === 'hsbc') {
      return {
        background: 'linear-gradient(135deg, #1f1f1f 0%, #2e2e2e 50%, #121212 100%)',
      };
    }

    // Default fallback using wallet color
    const baseColor = wallet.color || '#0a7ea4';
    return {
      background: `linear-gradient(135deg, ${baseColor}ee 0%, ${baseColor}99 55%, #000000ee 100%)`
    };
  };

  const usePhotoOverlay = isCibPlatinum || isCibPrime;

  return (
    <div
      onClick={onClick}
      className={`relative w-full aspect-[1.586/1] rounded-[22px] p-5 md:p-6 overflow-hidden shadow-2xl transition-all duration-300 border border-white/15 select-none ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-cyan-500/10 active:scale-[0.99]' : ''
      } ${className}`}
      style={getCardBackgroundStyle()}
    >
      {/* Dynamic ambient gloss / physical sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent pointer-events-none" />

      {/* Decorative vector elements for non-photo cards */}
      {!usePhotoOverlay && (
        <>
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute right-6 top-6 w-24 h-24 rounded-full border border-white/5 pointer-events-none" />
        </>
      )}

      {/* ── CARD TOP ROW ───────────────────────────────────────── */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          {!usePhotoOverlay ? (
            <BankLogoBadge bank={bank} tier={tierTitle} isDebit={isDebit} />
          ) : (
            <div className="h-6" /> /* Spacing for photo card logo */
          )}
          <p className="text-[10px] font-mono tracking-wider text-white/70 mt-0.5">
            {wallet.institution || (bank === 'cib' ? 'CIB Egypt' : bank?.toUpperCase())}
          </p>
        </div>

        {/* Contactless Wave & Optional BONUS badge */}
        <div className="flex items-center gap-3">
          {isCredit && bank === 'cib' && !usePhotoOverlay && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-white tracking-widest bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
              <span>🎁 BONUS</span>
            </div>
          )}
          {!usePhotoOverlay && (
            <div className="text-white/80">
              <ContactlessWave size={18} color="currentColor" />
            </div>
          )}
        </div>
      </div>

      {/* ── CARD MIDDLE: EMV CHIP & CONTACTLESS ────────────────── */}
      <div className="my-auto pt-3 pb-1 flex items-center justify-between relative z-10">
        {!usePhotoOverlay ? (
          <div className="flex items-center gap-3">
            <EmvChip />
            <div className="text-white/70">
              <ContactlessWave size={18} color="currentColor" />
            </div>
          </div>
        ) : (
          <div className="h-8" /> /* Photo provides its own EMV chip */
        )}

        {/* Tier text for vector cards */}
        {!usePhotoOverlay && (
          <div className="text-right">
            <p className="text-[11px] font-mono font-black tracking-widest text-white/90 uppercase drop-shadow-sm">
              {isCredit ? `${creditTier} CREDIT` : `${accountTier} DEBIT`}
            </p>
          </div>
        )}
      </div>

      {/* ── CARD EMBOSSED NUMBER ───────────────────────────────── */}
      <div className="relative z-10 my-1">
        <p
          className="font-mono text-base md:text-lg tracking-[0.25em] text-white font-extrabold select-none"
          style={{
            textShadow: '0 1px 1px rgba(0,0,0,0.8), 0 -1px 1px rgba(255,255,255,0.4)',
            fontFamily: "'Courier New', Courier, monospace"
          }}
        >
          •••• •••• •••• {wallet.last4 || '8834'}
        </p>
      </div>

      {/* ── CARD BOTTOM ROW: HOLDER, EXPIRY & NETWORK ──────────── */}
      <div className="flex items-end justify-between relative z-10 pt-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-3">
            <span className="text-[9px] uppercase tracking-widest text-white/70 font-semibold">
              VALID THRU
            </span>
            <span
              className="text-xs font-mono font-bold text-white tracking-widest"
              style={{ textShadow: '0 1px 1px rgba(0,0,0,0.8)' }}
            >
              {wallet.expiryDate || '12/28'}
            </span>
          </div>
          <p
            className="text-xs font-mono font-extrabold tracking-widest text-white uppercase truncate max-w-[190px]"
            style={{
              textShadow: '0 1px 1px rgba(0,0,0,0.8), 0 -1px 1px rgba(255,255,255,0.3)',
              fontFamily: "'Courier New', Courier, monospace"
            }}
          >
            {wallet.cardholderName || wallet.name || 'PETER RYAD'}
          </p>
        </div>

        {/* Network Logo */}
        {!usePhotoOverlay ? (
          <div className="pb-0.5">
            <NetworkLogo network={network} />
          </div>
        ) : (
          <div className="w-10 h-6" /> /* Handled by photo */
        )}
      </div>

      {/* ── BALANCE & SPENT PILL OVERLAY (When inside App View) ─── */}
      {showBalance && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {spentThisMonth > 0 && (
            <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-right shadow-lg hidden sm:block">
              <p className="text-[8px] uppercase font-bold text-neutral-400 tracking-wider">SPENT</p>
              <p className="text-[11px] font-mono font-bold text-white/90">
                {currencySymbol} {spentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            </div>
          )}
          <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-right shadow-lg">
            <p className="text-[9px] uppercase font-bold text-neutral-300 tracking-wider">BALANCE</p>
            <p className="text-xs font-mono font-extrabold text-white">
              {currencySymbol} {(wallet.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
