import type { Wallet } from '../../lib/db';
import { CibLogo, NbeLogo, BanqueMisrLogo, QnbLogo, HsbcLogo, AlexbankLogo, AaibLogo, EnbdLogo } from './BankLogos';
import { useStore } from '../../store/useStore';
import { formatAmount } from '../../lib/formatters';
import { Money, Coins, Wallet as WalletIcon } from '@phosphor-icons/react';

export interface RealisticCardProps {
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
        background: 'linear-gradient(135deg, #f0d27d 0%, #d4af37 40%, #aa820a 70%, #f7e8b0 100%)',
      }}
    >
      <div className="w-full h-full border border-[#7a5c12]/70 rounded-sm relative flex flex-col justify-between p-0.5">
        <div className="flex justify-between w-full h-[30%]">
          <div className="w-[35%] border-r border-b border-[#664b0a]/70" />
          <div className="w-[35%] border-l border-b border-[#664b0a]/70" />
        </div>
        <div className="w-full h-[25%] border-t border-b border-[#664b0a]/70" />
        <div className="flex justify-between w-full h-[30%]">
          <div className="w-[35%] border-r border-t border-[#664b0a]/70" />
          <div className="w-[35%] border-l border-t border-[#664b0a]/70" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
    </div>
  );
}

// ── Contactless Wave Icon ───────────────────────────────────────────
export function ContactlessWave({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 8C8.2 9.2 8.8 10.6 8.8 12C8.8 13.4 8.2 14.8 7 16" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10.5 5.5C12.3 7.3 13.2 9.5 13.2 12C13.2 14.5 12.3 16.7 10.5 18.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 3C16.5 5.5 17.8 8.5 17.8 12C17.8 15.5 16.5 18.5 14 21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ── CIB BONUS Badge ─────────────────────────────────────────────────
export function CibBonusBadge() {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="w-5 h-5 relative flex items-center justify-center">
        <div className="w-4 h-3.5 bg-white rounded-sm relative shadow-sm">
          <div className="w-1 h-full bg-[#f97316] mx-auto" />
          <div className="w-full h-1 bg-[#f97316] absolute inset-y-0 my-auto" />
        </div>
      </div>
      <span className="font-sans font-black text-xs tracking-wider text-white">BONUS</span>
    </div>
  );
}

// ── Payment Network Logos ───────────────────────────────────────────
export function NetworkLogo({ network = 'mastercard' }: { network?: 'mastercard' | 'visa' | 'meeza' }) {
  if (network === 'visa') {
    return (
      <span className="font-black italic text-xl tracking-tighter text-white drop-shadow select-none font-sans">
        VISA
      </span>
    );
  }

  if (network === 'meeza') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/95 text-neutral-950 font-black text-[10px] tracking-wider select-none shadow">
        <span className="text-[#0a7ea4]">M</span>EEZA ميزة
      </div>
    );
  }

  // Mastercard
  return (
    <div className="flex items-center -space-x-2.5 relative select-none">
      <div className="w-7 h-7 rounded-full bg-[#EB001B] shadow-sm" />
      <div className="w-7 h-7 rounded-full bg-[#F79E1B]/95 shadow-sm mix-blend-screen" />
    </div>
  );
}

// ====================================================================
// 1. CIB VECTOR BACKGROUNDS
// ====================================================================
function CibPlatinumVectorArt() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <rect width="400" height="252" fill="#0b0c0e" />
      <g stroke="#b8943f" opacity="0.35" strokeWidth="1.2">
        <ellipse cx="370" cy="126" rx="90" ry="115" />
        <ellipse cx="370" cy="126" rx="140" ry="160" strokeDasharray="4 4" />
        <ellipse cx="370" cy="126" rx="190" ry="210" />
        <ellipse cx="370" cy="126" rx="240" ry="260" strokeDasharray="8 6" />
      </g>
      <circle cx="280" cy="90" r="3" fill="#b8943f" opacity="0.6" />
      <circle cx="230" cy="150" r="2.5" fill="#b8943f" opacity="0.5" />
      <circle cx="180" cy="110" r="3.5" fill="#b8943f" opacity="0.4" />
    </svg>
  );
}

