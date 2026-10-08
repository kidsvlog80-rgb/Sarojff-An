import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { playSynthesizerSound } from '../lib/audio';

import { getPublicSettings } from '../lib/settings';

interface PremiumPlansScreenProps {
  onBack: () => void;
}

interface PlanItem {
  id: string;
  name: string;
  duration: string;
  price: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  cardBorder: string;
  cardGlow: string;
  accentBar: string;
  buttonBg: string;
  buttonText: string;
  buttonGlow: string;
  currencySymbolColor?: string;
  link: string;
}

export const PremiumPlansScreen: React.FC<PremiumPlansScreenProps> = ({ onBack }) => {
  const defaultTelegramUrl = getPublicSettings().telegramUrl || 'https://t.me/Sandy_traders';

  const handlePlanClick = (targetUrl: string) => {
    playSynthesizerSound('click');
    window.open(targetUrl || defaultTelegramUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBackClick = () => {
    playSynthesizerSound('click');
    onBack();
  };

  const plans: PlanItem[] = [
    {
      id: 'bronze',
      name: 'Drago Bronze',
      duration: '7 DAYS',
      price: '999',
      badge: 'BRONZE',
      badgeColor: '#ffffff',
      badgeBg: 'bg-[#d97706]',
      badgeBorder: 'border-[#b45309]',
      cardBorder: 'border-[#1e293b]',
      cardGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6)]',
      accentBar: 'bg-gradient-to-r from-[#d97706] to-[#92400e]',
      buttonBg: 'bg-gradient-to-r from-[#e68a00] via-[#c46800] to-[#b35900]',
      buttonText: 'text-white',
      buttonGlow: 'hover:shadow-[0_0_20px_rgba(217,119,6,0.6)]',
      currencySymbolColor: 'text-[#d97706]',
      link: 'https://t.me/Sandy_traders?text=%F0%9F%9A%80%20%2A%2AHello%20Admin%2C%20I%20want%20to%20purchase%20the%20Drago%207%20Day%20plan%21%2A%2A%20%E2%9A%A1%20%F0%9F%92%8E'
    },
    {
      id: 'silver',
      name: 'Drago Silver',
      duration: '1 MONTH',
      price: '1999',
      badge: 'SILVER',
      badgeColor: '#0b1329',
      badgeBg: 'bg-[#cbd5e1]',
      badgeBorder: 'border-[#94a3b8]',
      cardBorder: 'border-[#1e293b]',
      cardGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6)]',
      accentBar: 'bg-gradient-to-r from-[#94a3b8] to-[#64748b]',
      buttonBg: 'bg-gradient-to-r from-[#cbd5e1] via-[#94a3b8] to-[#64748b]',
      buttonText: 'text-[#0b1329]',
      buttonGlow: 'hover:shadow-[0_0_20px_rgba(203,213,225,0.6)]',
      currencySymbolColor: 'text-[#94a3b8]',
      link: 'https://t.me/Sandy_traders?text=%F0%9F%9A%80%20%2A%2AHello%20Admin%2C%20I%20want%20to%20purchase%20the%20Drago%201%20month%20plan%21%2A%2A%20%E2%9A%A1%20%F0%9F%92%8E'
    },
    {
      id: 'diamond',
      name: 'Drago Diamond',
      duration: '2 MONTHS',
      price: '4999',
      badge: 'DIAMOND',
      badgeColor: '#ffffff',
      badgeBg: 'bg-[#00a6ff]',
      badgeBorder: 'border-[#0088cc]',
      cardBorder: 'border-[#1e293b]',
      cardGlow: 'shadow-[0_4px_25px_rgba(0,0,0,0.6)]',
      accentBar: 'bg-gradient-to-r from-[#00c8ff] to-[#0077cc]',
      buttonBg: 'bg-gradient-to-r from-[#00b4ff] via-[#0088ff] to-[#0066ee]',
      buttonText: 'text-white',
      buttonGlow: 'hover:shadow-[0_0_25px_rgba(0,180,255,0.7)]',
      currencySymbolColor: 'text-[#00c8ff]',
      link: 'https://t.me/Sandy_traders?text=%F0%9F%9A%80%20Hello%20Admin%2C%20I%20want%20to%20purchase%20the%20Drago%202%20month%20plan%21%20%E2%9A%A1%20%F0%9F%92%8E'
    },
    {
      id: 'vip',
      name: 'Drago VIP Elite',
      duration: '1 YEAR',
      price: '11999',
      badge: '1 YEAR VIP',
      badgeColor: '#ffffff',
      badgeBg: 'bg-gradient-to-r from-[#a855f7] to-[#ec4899]',
      badgeBorder: 'border-[#9333ea]',
      cardBorder: 'border-[#9333ea]/50',
      cardGlow: 'shadow-[0_4px_30px_rgba(168,85,247,0.3)]',
      accentBar: 'bg-gradient-to-r from-[#a855f7] to-[#ec4899]',
      buttonBg: 'bg-gradient-to-r from-[#a855f7] via-[#9333ea] to-[#7e22ce]',
      buttonText: 'text-white',
      buttonGlow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]',
      currencySymbolColor: 'text-[#d946ef]',
      link: 'https://t.me/Sandy_traders?text=%F0%9F%9A%80%20Hello%20Admin%2C%20I%20want%20to%20purchase%20the%20Drago%201%20year%20plan%21%20%E2%9A%A1%20%F0%9F%92%8E'
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-white flex flex-col overflow-x-hidden font-oxanium select-none">
      
      {/* Dynamic Cyber Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 200, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 200, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Sticky Top Cyber Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#040b17]/95 backdrop-blur-md border-b border-[#0f223d]/80 px-4 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <button
          onClick={handleBackClick}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-cyan-400 hover:text-white hover:bg-[#0b1b33]/80 active:scale-95 transition-all"
          aria-label="Go Back"
        >
          <ChevronLeft className="w-8 h-8 stroke-[2.5]" />
        </button>

        <h1 className="text-xl sm:text-2xl font-bold tracking-[0.25em] uppercase text-white font-iceland text-center flex-1 pr-10">
          PREMIUM PLANS
        </h1>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col gap-6">
        
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.1 }}
            className={`relative w-full bg-[#0b1426]/95 border ${plan.cardBorder} rounded-2xl overflow-hidden ${plan.cardGlow} [clip-path:polygon(0_0,calc(100%-60px)_0,100%_32px,100%_100%,0_100%)] p-5 sm:p-6 flex flex-col shadow-xl`}
          >
            {/* Top Right Angular Badge */}
            <div 
              className={`absolute top-0 right-0 ${plan.badgeBg} text-xs sm:text-sm font-extrabold tracking-widest px-5 py-1 [clip-path:polygon(16px_0,100%_0,100%_100%,0_100%)] font-iceland uppercase`}
              style={{ color: plan.badgeColor }}
            >
              {plan.badge}
            </div>

            {/* Plan Header: Title & Duration */}
            <div className="flex items-center justify-between mt-1 mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide font-iceland">
                {plan.name}
              </h2>
              <span className="text-base sm:text-lg font-bold tracking-widest text-slate-300 font-iceland uppercase">
                {plan.duration}
              </span>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-2 my-2">
              <span className={`text-2xl sm:text-3xl font-bold ${plan.currencySymbolColor || 'text-white'}`}>
                ₹
              </span>
              <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-iceland">
                {plan.price}
              </span>
            </div>

            {/* Angled PURCHASE NOW Button */}
            <button
              onClick={() => handlePlanClick(plan.link)}
              className={`w-full mt-3 py-3.5 sm:py-4 px-6 ${plan.buttonBg} ${plan.buttonText} font-bold text-xl sm:text-2xl tracking-[0.18em] font-iceland uppercase transition-all duration-200 active:scale-[0.98] ${plan.buttonGlow} [clip-path:polygon(0_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%)] shadow-lg flex items-center justify-center cursor-pointer`}
            >
              PURCHASE NOW
            </button>
          </motion.div>
        ))}

        {/* Footer Contact Support */}
        <div className="mt-2 mb-8 text-center flex flex-col items-center justify-center gap-1">
          <span className="text-sm text-slate-400 font-medium font-sans">
            Need custom plan?
          </span>
          <button
            onClick={() => handlePlanClick('https://t.me/Sandy_traders?text=%F0%9F%9A%80%20Hello%20Admin%2C%20I%20need%20custom%20plan%20assistance%21')}
            className="text-[#00c8ff] hover:text-cyan-300 font-bold text-base sm:text-lg tracking-wider transition-colors active:scale-95 font-iceland uppercase cursor-pointer"
          >
            Contact Support
          </button>
        </div>

      </main>
    </div>
  );
};

export default PremiumPlansScreen;
