
import React, { useState, useEffect } from 'react';
import { getMarketValuation, MarketValuationResult } from '../services/geminiService';

interface AddWishModalProps {
  onClose: () => void;
  onAdd: (wish: { title: string; cost: number; referenceUrl?: string; referenceTitle?: string }) => void;
}

const AddWishModal: React.FC<AddWishModalProps> = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [valuing, setValuing] = useState(false);
  const [references, setReferences] = useState<MarketValuationResult['sources']>([]);

  // Real-time market lookup with debounce
  useEffect(() => {
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      setReferences([]);
      return;
    }

    const timer = setTimeout(async () => {
      setValuing(true);
      try {
        const result = await getMarketValuation(trimmed);
        if (result.price > 0) {
          setCost(result.price.toString());
          setReferences(result.sources);
        }
      } catch (err) {
        console.error("Valuation lookup failed", err);
      } finally {
        setValuing(false);
      }
    }, 1200); // Wait for user to finish typing

    return () => clearTimeout(timer);
  }, [title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !cost || loading) return;
    
    setLoading(true);
    onAdd({
      title,
      cost: parseInt(cost),
      referenceUrl: references[0]?.uri,
      referenceTitle: references[0]?.title
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
      <div className="max-w-md w-full glass bg-[#0f172a]/95 border-white/10 p-8 rounded-[40px] shadow-2xl relative animate-in zoom-in fade-in duration-300 border-t-white/20">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl mx-auto flex items-center justify-center text-white text-xl mb-3 shadow-lg shadow-amber-500/20">
            <i className="fa-solid fa-magnifying-glass-dollar"></i>
          </div>
          <h2 className="font-serif text-2xl text-white">锚定心愿目标</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">AI 实时全网询价 & 价值核定</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">心愿描述</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：双人马尔代夫游、戴森吹风机..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-white/10"
            />
          </div>

          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center px-1">
               <label className="text-[10px] uppercase tracking-widest text-white/40">能量目标 (市场核算点数)</label>
               {valuing && (
                 <div className="flex items-center gap-1.5 text-amber-400 animate-pulse">
                    <i className="fa-solid fa-satellite-dish text-[10px]"></i>
                    <span className="text-[9px] font-bold uppercase tracking-tighter">联网核价中</span>
                 </div>
               )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/50 font-bold text-sm">¥</span>
              <input
                type="number"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder={valuing ? "查询市场均价..." : "输入点数目标"}
                className={`w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono ${valuing ? 'text-amber-500/50' : ''}`}
              />
            </div>
            <p className="text-[9px] text-white/20 px-1 italic">点数 1:1 锚定人民币，AI 给出的估算值仅供参考，您可以根据实际需求修改。</p>
          </div>

          {/* Reference Link - Grounding Audit Result */}
          {references.length > 0 && (
            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-certificate text-[10px] text-amber-500"></i>
                <h4 className="text-[9px] uppercase tracking-widest text-amber-500/80 font-bold">全网公允价参考来源</h4>
              </div>
              {references.map((ref, idx) => (
                <a 
                  key={idx} 
                  href={ref.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 text-[11px] text-white/70 hover:text-amber-300 transition-colors bg-white/5 p-3 rounded-xl border border-white/5"
                >
                  <span className="line-clamp-1 flex-1 leading-snug">{ref.title}</span>
                  <i className="fa-solid fa-up-right-from-square text-[9px] opacity-40 group-hover:opacity-100"></i>
                </a>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || valuing || !title || !cost}
            className={`w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl mt-4
              ${loading || valuing || !title || !cost
                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white shadow-amber-500/20 active:scale-95'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <i className="fa-solid fa-spinner fa-spin"></i>
                AI 绘图中...
              </span>
            ) : (
              "确定并存入心愿银行"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddWishModal;