function CibGoldVectorArt() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="cibGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b88a1d" />
          <stop offset="50%" stopColor="#e6c555" />
          <stop offset="100%" stopColor="#8c670d" />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#cibGoldGrad)" />
      <g stroke="#5e4407" opacity="0.4" strokeWidth="1.2">
        <ellipse cx="370" cy="126" rx="90" ry="115" />
        <ellipse cx="370" cy="126" rx="140" ry="160" strokeDasharray="4 4" />
      </g>
      <path d="M 0 0 L 140 0 L 50 252 L 0 252 Z" fill="#ffffff" opacity="0.12" />
    </svg>
  );
}

function CibTitaniumVectorArt() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="cibTitaniumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#242b35" />
          <stop offset="50%" stopColor="#3e4756" />
          <stop offset="100%" stopColor="#161a22" />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#cibTitaniumGrad)" />
      <g stroke="#94a3b8" opacity="0.35" strokeWidth="1.2">
        <ellipse cx="370" cy="126" rx="100" ry="120" />
        <ellipse cx="370" cy="126" rx="160" ry="180" strokeDasharray="4 4" />
      </g>
      <path d="M 0 0 L 150 0 L 60 252 L 0 252 Z" fill="#ffffff" opacity="0.06" />
    </svg>
  );
}

function CibWorldVectorArt() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <rect width="400" height="252" fill="#07080a" />
      <g stroke="#d4af37" opacity="0.3" strokeWidth="1">
        <rect x="250" y="26" width="100" height="100" transform="rotate(45 300 76)" fill="none" />
        <circle cx="300" cy="76" r="80" stroke="#f3e5ab" opacity="0.25" />
      </g>
    </svg>
  );
}

function CibClassicCreditVectorArt() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="cibClassicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#061a38" />
          <stop offset="60%" stopColor="#0c2b5c" />
          <stop offset="100%" stopColor="#041026" />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#cibClassicGrad)" />
      <g stroke="#94a3b8" opacity="0.3" strokeWidth="1.2">
        <ellipse cx="370" cy="126" rx="100" ry="120" />
      </g>
    </svg>
  );
}

function CibPrimeVectorArt() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <rect width="400" height="252" fill="#1e8a90" />
      <g transform="translate(195, 126)" opacity="0.85">
        <path d="M -10 -10 L -60 -10 A 60 60 0 0 1 -10 -60 Z" fill="#0284c7" />
        <path d="M 10 -10 L 60 -10 A 60 60 0 0 0 10 -60 Z" fill="#84cc16" opacity="0.9" />
        <path d="M -10 10 L -60 10 A 60 60 0 0 0 -10 60 Z" fill="#0369a1" />
        <path d="M 10 10 L 60 10 A 60 60 0 0 1 10 60 Z" fill="#06b6d4" />
      </g>
    </svg>
  );
}

function CibPlusVectorArt() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="cibPlusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c326d" />
          <stop offset="50%" stopColor="#154c9e" />
          <stop offset="100%" stopColor="#082046" />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#cibPlusGrad)" />
      <g transform="translate(200, 126)" opacity="0.75">
        <circle cx="0" cy="0" r="62" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M -8 -8 L -54 -8 A 54 54 0 0 1 -8 -54 Z" fill="#3b82f6" />
        <path d="M 8 -8 L 54 -8 A 54 54 0 0 0 8 -54 Z" fill="#93c5fd" opacity="0.85" />
      </g>
    </svg>
  );
}

function CibWealthVectorArt() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="wealthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14171c" />
          <stop offset="60%" stopColor="#222832" />
          <stop offset="100%" stopColor="#0d0f12" />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#wealthGrad)" />
      <g transform="translate(210, 126)" opacity="0.4">
        <path d="M -6 -6 L -40 -6 A 40 40 0 0 1 -6 -40 Z" fill="#d4af37" />
        <path d="M 6 -6 L 40 -6 A 40 40 0 0 0 6 -40 Z" fill="#f3e5ab" />
      </g>
    </svg>
  );
}

function CibPrivateVectorArt() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <rect width="400" height="252" fill="#08090b" />
      <g stroke="#e2e8f0" opacity="0.15" strokeWidth="1">
        <rect x="230" y="26" width="100" height="100" transform="rotate(45 280 76)" fill="none" />
      </g>
    </svg>
  );
}

