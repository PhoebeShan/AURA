
import React, { useState, useRef } from 'react';
import { Crystal, ContributionType } from '../types';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

interface AppraisalCardProps {
  crystal: Crystal;
  onClose: () => void;
  onHug: () => void;
  onVoiceRecorded?: (id: string, voiceData: string) => void;
}

const translateType = (type: ContributionType) => {
  switch (type) {
    case ContributionType.Physical: return '体力劳动';
    case ContributionType.Mental: return '脑力劳动';
    case ContributionType.Emotional: return '情感价值';
    case ContributionType.Strategic: return '战略管理';
    case ContributionType.Gratitude: return '感恩表达';
    case ContributionType.Patience: return '耐心包容';
    default: return type;
  }
};

const EnvelopeAnimation: React.FC<{ onClose: () => void; crystalDesc: string }> = ({ onClose, crystalDesc }) => {
  const [status, setStatus] = useState<'closed' | 'writing' | 'sent'>('closed');
  const [aiText, setAiText] = useState('');
  const [task, setTask] = useState('');
  const [hours, setHours] = useState('0');
  const [mins, setMins] = useState('30');
  const [writingProgress, setWritingProgress] = useState(0);

  const startWriting = async () => {
    setStatus('writing');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `基于这项付出：“${crystalDesc}”，写一段极其动人且含蓄的短文。
        核心逻辑：
        1. 表达我刚才的付出原本该存入心愿银行，但我反悔了，因为我太想即刻被你看到了。
        2. 转发给你是想让你立刻感受到我指尖传递出的爱的能量。
        3. 结尾要极其温柔，语气撒娇。
        4. 字数控制在100字以内，署名统一为“爱你的宝宝”。`,
      });
      const text = response.text || '';
      setAiText(text);
      
      let i = 0;
      const interval = setInterval(() => {
        setWritingProgress(prev => prev + 1);
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 40);
    } catch (e) {
      setAiText("本来想把这份疲惫悄悄存进银行换个大愿望，可这一秒我突然反悔了。因为比起那个遥远的心愿，我更想让现在的你，立刻感受到我掌心里这温热的、想念你的能量。这种时刻，只想被你看到。爱你的宝宝");
      setWritingProgress(100);
    }
  };

  const handleSend = () => {
    setStatus('sent');
    setTimeout(onClose, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xl p-6" onClick={onClose}>
      <div 
        className={`relative w-full max-w-sm transition-all duration-1000 ease-in-out ${status === 'sent' ? 'translate-y-[-120vh] rotate-[-15deg] opacity-0 scale-50' : 'envelope-animation'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Wings */}
        <div className="absolute -left-12 top-4 text-white/30 text-4xl wing-left">
          <i className="fa-solid fa-feather"></i>
        </div>
        <div className="absolute -right-12 top-4 text-white/30 text-4xl wing-right">
          <i className="fa-solid fa-feather fa-flip-horizontal"></i>
        </div>

        {/* Envelope Content Container */}
        <div className={`relative bg-[#fff9eb] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-1000 p-1 ${status !== 'closed' ? 'h-[520px]' : 'h-56'}`}>
          <div className="w-full h-full border-2 border-dashed border-amber-900/10 rounded-xl flex flex-col p-6 text-amber-900 overflow-hidden bg-cover bg-center" style={{backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(254,249,235,0.5) 100%)'}}>
            
            {status === 'closed' ? (
              <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="text-5xl mb-6 text-red-400 drop-shadow-sm"><i className="fa-solid fa-heart"></i></div>
                <p className="font-serif italic text-xl text-amber-900/80 mb-6">有一份能量待启封</p>
                <button 
                  onClick={startWriting}
                  className="px-8 py-3 bg-gradient-to-r from-amber-700/10 to-amber-700/5 hover:from-amber-700/20 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all border border-amber-900/10 active:scale-95"
                >
                  点击撰写
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in duration-700 flex flex-col h-full relative">
                {/* Writing Header */}
                <div className="flex justify-between items-start mb-4 border-b border-amber-900/10 pb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Aura Energy Tunnel</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                  </div>
                </div>
                
                {/* Interactive Writing Area */}
                <div className="flex-1 overflow-y-auto font-serif italic text-sm leading-relaxed relative pt-4 text-amber-900/90">
                  {status === 'writing' && writingProgress < aiText.length && (
                    <div 
                      className="absolute z-50 pointer-events-none transition-all duration-75"
                      style={{ 
                        left: `${(writingProgress * 7) % 80}%`, 
                        top: `${Math.floor(writingProgress / 8) * 1.6}rem`,
                      }}
                    >
                      <i className="fa-solid fa-pen-nib text-pink-500/80 text-2xl rotate-[-30deg] animate-pulse"></i>
                    </div>
                  )}
                  
                  <p className="whitespace-pre-wrap">{aiText.substring(0, writingProgress)}</p>
                  
                  {writingProgress >= aiText.length && (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5 border-t border-amber-900/5 pt-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-amber-900/40">特别约定：</label>
                        <input 
                          value={task}
                          onChange={e => setTask(e.target.value)}
                          placeholder="[在此填写想一起完成的另一个目标...]"
                          className="w-full bg-amber-900/5 border-b-2 border-amber-900/10 outline-none text-amber-900 placeholder:text-amber-900/20 px-2 py-1 text-sm focus:border-amber-700/30 transition-all"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] font-bold uppercase text-amber-900/40">隧道时限：</label>
                        <div className="flex gap-2 items-center bg-amber-900/5 rounded-lg px-2 py-1">
                          <select value={hours} onChange={e => setHours(e.target.value)} className="bg-transparent font-mono text-xs focus:outline-none">
                            {[...Array(24)].map((_, i) => <option key={i} value={i}>{i}h</option>)}
                          </select>
                          <span className="opacity-20">:</span>
                          <select value={mins} onChange={e => setMins(e.target.value)} className="bg-transparent font-mono text-xs focus:outline-none">
                            {['00','15','30','45'].map(m => <option key={m} value={m}>{m}m</option>)}
                          </select>
                          <i className="fa-regular fa-clock text-[10px] opacity-30 ml-1"></i>
                        </div>
                      </div>

                      <div className="text-right pt-2">
                        <p className="font-bold text-amber-900/70 text-xs">爱你的宝宝</p>
                      </div>

                      <button 
                        onClick={handleSend}
                        className="w-full py-4 bg-amber-900 text-[#fef3c7] rounded-2xl font-bold text-xs tracking-[0.3em] uppercase shadow-2xl active:scale-95 transition-all mt-4 hover:bg-amber-800"
                      >
                        发送给对方
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Heart Seal */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-700 ${status !== 'closed' ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
               <i className="fa-solid fa-heart text-red-500 animate-[heart-beat_1.5s_infinite]"></i>
            </div>
          </div>
        </div>

        {status === 'sent' && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200]">
            <div className="bg-amber-900 text-[#fef3c7] px-10 py-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] font-bold animate-in fade-in slide-in-from-bottom-12 scale-110">
              <i className="fa-solid fa-paper-plane mr-3"></i> 能量已成功穿越隧道！
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AppraisalCard: React.FC<AppraisalCardProps> = ({ crystal, onClose, onHug, onVoiceRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDone, setRecordingDone] = useState(!!crystal.hasVoiceMessage);
  const [showTunnel, setShowTunnel] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setRecordingDone(true);
          if (onVoiceRecorded) onVoiceRecorded(crystal.id, reader.result as string);
        };
      };
      setIsRecording(true);
      recorder.start();
      setTimeout(() => { if (recorder.state === 'recording') stopRecording(); }, 5000);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const playPlayback = async () => {
    if (!crystal.voiceData || isPlaying) return;
    try {
      setIsPlaying(true);
      const audio = new Audio(crystal.voiceData);
      audio.onended = () => setIsPlaying(false);
      await audio.play();
    } catch (err) { setIsPlaying(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
        <div className="max-w-md w-full glass bg-slate-900 border-amber-200/30 p-8 rounded-[40px] shadow-2xl relative animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>

          <div className="text-center mb-6">
            <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-200 text-[10px] font-bold rounded-full uppercase tracking-widest mb-2 border border-amber-500/30">AURA 能量价值鉴定证书</div>
            <h2 className="font-serif text-3xl text-white mb-2">贡献分析报告</h2>
            <p className="text-slate-400 text-sm italic">"{crystal.description}"</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
              <span className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">价值总计</span>
              <span className="text-2xl font-bold text-amber-300">{crystal.points} <span className="text-xs font-normal opacity-50 ml-1">Aura</span></span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
              <span className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">贡献类型</span>
              <span className="text-lg font-semibold text-white">{translateType(crystal.type)}</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
               <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/60">估值计算过程</h4>
                  <i className="fa-solid fa-calculator text-amber-500/50 text-xs"></i>
               </div>
               <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">外包重置成本:</span>
                    <span className="font-mono text-white">¥{crystal.details.outsourceCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">心理负荷成本:</span>
                    <span className="font-mono text-white">¥{crystal.details.opportunityCost}</span>
                  </div>
                  <p className="mt-3 text-[11px] text-amber-200/70 italic bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 leading-relaxed">
                    {crystal.details.valuationLogic}
                  </p>
               </div>
            </div>
            {crystal.details.referenceLink && (
              <a href={crystal.details.referenceLink} target="_blank" className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl transition-all hover:bg-blue-500/10 group">
                <span className="text-[10px] uppercase tracking-widest text-blue-200 font-bold flex items-center gap-2">
                  <i className="fa-solid fa-scroll text-[10px]"></i> 查看市场背书标准
                </span>
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-blue-400"></i>
              </a>
            )}
          </div>

          <div className="p-4 bg-amber-500/5 border-l-4 border-amber-500 rounded-r-xl mb-8">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-amber-500 mb-1">贡献结语</h4>
              <p className="text-sm text-slate-300 leading-relaxed italic">{crystal.details.explanation}</p>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
            <div className="flex justify-between gap-3">
              <button onClick={onHug} className="flex-1 py-3 bg-pink-500/20 text-pink-300 rounded-2xl text-[10px] uppercase font-bold border border-pink-500/30 hover:bg-pink-500/30 transition-all"><i className="fa-solid fa-heart mr-2"></i>爱的抱抱</button>
              <button onClick={recordingDone ? playPlayback : (isRecording ? stopRecording : startRecording)} disabled={isPlaying} className={`flex-1 py-3 rounded-2xl text-[10px] uppercase font-bold transition-all border ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30'}`}>
                {isRecording ? '录音中...' : recordingDone ? (isPlaying ? '播放中' : '播放感言') : '录制留言'}
              </button>
            </div>
            <button onClick={() => setShowTunnel(true)} className="w-full py-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-indigo-200 rounded-2xl text-[10px] uppercase font-bold border border-indigo-500/30 shadow-lg hover:from-purple-500/30 transition-all"><i className="fa-solid fa-paper-plane mr-2 animate-pulse"></i>能量隧道 (Energy Tunnel)</button>
          </div>
        </div>
      </div>
      {showTunnel && <EnvelopeAnimation onClose={() => setShowTunnel(false)} crystalDesc={crystal.description} />}
    </>
  );
};

export default AppraisalCard;
