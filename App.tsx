
import React, { useState, useEffect } from 'react';
import CrystalJar from './components/CrystalJar';
import AppraisalCard from './components/AppraisalCard';
import WishCard from './components/WishCard';
import AddWishModal from './components/AddWishModal';
import { analyzeLabor, generateWishImage } from './services/geminiService';
import { UserState, Crystal, Wish, ContributionType } from './types';

// Simple celebration effect component
const CelebrationOverlay: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div 
          key={`heart-${i}`}
          className="heart-bubble"
          style={{
            left: `${Math.random() * 100}%`,
            '--duration': `${3 + Math.random() * 3}s`,
            '--rotation': `${Math.random() * 360}deg`,
            fontSize: `${10 + Math.random() * 30}px`,
            animationDelay: `${Math.random() * 2}s`
          } as any}
        >
          <i className="fa-solid fa-heart"></i>
        </div>
      ))}
      {[...Array(12)].map((_, i) => (
        <div 
          key={`firework-${i}`}
          className="firework-particle"
          style={{
            left: `${10 + Math.random() * 80}%`,
            '--y': `-${30 + Math.random() * 60}vh`,
            '--size': `${180 + Math.random() * 220}px`,
            '--color': `hsl(${Math.random() * 360}, 100%, 80%)`,
            animationDelay: `${Math.random() * 2}s`
          } as any}
        />
      ))}
    </div>
  );
};

const INITIAL_STATE: UserState = {
  totalAura: 2450,
  crystals: [
    {
      id: '1',
      timestamp: Date.now() - 86400000 * 3,
      description: '搞定了下周两家人的聚餐，协调了所有人的忌口',
      points: 150,
      type: ContributionType.Strategic,
      details: {
        outsourceCost: 100,
        opportunityCost: 50,
        explanation: '统筹8人的物流 and 饮食安排涉及高强度的认知调度和社交协调工作。',
        valuationLogic: '对比专业私人管家统筹费用(约¥100/项服务)及个人管理时薪核算。',
        referenceLink: 'https://www.shanghai.gov.cn/'
      }
    },
    {
      id: '2',
      timestamp: Date.now() - 86400000 * 2,
      description: '深度清洁了厨房油烟机和烤箱',
      points: 200,
      type: ContributionType.Physical,
      details: {
        outsourceCost: 150,
        opportunityCost: 50,
        explanation: '高强度的体力劳动和对家庭卫生环境的重大贡献。',
        valuationLogic: '参考上海家政市场深度保洁价格(¥60-80/小时) + 高空作业风险补贴。',
        referenceLink: 'https://m.58.com/sh/jiazheng/'
      }
    }
  ],
  wishes: [
    {
      id: 'w0',
      title: '蔡依林 北京演唱会 2026年6月',
      cost: 990,
      currentPoints: 0,
      image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400',
      status: 'pending',
      referenceTitle: '大麦网票价参考',
      referenceUrl: 'https://www.damai.cn'
    }
  ],
  huggedCrystalIds: []
};