// ====================================================================
// 2. NBE VECTOR BACKGROUNDS (National Bank of Egypt)
// ====================================================================
function NbeVectorArt({ tier = 'platinum' }: { tier?: string }) {
  const t = tier.toLowerCase();
  const isGold = t === 'gold';
  const isTitanium = t === 'titanium' || t === 'plus';
  const isPlatinum = t === 'platinum' || t === 'wealth';
  const isWorld = t === 'world' || t === 'world-elite' || t === 'world_elite' || t === 'private';

  const stop1 = isGold ? '#b88a1d' : isWorld ? '#06120b' : isPlatinum ? '#011e11' : isTitanium ? '#022b19' : '#033a22';
  const stop2 = isGold ? '#034728' : isWorld ? '#0d2116' : isPlatinum ? '#043620' : isTitanium ? '#0a472c' : '#044e2e';
  const stop3 = isGold ? '#8c670d' : isWorld ? '#020704' : isPlatinum ? '#010f08' : isTitanium ? '#01170c' : '#022113';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="nbeBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stop1} />
          <stop offset="50%" stopColor={stop2} />
          <stop offset="100%" stopColor={stop3} />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#nbeBg)" />

      {/* Islamic Octagon Star & Arabesque Geometry */}
      <g stroke="#d4af37" opacity={isWorld || isPlatinum ? '0.35' : '0.25'} strokeWidth="1.2">
        <rect x="160" y="86" width="80" height="80" transform="rotate(45 200 126)" />
        <rect x="160" y="86" width="80" height="80" />
        <circle cx="200" cy="126" r="55" />
        <circle cx="200" cy="126" r="75" strokeDasharray="4 4" />
      </g>

      <path d="M 330 0 L 400 0 L 400 252 L 350 252 Z" fill="#d4af37" opacity="0.08" />
    </svg>
  );
}

// ====================================================================
// 3. BANQUE MISR VECTOR BACKGROUNDS
// ====================================================================
function BanqueMisrVectorArt({ tier = 'platinum' }: { tier?: string }) {
  const t = tier.toLowerCase();
  const isGold = t === 'gold';
  const isTitanium = t === 'titanium' || t === 'plus';
  const isPlatinum = t === 'platinum' || t === 'wealth';
  const isWorld = t === 'world' || t === 'world-elite' || t === 'world_elite' || t === 'private';

  const stop1 = isGold ? '#b88a1d' : isWorld ? '#1a0408' : isPlatinum ? '#420912' : isTitanium ? '#540c17' : '#6d1320';
  const stop2 = isGold ? '#6d1320' : isWorld ? '#380911' : isPlatinum ? '#540d17' : isTitanium ? '#751423' : '#871a29';
  const stop3 = isGold ? '#8c670d' : isWorld ? '#0d0204' : isPlatinum ? '#240409' : isTitanium ? '#2d1b20' : '#3b0810';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="bmBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stop1} />
          <stop offset="60%" stopColor={stop2} />
          <stop offset="100%" stopColor={stop3} />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#bmBg)" />

      {/* Geometric Arches & Pyramid Watermark */}
      <g stroke="#f59e0b" opacity="0.22" strokeWidth="1.4">
        <circle cx="220" cy="126" r="60" />
        <path d="M 170 186 C 170 140 270 140 270 186" />
        <ellipse cx="220" cy="126" rx="90" ry="120" strokeDasharray="6 4" />
      </g>
    </svg>
  );
}

