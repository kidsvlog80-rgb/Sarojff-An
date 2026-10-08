export function SreeWinLogo({ className = "h-36 object-contain" }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/6JpFH3Wr/131450-removebg-preview.png"
      alt="Sree Win Logo"
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}

export function SreeWinSideIcon({ className = "w-[48px] h-[48px]" }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/4g8m2jx3/app-icon.webp"
      alt="Sree Win Icon"
      className={`${className} object-cover rounded-2xl border-2 border-purple-500/70 shadow-[0_0_16px_rgba(168,85,247,0.5)]`}
      referrerPolicy="no-referrer"
    />
  );
}

