/**
 * BankLogos.tsx — Real Official Bank Logos with Transparent Backgrounds & Large Sizing.
 */

export function CibLogo({ className = '' }: { variant?: string; className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/cib.png" alt="CIB Logo" className={`h-8 sm:h-9 md:h-10 max-h-10 w-auto object-contain filter drop-shadow-md ${className}`} />
    </div>
  );
}

export function NbeLogo({ className = '' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/nbe.png" alt="NBE Logo" className={`h-8 sm:h-9 md:h-10 max-h-10 w-auto object-contain filter drop-shadow-md ${className}`} />
    </div>
  );
}

export function BanqueMisrLogo({ className = '' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/banque-misr.png" alt="Banque Misr Logo" className={`h-9 sm:h-10 md:h-11 max-h-11 w-auto object-contain filter drop-shadow-md ${className}`} />
    </div>
  );
}

export function QnbLogo({ className = '' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/qnb.png" alt="QNB Logo" className={`h-8 sm:h-9 md:h-10 max-h-10 w-auto object-contain filter drop-shadow-md ${className}`} />
    </div>
  );
}

export function HsbcLogo({ className = '' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/hsbc.png" alt="HSBC Logo" className={`h-7 sm:h-8 md:h-9 max-h-9 w-auto object-contain filter drop-shadow-md brightness-0 invert ${className}`} />
    </div>
  );
}

export function AlexbankLogo({ className = '' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="./logos/alexbank.png" alt="AlexBank Logo" className={`h-8 sm:h-9 md:h-10 max-h-10 w-auto object-contain filter drop-shadow-md ${className}`} />
    </div>
  );
}

export function AaibLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-[#0f2b5c] border border-amber-400/80 flex items-center justify-center shadow-md shrink-0">
        <span className="text-amber-400 font-black text-sm tracking-tighter">AAIB</span>
      </div>
      <div className="leading-tight">
        <p className="text-xs font-extrabold text-white tracking-wide">AAIB Egypt</p>
        <p className="text-[10px] text-blue-200 font-semibold">البنك العربي الأفريقي</p>
      </div>
    </div>
  );
}

export function EnbdLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-[#002b66] border border-cyan-400/60 flex items-center justify-center shadow-md shrink-0">
        <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent rotate-45" />
      </div>
      <div className="leading-tight">
        <p className="text-xs font-extrabold text-white tracking-wide">Emirates NBD</p>
        <p className="text-[10px] text-cyan-200 font-semibold">الإمارات دبي الوطني</p>
      </div>
    </div>
  );
}