// ====================================================================
// 4. QNB ALAHLI VECTOR BACKGROUNDS
// ====================================================================
function QnbVectorArt({ tier = 'platinum' }: { tier?: string }) {
  const t = tier.toLowerCase();
  const isGold = t === 'gold';
  const isTitanium = t === 'titanium' || t === 'plus';
  const isPlatinum = t === 'platinum' || t === 'wealth';
  const isWorld = t === 'world' || t === 'world-elite' || t === 'world_elite' || t === 'private';

  const stop1 = isGold ? '#b88a1d' : isWorld ? '#0f0206' : isPlatinum ? '#24050d' : isTitanium ? '#360916' : '#4a0e20';
  const stop2 = isGold ? '#4a0e20' : isWorld ? '#24050d' : isPlatinum ? '#3d0a17' : isTitanium ? '#500e23' : '#63142c';
  const stop3 = isGold ? '#8c670d' : isWorld ? '#050002' : isPlatinum ? '#170207' : isTitanium ? '#2b1820' : '#1a040b';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="qnbBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stop1} />
          <stop offset="60%" stopColor={stop2} />
          <stop offset="100%" stopColor={stop3} />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#qnbBg)" />

      <path d="M 150 0 C 240 80 220 180 340 252 L 400 252 L 400 0 Z" fill="#d4af37" opacity="0.1" />
      <g stroke="#ffffff" opacity="0.18" strokeWidth="1.5">
        <circle cx="220" cy="126" r="50" />
        <circle cx="220" cy="126" r="75" strokeDasharray="5 5" />
      </g>
    </svg>
  );
}

// ====================================================================
// 5. HSBC EGYPT VECTOR BACKGROUNDS
// ====================================================================
function HsbcVectorArt({ tier = 'platinum' }: { tier?: string }) {
  const t = tier.toLowerCase();
  const isGold = t === 'gold';
  const isAdvance = t === 'plus' || t === 'advance' || t === 'titanium';
  const isPlatinum = t === 'platinum';
  const isPremier = t === 'wealth' || t === 'premier' || t === 'world' || t === 'world-elite' || t === 'world_elite';
  const isPrivate = t === 'private';

  const stop1 = isGold ? '#b88a1d' : isPrivate ? '#0c0a09' : isPremier ? '#1c1917' : isPlatinum ? '#262626' : isAdvance ? '#b91c1c' : '#2d2d2d';
  const stop2 = isGold ? '#2d2d2d' : isPrivate ? '#1a1a1a' : isPremier ? '#44403c' : isPlatinum ? '#333333' : isAdvance ? '#881337' : '#1f1f1f';
  const stop3 = isGold ? '#8c670d' : isPrivate ? '#000000' : isPremier ? '#0c0a09' : isPlatinum ? '#1a1a1a' : isAdvance ? '#450a0a' : '#111111';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="hsbcBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stop1} />
          <stop offset="50%" stopColor={stop2} />
          <stop offset="100%" stopColor={stop3} />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#hsbcBg)" />

      <g transform="translate(230, 126)" opacity={isAdvance ? "0.2" : "0.12"}>
        <rect x="-40" y="-40" width="80" height="80" transform="rotate(45)" fill="#dc2626" />
        <polygon points="-30,0 0,-30 30,0 0,30" fill="#ffffff" />
      </g>
      <line x1="0" y1="126" x2="400" y2="126" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
    </svg>
  );
}

// ====================================================================
// 6. ALEXBANK VECTOR BACKGROUNDS
// ====================================================================
function AlexbankVectorArt({ tier = 'platinum' }: { tier?: string }) {
  const t = tier.toLowerCase();
  const isGold = t === 'gold';
  const isTitanium = t === 'titanium' || t === 'plus';
  const isPlatinum = t === 'platinum';
  const isMagnifica = t === 'wealth' || t === 'magnifica' || t === 'world' || t === 'world-elite' || t === 'world_elite' || t === 'private';

  const stop1 = isGold ? '#b88a1d' : isMagnifica ? '#00241f' : isPlatinum ? '#002d27' : isTitanium ? '#00362f' : '#00473e';
  const stop2 = isGold ? '#00473e' : isMagnifica ? '#00362f' : isPlatinum ? '#004037' : isTitanium ? '#004e45' : '#006357';
  const stop3 = isGold ? '#8c670d' : isMagnifica ? '#001714' : isPlatinum ? '#001a16' : isTitanium ? '#00201c' : '#002b25';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="alexBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stop1} />
          <stop offset="60%" stopColor={stop2} />
          <stop offset="100%" stopColor={stop3} />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#alexBg)" />

      <rect x="220" y="26" width="120" height="120" rx="20" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.25" />
      <circle cx="280" cy="86" r="25" fill="#f97316" opacity="0.2" />
    </svg>
  );
}

