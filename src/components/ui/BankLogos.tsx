/**
 * BankLogos.tsx — Photorealistic / Vector Bank Logo Components
 * Renders high-fidelity logos for Egyptian & International financial institutions.
 */

export function CibLogo({ variant = 'white', className = '' }: { variant?: 'white' | 'gold'; className?: string }) {
  const textColor = variant === 'gold' ? '#d4af37' : '#ffffff';
  return (
    <div className={`flex items-center select-none ${className}`}>
      <div className="flex items-center font-sans tracking-tight font-black text-xl" style={{ color: textColor }}>
        <span className="relative inline-flex items-center justify-center mr-0.5">
          <span className="text-2xl font-black leading-none">C</span>
          {/* CIB Core Globe */}
          <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] absolute inset-0 m-auto flex items-center justify-center shadow-sm">
            <span className="w-1.5 h-1.5 border border-white/90 rounded-full" />
          </span>
        </span>
        <span className="text-xl font-black tracking-tighter">IB</span>
      </div>
    </div>
  );
}

export function NbeLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="w-7 h-7 rounded-lg bg-[#044328] border border-[#d4af37] flex items-center justify-center text-[#d4af37] font-serif font-black text-xs shadow-md">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15 6H20V11L24 14L20 17V22H15L12 26L9 22H4V17L0 14L4 11V6H9L12 2Z" fill="#d4af37" opacity="0.3" />
          <path d="M12 4L14 8H18V12L21 14.5L18 17V21H14L12 23L10 21H6V17L3 14.5L6 12V8H10L12 4Z" stroke="#d4af37" strokeWidth="1.5" fill="none" />
          <circle cx="12" cy="13.5" r="3.5" fill="#d4af37" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-extrabold text-white tracking-wide font-sans">National Bank of Egypt</p>
        <p className="text-[9px] text-amber-300 font-semibold tracking-wider">البنك الأهلي المصري</p>
      </div>
    </div>
  );
}

export function BanqueMisrLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="w-7 h-7 rounded-lg bg-[#6d1320] border border-amber-300 flex items-center justify-center text-amber-300 font-bold text-xs shadow-md">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M7 16L12 7L17 16H7Z" fill="#f59e0b" />
          <circle cx="12" cy="13" r="1.5" fill="#6d1320" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-extrabold text-white tracking-wide font-sans">Banque Misr</p>
        <p className="text-[9px] text-red-200 font-semibold tracking-wider">بنك مصر</p>
      </div>
    </div>
  );
}

export function QnbLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="w-7 h-7 rounded-lg bg-[#4a0e20] border border-amber-300/80 flex items-center justify-center text-white font-extrabold text-xs shadow-sm relative overflow-hidden">
        <div className="absolute -left-1 -top-1 w-5 h-5 bg-[#7a1835] rotate-45" />
        <span className="relative z-10 text-[10px] font-black text-amber-300 tracking-tighter">QNB</span>
      </div>
      <div className="leading-tight">
        <span className="text-xs font-black text-white tracking-wider block">QNB ALAHLI</span>
        <span className="text-[9px] text-amber-200/80 font-medium block">QNB الأهلي</span>
      </div>
    </div>
  );
}

export function HsbcLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="w-6 h-6 flex items-center justify-center relative">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" fill="#DB0011" rx="2" />
          <path d="M0 0L12 12L0 24V0Z" fill="white" />
          <path d="M24 0L12 12L24 24V0Z" fill="white" />
        </svg>
      </div>
      <span className="text-sm font-black tracking-widest text-white font-sans">HSBC</span>
    </div>
  );
}

export function AlexbankLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="w-7 h-7 rounded-lg bg-[#00695c] border border-amber-400/60 flex items-center justify-center shadow-sm">
        <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
        </div>
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-extrabold text-white tracking-wide">ALEXBANK</p>
        <p className="text-[9px] text-teal-200 font-semibold">بنك الإسكندرية</p>
      </div>
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