const App: React.FC = () => {
  const [state, setState] = useState<UserState>(INITIAL_STATE);
  const [view, setView] = useState<'home' | 'wishes'>('home');
  const [input, setInput] = useState('');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInvitation, setShowInvitation] = useState<string | null>(null);
  const [isAddWishOpen, setIsAddWishOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const usedAura = state.wishes.reduce((acc, w) => acc + (w.status === 'completed' ? w.cost : w.currentPoints), 0);
  const totalAccumulated = state.totalAura + usedAura;

  const triggerCelebration = () => {
    setIsCelebrating(true);
    setTimeout(() => setIsCelebrating(false), 4000);
  };

  const handleSubmitLabor = async () => {
    if (!input.trim() || loading) return;
    
    setLoading(true);
    try {
      const analysis = await analyzeLabor(input);
      const newCrystal: Crystal = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        description: input,
        points: analysis.points,
        type: analysis.type,
        details: {
          outsourceCost: analysis.outsourceCost,
          opportunityCost: analysis.opportunityCost,
          explanation: analysis.explanation,
          valuationLogic: analysis.valuationLogic,
          referenceLink: analysis.referenceLink
        }
      };

      setState(prev => ({
        ...prev,
        totalAura: prev.totalAura + newCrystal.points,
        crystals: [...prev.crystals, newCrystal]
      }));
      setInput('');
      setSelectedCrystal(newCrystal);
    } catch (err) {
      console.error(err);
      alert("AI 分析失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWish = async (wishData: { title: string; cost: number; referenceUrl?: string; referenceTitle?: string }) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    
    const newWish: Wish = {
      id: tempId,
      title: wishData.title,
      cost: wishData.cost,
      currentPoints: 0,
      image: 'LOADING',
      status: 'pending',
      referenceUrl: wishData.referenceUrl,
      referenceTitle: wishData.referenceTitle
    };

    setState(prev => ({
      ...prev,
      wishes: [newWish, ...prev.wishes]
    }));
    setIsAddWishOpen(false);

    try {
      const aiImageUrl = await generateWishImage(wishData.title);
      setState(prev => ({
        ...prev,
        wishes: prev.wishes.map(w => w.id === tempId ? { ...w, image: aiImageUrl } : w)
      }));
    } catch (err) {
      console.error("AI Image Generation failed", err);
      setState(prev => ({
        ...prev,
        wishes: prev.wishes.map(w => w.id === tempId ? { ...w, image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=400' } : w)
      }));
    }
  };

  const handleRedeem = (wishId: string) => {
    const wish = state.wishes.find(w => w.id === wishId);
    if (!wish || state.totalAura <= 0 || wish.status === 'completed') return;

    const amountToRedeem = Math.min(250, wish.cost - wish.currentPoints, state.totalAura);
    
    setState((prev: UserState): UserState => {
      const newWishes = prev.wishes.map((w: Wish): Wish => {
        if (w.id === wishId) {
          const updatedPoints = w.currentPoints + amountToRedeem;
          const isComplete = updatedPoints >= w.cost;
          if (isComplete && w.status !== 'completed') {
            setShowInvitation(w.title);
            triggerCelebration();
          }
          return {
            ...w,
            currentPoints: updatedPoints,
            status: isComplete ? 'completed' : 'pending'
          };
        }
        return w;
      });

      return {
        ...prev,
        totalAura: prev.totalAura - amountToRedeem,
        wishes: newWishes
      };
    });
  };

  const handleHug = () => {
    if (selectedCrystal) {
      const targetId = selectedCrystal.id;
      setState(prev => ({ 
        ...prev, 
        huggedCrystalIds: prev.huggedCrystalIds.includes(targetId) 
          ? prev.huggedCrystalIds 
          : [...prev.huggedCrystalIds, targetId] 
      }));
      setSelectedCrystal(null);
    }
  };

  const handleVoiceRecorded = (id: string, voiceData: string) => {
    setState(prev => ({
      ...prev,
      crystals: prev.crystals.map(c => c.id === id ? { ...c, hasVoiceMessage: true, voiceData } : c)
    }));
    if (selectedCrystal?.id === id) {
      setSelectedCrystal(prev => prev ? { ...prev, hasVoiceMessage: true, voiceData } : null);
    }
  };

  const handleJarClick = (crystalId?: string) => {
    if (crystalId) {
      const crystal = state.crystals.find(c => c.id === crystalId);
      if (crystal) setSelectedCrystal(crystal);
    } else if (state.crystals.length > 0) {
      const latest = [...state.crystals].sort((a,b) => b.timestamp - a.timestamp)[0];
      setSelectedCrystal(latest);
    }
  };

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden text-white">
      <div className="fixed inset-0 bg-[#0f172a] -z-20"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full -z-10"></div>

      <CelebrationOverlay active={isCelebrating} />

      <header className="p-6 max-w-lg mx-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-serif italic text-white/90">Aura</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">Invisible Labor Value Bank</p>
          </div>
          
          <div className="text-right">
            <div className="inline-flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-white/30 mb-1">可用能量</span>
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent flex items-center">
                <i className="fa-solid fa-gem mr-2 text-sm text-amber-300"></i>
                {state.totalAura.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass bg-white/5 border-white/5 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 text-xs">
              <i className="fa-solid fa-heart"></i>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-tighter text-white/40">已圆梦支出</p>
              <p className="text-sm font-semibold text-pink-200">{usedAura.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass bg-white/5 border-white/5 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-tighter text-white/40">历史总收益</p>
              <p className="text-sm font-semibold text-blue-200">{totalAccumulated.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 mt-2">
        {view === 'home' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center">
              <h2 className="text-2xl font-serif mb-1">能量原野</h2>
              <p className="text-xs text-white/40">让每一份辛劳都被温柔标记</p>
            </div>

            <CrystalJar 
              crystals={state.crystals} 
              huggedIds={state.huggedCrystalIds}
              onClick={handleJarClick}
              totalAura={state.totalAura}
              usedAura={usedAura}
            />

            <div className="glass rounded-[32px] p-5 shadow-inner border-white/5 bg-slate-900/40">
              <div className="relative flex items-center gap-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="记录此刻的付出，换取一份感激..."
                  className="flex-1 bg-transparent border-none text-white placeholder-white/10 focus:ring-0 resize-none h-20 p-1 text-sm outline-none"
                />
                
                <div className="relative">
                  <button 
                    disabled={loading || !input.trim()}
                    onClick={handleSubmitLabor}
                    className={`relative w-14 h-14 flex items-center justify-center transition-all duration-300
                      ${loading ? 'opacity-50 cursor-wait' : 'hover:scale-110 active:scale-90 active:translate-y-1'}
                    `}
                  >
                    <div className={`absolute inset-0 transition-all duration-300
                      ${loading ? 'animate-pulse scale-90' : 'animate-[heart-beat_2s_infinite]'}
                    `}>
                      <i className="fa-solid fa-heart text-5xl text-pink-500 drop-shadow-[0_4px_0_#be185d] filter brightness-110"></i>
                      <div className="absolute top-[20%] left-[25%] w-[15%] h-[15%] bg-white/40 rounded-full blur-[2px]"></div>
                    </div>
                    {loading && <i className="fa-solid fa-spinner fa-spin text-white text-xs z-10"></i>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex justify-between items-end mb-2">
              <div className="text-left">
                <h2 className="text-2xl font-serif mb-1">心愿银行</h2>
                <p className="text-xs text-white/40">每一颗晶石都是通往幸福的入场券</p>
              </div>
              <button 
                onClick={() => setIsAddWishOpen(true)}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/5"
              >
                <i className="fa-solid fa-plus text-sm"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              {state.wishes.map((wish, index) => (
                <div key={wish.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-in fade-in slide-in-from-right-4">
                  <WishCard 
                    wish={wish} 
                    onRedeem={() => handleRedeem(wish.id)}
                    onCelebration={triggerCelebration}
                    canRedeem={state.totalAura > 0}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 glass rounded-full px-8 py-4 flex gap-12 items-center shadow-2xl border-white/10 bg-slate-900/80">
        <button 
          onClick={() => setView('home')}
          className={`text-xl transition-all ${view === 'home' ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white/30 hover:text-white/50'}`}
        >
          <i className="fa-solid fa-seedling"></i>
        </button>
        <div className="w-[1px] h-6 bg-white/5"></div>
        <button 
          onClick={() => setView('wishes')}
          className={`text-xl transition-all ${view === 'wishes' ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white/30 hover:text-white/50'}`}
        >
          <i className="fa-solid fa-vault"></i>
        </button>
      </nav>

      {selectedCrystal && (
        <AppraisalCard 
          crystal={selectedCrystal} 
          onClose={() => setSelectedCrystal(null)} 
          onHug={handleHug}
          onVoiceRecorded={handleVoiceRecorded}
        />
      )}

      {isAddWishOpen && (
        <AddWishModal 
          onClose={() => setIsAddWishOpen(false)}
          onAdd={handleAddWish}
        />
      )}

      {showInvitation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm w-full glass bg-white/10 p-10 rounded-[40px] text-center shadow-[0_0_50px_rgba(251,191,36,0.3)] animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-amber-400 rounded-full mx-auto flex items-center justify-center text-black text-3xl mb-6 animate-bounce">
              <i className="fa-solid fa-gift"></i>
            </div>
            <h3 className="text-2xl font-serif mb-4">心愿达成！</h3>
            <p className="text-white/70 text-sm mb-8 leading-relaxed">
              这是你努力经营生活的奖励。<br/><b>{showInvitation}</b> 兑换成功，<br/>去开启你们的专属时光吧！
            </p>
            <button 
              onClick={() => setShowInvitation(null)}
              className="w-full py-4 bg-amber-400 text-black font-bold rounded-2xl hover:bg-amber-300 transition-colors shadow-lg"
            >
              太棒了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