// ====================================================================
// 7. AAIB VECTOR BACKGROUNDS
// ====================================================================
function AaibVectorArt({ tier = 'platinum' }: { tier?: string }) {
  const t = tier.toLowerCase();
  const isGold = t === 'gold';
  const isTitanium = t === 'titanium' || t === 'plus';
  const isPlatinum = t === 'platinum';
  const isWorld = t === 'wealth' || t === 'world' || t === 'world-elite' || t === 'world_elite' || t === 'private';

  const stop1 = isGold ? '#b88a1d' : isWorld ? '#040d1f' : isPlatinum ? '#061633' : isTitanium ? '#071630' : '#0b2248';
  const stop2 = isGold ? '#0b2248' : isWorld ? '#0a1c3b' : isPlatinum ? '#0b2659' : isTitanium ? '#0f2854' : '#153975';
  const stop3 = isGold ? '#8c670d' : isWorld ? '#02060e' : isPlatinum ? '#030c1f' : isTitanium ? '#040d1f' : '#061329';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="aaibBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stop1} />
          <stop offset="60%" stopColor={stop2} />
          <stop offset="100%" stopColor={stop3} />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#aaibBg)" />
      <rect x="10" y="10" width="380" height="232" rx="14" stroke="#d4af37" strokeWidth="1" opacity="0.3" fill="none" />
      <circle cx="320" cy="70" r="45" fill="#f59e0b" opacity="0.14" />
    </svg>
  );
}

// ====================================================================
// 8. EMIRATES NBD VECTOR BACKGROUNDS
// ====================================================================
function EnbdVectorArt({ tier = 'platinum' }: { tier?: string }) {
  const t = tier.toLowerCase();
  const isGold = t === 'gold';
  const isTitanium = t === 'titanium' || t === 'plus';
  const isPlatinum = t === 'platinum';
  const isWorld = t === 'wealth' || t === 'world' || t === 'world-elite' || t === 'world_elite' || t === 'private';

  const stop1 = isGold ? '#b88a1d' : isWorld ? '#000f29' : isPlatinum ? '#001438' : isTitanium ? '#00183d' : '#002456';
  const stop2 = isGold ? '#002456' : isWorld ? '#001b47' : isPlatinum ? '#001e52' : isTitanium ? '#002766' : '#003882';
  const stop3 = isGold ? '#8c670d' : isWorld ? '#000817' : isPlatinum ? '#000b1f' : isTitanium ? '#000d22' : '#001433';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="enbdBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stop1} />
          <stop offset="60%" stopColor={stop2} />
          <stop offset="100%" stopColor={stop3} />
        </linearGradient>
      </defs>
      <rect width="400" height="252" fill="url(#enbdBg)" />
      <path d="M 120 0 C 220 70 200 170 360 252 L 400 252 L 400 0 Z" fill="#06b6d4" opacity="0.14" />
      <circle cx="280" cy="110" r="70" stroke="#06b6d4" strokeWidth="2" strokeDasharray="6 6" fill="none" opacity="0.25" />
    </svg>
  );
}

// ── Generic Custom Brushed Metal ─────────────────────────────────
function GenericVectorArt({ color = '#0a7ea4' }: { color?: string }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `linear-gradient(135deg, ${color}ee 0%, ${color}99 55%, #000000ee 100%)`
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full border border-white/10" />
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-white/10" />
    </div>
  );
}

// ── Bank Header Badge Component ─────────────────────────────────────
export function BankHeader({ bank, isDebit, tierTitle }: { bank?: string; isDebit?: boolean; tierTitle?: string }) {
  if (bank === 'cib' || !bank) {
    return (
      <div className="flex items-center gap-2 select-none">
        <CibLogo variant={tierTitle === 'WEALTH' ? 'gold' : 'white'} />
        {isDebit && tierTitle && tierTitle !== 'STANDARD' ? (
          <span className="text-sm font-sans tracking-wide text-white/95 font-medium pl-1 border-l border-white/40">
            {tierTitle.charAt(0) + tierTitle.slice(1).toLowerCase()}
          </span>
        ) : null}
      </div>
    );
  }

  if (bank === 'nbe') return <NbeLogo />;
  if (bank === 'banque-misr') return <BanqueMisrLogo />;
  if (bank === 'qnb') return <QnbLogo />;
  if (bank === 'hsbc') return <HsbcLogo />;
  if (bank === 'alexbank') return <AlexbankLogo />;
  if (bank === 'aaib') return <AaibLogo />;
  if (bank === 'enbd') return <EnbdLogo />;

  return (
    <div className="select-none">
      <span className="text-xs font-black tracking-widest uppercase text-white/90">
        {bank.toUpperCase()}
      </span>
    </div>
  );
}

