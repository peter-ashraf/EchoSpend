/**
 * BankLogos.tsx — Uses official downloaded PNG logo images for real bank cards.
 */

export function CibLogo({ className = 'h-7 object-contain' }: { variant?: string; className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/cib.png" alt="CIB Logo" className={className} />
    </div>
  );
}

export function NbeLogo({ className = 'h-8 object-contain' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/nbe.png" alt="NBE Logo" className={className} />
    </div>
  );
}

export function BanqueMisrLogo({ className = 'h-8 object-contain' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/banque-misr.png" alt="Banque Misr Logo" className={className} />
    </div>
  );
}

export function QnbLogo({ className = 'h-7 object-contain' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/qnb.png" alt="QNB Logo" className={className} />
    </div>
  );
}

export function HsbcLogo({ className = 'h-6 object-contain brightness-0 invert' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/hsbc.png" alt="HSBC Logo" className={className} />
    </div>
  );
}

export function AlexbankLogo({ className = 'h-7 object-contain' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/alexbank.png" alt="AlexBank Logo" className={className} />
    </div>
  );
}

export function AaibLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="w-7 h-7 rounded-lg bg-[#0f2b5c] border border-amber-400/80 flex items-center justify-center shadow-sm">
        <span className="text-amber-400 font-black text-xs tracking-tighter">AAIB</span>
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-extrabold text-white tracking-wide">AAIB Egypt</p>
        <p className="text-[9px] text-blue-200 font-semibold">البنك العربي الأفريقي</p>
      </div>
    </div>
  );
}

export function EnbdLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="w-7 h-7 rounded-lg bg-[#002b66] border border-cyan-400/60 flex items-center justify-center shadow-sm">
        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent rotate-45" />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-extrabold text-white tracking-wide">Emirates NBD</p>
        <p className="text-[9px] text-cyan-200 font-semibold">الإمارات دبي الوطني</p>
      </div>
    </div>
  );
}
