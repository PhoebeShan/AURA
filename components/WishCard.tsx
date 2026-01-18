
import React, { useState } from 'react';
import { Wish } from '../types';

interface WishCardProps {
  wish: Wish;
  onRedeem: () => void;
  onCelebration: () => void;
  canRedeem: boolean;
}

const WishCard: React.FC<WishCardProps> = ({ wish, onRedeem, onCelebration, canRedeem }) => {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const progress = (wish.currentPoints / wish.cost) * 100;
  const isComplete = wish.status === 'completed';
  const isLoadingImage = wish.image === 'LOADING';

  const handleRedeemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRedeeming(true);
    onRedeem();
    setTimeout(() => setIsRedeeming(false), 800);
  };

  const handleCardClick = () => {
    if (isComplete) {
      onCelebration();
    }
  };

  const openReference = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wish.referenceUrl) {
      window.open(wish.referenceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`relative overflow-hidden glass rounded-[32px] p-6 transition-all duration-500 border-white/5 cursor-pointer
        ${isComplete ? 'border-amber-400/30 bg-amber-400/5 shadow-[0_0_40px_rgba(251,191,36,0.05)] active:scale-[0.98]' : 'hover:border-white/10'}`}
    >
      
      {/* Red Stamp Watermark for Completed Wishes */}
      {isComplete && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-1000">
          <div className="stamp-red font-bold font-serif whitespace-nowrap -rotate-[15deg] shadow-lg">
            已圆梦
          </div>
        </div>
      )}

      <div className="flex gap-5 relative z-10">
        {/* Image / Loading Area */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative bg-slate-800 shadow-inner flex items-center justify-center">
          {isLoadingImage ? (
            <div className="flex flex-col items-center justify-center text-amber-500/50">
              <i className="fa-solid fa-palette animate-pulse text-xl mb-1"></i>
              <span className="text-[8px] uppercase tracking-tighter">AI 描绘中</span>
            </div>
          ) : (
            <img 
              src={wish.image} 
              alt={wish.title} 
              className={`w-full h-full object-cover transition-all duration-1000 ${isComplete ? 'grayscale-[0.6] opacity-40 blur-[1px]' : 'grayscale-[0.3] group-hover:scale-110'}`}
            />
          )}
          {isComplete && !isLoadingImage && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <i className="fa-solid fa-check text-white/50 text-2xl drop-shadow-lg"></i>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="relative">
            <div className="flex justify-between items-start">
              <h3 className={`font-semibold text-lg leading-tight tracking-tight ${isComplete ? 'text-white/50' : 'text-white'}`}>
                {wish.title}
              </h3>
              {isComplete && <i className="fa-solid fa-crown text-amber-500/50 text-xs ml-2"></i>}
            </div>
            
            {/* Reference Source Link */}
            {wish.referenceUrl && (
              <button 
                onClick={openReference}
                className="inline-flex items-center gap-1.5 mt-1 text-[9px] text-amber-400/60 hover:text-amber-300 transition-colors uppercase tracking-widest font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/5"
              >
                <i className="fa-solid fa-link text-[8px]"></i>
                <span className="max-w-[120px] truncate">{wish.referenceTitle || '查看来源'}</span>
              </button>
            )}

            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-2 font-medium">
              {wish.cost} 能量目标
            </p>
          </div>

          <div className="flex justify-between items-end">
             <div className="flex flex-col">
               <span className={`text-base font-mono font-bold transition-colors duration-500 ${isComplete ? 'text-amber-500/50' : 'text-amber-400'}`}>
                  {Math.floor(wish.currentPoints)} 
                  <span className="text-[10px] text-white/20 ml-1.5">/ {wish.cost}</span>
               </span>
             </div>
             {!isComplete ? (
               <button
                disabled={!canRedeem || isRedeeming || isLoadingImage}
                onClick={handleRedeemClick}
                className={`text-[10px] font-bold px-5 py-2.5 rounded-full uppercase tracking-widest transition-all active:scale-90 relative overflow-hidden group/btn ${
                  canRedeem && !isLoadingImage
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
               >
                 <span className="relative z-10">用爱兑换</span>
               </button>
             ) : (
               <div className="text-[10px] font-bold text-amber-500/60 flex items-center gap-2 uppercase tracking-widest group">
                 <i className="fa-solid fa-heart animate-pulse"></i> 
                 <span>点击重温</span>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
        <div 
          className={`h-full transition-all duration-1000 ease-out rounded-full relative ${
            isComplete 
              ? 'bg-slate-700' 
              : 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
          }`}
          style={{ width: `${Math.min(100, progress)}%` }}
        >
          {!isComplete && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishCard;