// ── CASH WALLET VECTOR ART (Banknote Guilloche Texture) ─────────────
function CashWalletVectorArt({ color = '#059669' }: { color?: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
      <defs>
        <radialGradient id="cashGlow" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="60%" stopColor="#06281c" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#02140e" stopOpacity="0.98" />
        </radialGradient>
        <linearGradient id="cashBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
        </linearGradient>
        <pattern id="guillocheMesh" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="10" stroke="#34d399" strokeWidth="0.5" strokeOpacity="0.12" fill="none" />
          <path d="M0 12 Q6 0 12 12 T24 12" stroke="#fbbf24" strokeWidth="0.4" strokeOpacity="0.08" fill="none" />
        </pattern>
      </defs>

      <rect width="400" height="252" fill="#03140e" />
      <rect width="400" height="252" fill="url(#cashGlow)" />
      <rect width="400" height="252" fill="url(#guillocheMesh)" />

      {/* Intricate Banknote Guilloche Borders */}
      <rect x="10" y="10" width="380" height="232" rx="14" stroke="url(#cashBorderGrad)" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.6" />
      <rect x="15" y="15" width="370" height="222" rx="11" stroke="#34d399" strokeWidth="0.75" fill="none" opacity="0.35" />

      {/* Corner Rosettes */}
      <circle cx="24" cy="24" r="7" stroke="#fbbf24" strokeWidth="0.8" opacity="0.4" fill="none" />
      <circle cx="376" cy="24" r="7" stroke="#fbbf24" strokeWidth="0.8" opacity="0.4" fill="none" />
      <circle cx="24" cy="228" r="7" stroke="#fbbf24" strokeWidth="0.8" opacity="0.4" fill="none" />
      <circle cx="376" cy="228" r="7" stroke="#fbbf24" strokeWidth="0.8" opacity="0.4" fill="none" />

      {/* Center Banknote Watermark Rosette */}
      <g transform="translate(200, 126)" opacity="0.08">
        <circle r="65" stroke="#34d399" strokeWidth="1.5" fill="none" />
        <circle r="50" stroke="#fbbf24" strokeWidth="1" fill="none" />
        <circle r="35" stroke="#34d399" strokeWidth="1" fill="none" />
        <ellipse rx="58" ry="22" stroke="#34d399" strokeWidth="0.7" fill="none" />
        <ellipse rx="58" ry="22" stroke="#34d399" strokeWidth="0.7" transform="rotate(45)" fill="none" />
        <ellipse rx="58" ry="22" stroke="#34d399" strokeWidth="0.7" transform="rotate(90)" fill="none" />
        <ellipse rx="58" ry="22" stroke="#34d399" strokeWidth="0.7" transform="rotate(135)" fill="none" />
      </g>
    </svg>
  );
}

// ── MAIN PHOTOREALISTIC CARD COMPONENT ──────────────────────────────
export function RealisticCard({
  wallet,
  spentThisMonth = 0,
  currencySymbol = 'EGP',
  showBalance = true,
  className = '',
  onClick
}: RealisticCardProps) {
  const { settings } = useStore();
  const hideBalance = settings?.hideBalance ?? false;

  // Dedicated Cash Wallet Presentation
  if (wallet.type === 'cash') {
    return (
      <div
        onClick={onClick}
        className={`relative w-full aspect-[1.586/1] rounded-[22px] p-5 md:p-6 overflow-hidden shadow-2xl transition-all duration-300 border border-emerald-500/30 select-none ${
          onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-emerald-500/10 active:scale-[0.99]' : ''
        } ${className}`}
      >
        <CashWalletVectorArt color={wallet.color} />

        {/* Specular ambient gloss */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.06] to-transparent pointer-events-none" />

        {/* Top Row: Cash Header & Badge */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857] border border-[#34d399]/40 flex items-center justify-center text-white shadow-md shadow-emerald-950/50">
              <Money size={24} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wider text-white uppercase font-sans">
                  CASH WALLET
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  كاش
                </span>
              </div>
              <p className="text-[10px] font-mono text-emerald-200/70 font-semibold tracking-wide">
                Physical Cash in Hand
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
            <Coins size={14} weight="fill" className="text-amber-400" />
            <span>DIRECT TENDER</span>
          </div>
        </div>

        {/* Center Account Name & Status */}
        <div className="my-auto py-2.5 flex items-center justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-300/70">
              Account
            </span>
            <span
              className="text-lg md:text-xl font-extrabold text-white tracking-wide truncate max-w-[220px]"
              style={{ textShadow: '0 1.5px 3px rgba(0,0,0,0.8)' }}
            >
              {wallet.name || 'Cash'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400/75 block">
              STATUS
            </span>
            <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              LIQUID
            </span>
          </div>
        </div>

        {/* Bottom Row: Currency info & Banknote Seal */}
        <div className="flex items-end justify-between relative z-10 pt-1 border-t border-emerald-500/20">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-200/60 font-medium">
              CURRENCY:
            </span>
            <span className="text-xs font-mono font-bold text-emerald-100 tracking-wider">
              {currencySymbol} • PHYSICAL NOTES
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-300/80">
            <WalletIcon size={16} weight="bold" />
            <span className="text-[10px] font-mono tracking-wider font-semibold">DIRECT SPEND</span>
          </div>
        </div>

        {/* Balance & Spent Overlay */}
        {showBalance && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            {spentThisMonth > 0 && (
              <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-right shadow-lg hidden sm:block">
                <p className="text-[8px] uppercase font-bold text-neutral-400 tracking-wider">SPENT</p>
                <p className="text-[11px] font-mono font-bold text-white/90">
                  {formatAmount(spentThisMonth, currencySymbol, hideBalance)}
                </p>
              </div>
            )}
            <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/30 text-right shadow-lg">
              <p className="text-[8px] uppercase font-bold text-emerald-300 tracking-wider">CASH BALANCE</p>
              <p className="text-xs font-mono font-extrabold text-emerald-400">
                {formatAmount(wallet.balance ?? 0, currencySymbol, hideBalance)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isCredit = wallet.type === 'credit';
  const isDebit = !isCredit;
  const bank = wallet.bank || 'cib';
  const accountTier = wallet.accountTier || 'prime';
  const creditTier = wallet.creditTier || 'platinum';
  const network = wallet.network || 'mastercard';

  const tierTitle = isCredit ? creditTier.toUpperCase() : accountTier.toUpperCase();
  const activeTier = isCredit ? creditTier : accountTier;

  // Render authentic vector background based on exact bank and tier
  const renderVectorBackground = () => {
    if (bank === 'cib') {
      if (isCredit) {
        if (creditTier === 'platinum') return <CibPlatinumVectorArt />;
        if (creditTier === 'gold') return <CibGoldVectorArt />;
        if (creditTier === 'titanium') return <CibTitaniumVectorArt />;
        if (creditTier === 'world' || (creditTier as string) === 'world-elite' || (creditTier as string) === 'world_elite') return <CibWorldVectorArt />;
        return <CibClassicCreditVectorArt />;
      } else {
        if (accountTier === 'prime') return <CibPrimeVectorArt />;
        if (accountTier === 'plus') return <CibPlusVectorArt />;
        if (accountTier === 'wealth') return <CibWealthVectorArt />;
        if (accountTier === 'private') return <CibPrivateVectorArt />;
        return <CibPrimeVectorArt />;
      }
    }

    if (bank === 'nbe') return <NbeVectorArt tier={activeTier} />;
    if (bank === 'banque-misr') return <BanqueMisrVectorArt tier={activeTier} />;
    if (bank === 'qnb') return <QnbVectorArt tier={activeTier} />;
    if (bank === 'hsbc') return <HsbcVectorArt tier={activeTier} />;
    if (bank === 'alexbank') return <AlexbankVectorArt tier={activeTier} />;
    if (bank === 'aaib') return <AaibVectorArt tier={activeTier} />;
    if (bank === 'enbd') return <EnbdVectorArt tier={activeTier} />;

    return <GenericVectorArt color={wallet.color} />;
  };

  return (
    <div
      onClick={onClick}
      className={`relative w-full aspect-[1.586/1] rounded-[22px] p-5 md:p-6 overflow-hidden shadow-2xl transition-all duration-300 border border-white/15 select-none ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-cyan-500/10 active:scale-[0.99]' : ''
      } ${className}`}
    >
      {/* ── AUTHENTIC VECTOR ART BACKGROUND ─────────────────────── */}
      {renderVectorBackground()}

      {/* Surface ambient specular gloss */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none" />

      {/* ── CARD TOP ROW: BANK LOGO & BONUS / CONTACTLESS ───────── */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <BankHeader bank={bank} isDebit={isDebit} tierTitle={tierTitle} />
          {bank === 'cib' && isDebit && (
            <p className="text-[10px] font-mono tracking-widest text-white/70 font-bold mt-0.5">EGP</p>
          )}
        </div>

        {/* Top Right Badges */}
        <div className="flex items-center gap-3">
          {bank === 'cib' && isCredit && <CibBonusBadge />}
          <div className="text-white/85 drop-shadow-sm">
            <ContactlessWave size={20} color="currentColor" />
          </div>
        </div>
      </div>

      {/* ── CARD MIDDLE: REAL EMV CHIP & TIER BADGE ────────────── */}
      <div className="my-auto pt-2 pb-1 flex items-center justify-between relative z-10">
        <EmvChip />

        <div className="text-right">
          <p
            className="text-xs font-mono font-black tracking-widest text-white/95 uppercase drop-shadow"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {isCredit ? `${creditTier} CREDIT` : `${accountTier} DEBIT`}
          </p>
        </div>
      </div>

      {/* ── CARD EMBOSSED NUMBER ───────────────────────────────── */}
      <div className="relative z-10 my-0.5">
        <p
          className="font-mono text-base md:text-lg tracking-[0.25em] text-white font-extrabold select-none"
          style={{
            textShadow: '0 1.5px 2px rgba(0,0,0,0.9), 0 -1px 1px rgba(255,255,255,0.4)',
            fontFamily: "'Courier New', Courier, monospace"
          }}
        >
          •••• •••• •••• {wallet.last4 || '5678'}
        </p>
      </div>

      {/* ── CARD BOTTOM ROW: CARDHOLDER, EXPIRY & NETWORK ──────── */}
      <div className="flex items-end justify-between relative z-10 pt-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase tracking-widest text-white/75 font-bold">
              VALID THRU
            </span>
            <span
              className="text-xs font-mono font-extrabold text-white tracking-widest"
              style={{ textShadow: '0 1.5px 2px rgba(0,0,0,0.9)' }}
            >
              {wallet.expiryDate || '12/28'}
            </span>
          </div>
          <p
            className="text-xs font-mono font-black tracking-wider text-white uppercase truncate max-w-[200px]"
            style={{
              textShadow: '0 1.5px 2px rgba(0,0,0,0.9), 0 -1px 1px rgba(255,255,255,0.3)',
              fontFamily: "'Courier New', Courier, monospace"
            }}
          >
            {wallet.cardholderName || wallet.name || 'PETER ASHRAF'}
          </p>
        </div>

        {/* Network Logo (Mastercard / Visa / Meeza) */}
        <div className="pb-0.5">
          <NetworkLogo network={network} />
        </div>
      </div>

      {/* ── BALANCE & SPENT PILL OVERLAY (In Card List) ─────────── */}
      {showBalance && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {spentThisMonth > 0 && (
            <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-right shadow-lg hidden sm:block">
              <p className="text-[8px] uppercase font-bold text-neutral-400 tracking-wider">SPENT</p>
              <p className="text-[11px] font-mono font-bold text-white/90">
                {formatAmount(spentThisMonth, currencySymbol, hideBalance)}
              </p>
            </div>
          )}
          <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-right shadow-lg">
            <p className="text-[8px] uppercase font-bold text-neutral-300 tracking-wider">BALANCE</p>
            <p className="text-xs font-mono font-extrabold text-white">
              {formatAmount(wallet.balance ?? 0, currencySymbol, hideBalance)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
