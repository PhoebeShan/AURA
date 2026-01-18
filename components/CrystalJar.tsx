
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Crystal, ContributionType } from '../types';
import { generateHuggingSound } from '../services/geminiService';

interface CrystalJarProps {
  crystals: Crystal[];
  huggedIds: string[];
  onClick: (crystalId?: string) => void;
  isAbsorbing?: boolean;
  totalAura?: number;
  usedAura?: number;
}

const getCrystalColor = (type: ContributionType) => {
  switch (type) {
    case ContributionType.Physical: return 'rgba(147, 197, 253, 0.8)';
    case ContributionType.Mental: return 'rgba(165, 180, 252, 0.8)';
    case ContributionType.Emotional: return 'rgba(244, 114, 182, 0.8)';
    case ContributionType.Strategic: return 'rgba(251, 191, 36, 0.8)';
    case ContributionType.Gratitude: return 'rgba(254, 240, 138, 0.9)';
    case ContributionType.Patience: return 'rgba(45, 212, 191, 0.8)';
    default: return 'rgba(255, 255, 255, 0.8)';
  }
};

const CrystalJar: React.FC<CrystalJarProps> = ({ crystals, huggedIds, onClick, isAbsorbing }) => {
  const [hoveredCrystalId, setHoveredCrystalId] = useState<string | null>(null);
  const [physicsObjects, setPhysicsObjects] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const soundLoadingRef = useRef<boolean>(false);

  const MIN_RADIUS = 10;
  const MAX_RADIUS = 22; 
  const JAR_WIDTH = 288;
  const CENTER_X = JAR_WIDTH / 2;
  const TOP_LIMIT = 85;
  const BOTTOM_LIMIT = 285;
  const HORIZONTAL_MARGIN = 80;

  const crystalRadii = useMemo(() => {
    if (crystals.length === 0) return {};
    const totalPoints = crystals.reduce((sum, c) => sum + c.points, 0);
    return crystals.reduce((acc, c) => {
      const weight = crystals.length === 1 ? 0.4 : c.points / totalPoints;
      const radius = MIN_RADIUS + (Math.sqrt(weight) * (MAX_RADIUS - MIN_RADIUS));
      acc[c.id] = Math.min(radius, MAX_RADIUS);
      return acc;
    }, {} as Record<string, number>);
  }, [crystals]);

  useEffect(() => {
    setPhysicsObjects(prev => {
      const existingIds = new Set(prev.map(o => o.id));
      const next = prev.map(obj => ({ ...obj, radius: crystalRadii[obj.id] || obj.radius }));
      
      crystals.forEach(c => {
        if (!existingIds.has(c.id)) {
          next.push({
            id: c.id,
            type: c.type,
            x: CENTER_X + (Math.random() - 0.5) * 40,
            y: TOP_LIMIT - 20,
            vx: (Math.random() - 0.5) * 4,
            vy: 5 + Math.random() * 2,
            radius: crystalRadii[c.id] || MIN_RADIUS
          });
        }
      });
      return next;
    });
  }, [crystals, crystalRadii]);

  useEffect(() => {
    const update = () => {
      setPhysicsObjects(prev => {
        // 1. Apply Forces and Movement
        const next = prev.map((obj) => {
          let { x, y, vx, vy, radius } = obj;
          const gravity = 0.45;
          const friction = 0.98;
          const airResistance = 0.99;

          vy += gravity;
          vx *= airResistance;
          vy *= airResistance;
          
          x += vx;
          y += vy;

          // Wall Constraints (Jar Shape)
          let currentWallPadding = HORIZONTAL_MARGIN;
          if (y > 180) currentWallPadding += (y - 180) * 0.22;
          
          const minX = currentWallPadding + radius;
          const maxX = JAR_WIDTH - currentWallPadding - radius;
          const maxY = BOTTOM_LIMIT - radius;
          const minY = TOP_LIMIT + radius;

          if (y > maxY) { y = maxY; vy *= -0.3; vx *= friction; }
          else if (y < minY) { y = minY; vy *= -0.3; }

          if (x < minX) { x = minX; vx *= -0.5; }
          else if (x > maxX) { x = maxX; vx *= -0.5; }

          return { ...obj, x, y, vx, vy, radius };
        });

        // 2. Resolve Overlaps (Collision Detection)
        // Run multiple iterations for stability
        for (let iter = 0; iter < 3; iter++) {
          for (let i = 0; i < next.length; i++) {
            for (let j = i + 1; j < next.length; j++) {
              const a = next[i];
              const b = next[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const minDistance = a.radius + b.radius;

              if (distance < minDistance) {
                // Collision normal
                const nx = dx / distance;
                const ny = dy / distance;
                const overlap = minDistance - distance;

                // Push them apart (50% each)
                const pushX = (overlap * nx) / 2;
                const pushY = (overlap * ny) / 2;

                a.x -= pushX;
                a.y -= pushY;
                b.x += pushX;
                b.y += pushY;

                // Basic impulse response
                const relativeVelocityX = b.vx - a.vx;
                const relativeVelocityY = b.vy - a.vy;
                const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

                // Do not resolve if velocities are separating
                if (velocityAlongNormal > 0) continue;

                const restitution = 0.2;
                const impulse = -(1 + restitution) * velocityAlongNormal;
                const impulseX = impulse * nx;
                const impulseY = impulse * ny;

                a.vx -= impulseX / 2;
                a.vy -= impulseY / 2;
                b.vx += impulseX / 2;
                b.vy += impulseY / 2;
              }
            }
          }
        }

        return next;
      });
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  useEffect(() => {
    const fetchSound = async () => {
      if (audioBufferRef.current || soundLoadingRef.current) return;
      soundLoadingRef.current = true;
      try {
        const audioData = await generateHuggingSound();
        if (audioData) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          audioContextRef.current = ctx;
          const base64Str = audioData.split(',')[1];
          const binaryString = atob(base64Str);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          const dataInt16 = new Int16Array(bytes.buffer);
          const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
          audioBufferRef.current = buffer;
        }
      } catch (err) {
        console.warn("Sound processing failed.");
      } finally {
        soundLoadingRef.current = false;
      }
    };
    fetchSound();
  }, []);

  const playHuggingSound = () => {
    if (audioContextRef.current && audioBufferRef.current) {
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    }
  };

  const handleMouseEnter = (crystalId: string) => {
    setHoveredCrystalId(crystalId);
    if (huggedIds.includes(crystalId)) playHuggingSound();
  };

  const hoveredCrystal = crystals.find(c => c.id === hoveredCrystalId);

  return (
    <div className="relative w-72 h-96 mx-auto group perspective-1000 select-none">
      {hoveredCrystal && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center animate-in fade-in zoom-in duration-300">
          {huggedIds.includes(hoveredCrystal.id) ? (
            <span className="text-[100px] drop-shadow-[0_0_40px_rgba(236,72,153,0.8)]">🤗</span>
          ) : hoveredCrystal.hasVoiceMessage ? (
            <span className="text-[100px] drop-shadow-[0_0_40px_rgba(59,130,246,0.8)]">🤫</span>
          ) : null}
        </div>
      )}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-12 border-2 border-amber-300/20 rounded-[100%] vessel-halo blur-[2px] -z-10 shadow-[0_0_20px_rgba(251,191,36,0.1)]"></div>
      <div 
        ref={containerRef}
        onClick={() => onClick()}
        className={`vessel-glass absolute inset-0 border-[3px] border-white/20 rounded-b-[100px] rounded-t-[50px] cursor-pointer transition-all duration-700 overflow-hidden
          ${isAbsorbing ? 'vessel-absorbing shadow-[0_0_60px_rgba(255,255,255,0.2)]' : 'shadow-2xl'}`}
      >
        {physicsObjects.map(obj => {
          const crystal = crystals.find(c => c.id === obj.id);
          const isVoiced = crystal?.hasVoiceMessage;
          const isHugged = huggedIds.includes(obj.id);
          const color = getCrystalColor(obj.type);
          return (
            <div
              key={obj.id}
              onMouseEnter={() => handleMouseEnter(obj.id)}
              onMouseLeave={() => setHoveredCrystalId(null)}
              onClick={(e) => { e.stopPropagation(); onClick(obj.id); }}
              className={`absolute rounded-full transition-shadow duration-300 cursor-pointer
                ${isVoiced ? 'voiced-glow' : isHugged ? 'hugged-glow' : 'hover:brightness-125'}
              `}
              style={{
                left: obj.x,
                top: obj.y,
                width: obj.radius * 2,
                height: obj.radius * 2,
                backgroundColor: color,
                transform: `translate(-50%, -50%)`,
                boxShadow: isVoiced || isHugged ? undefined : `0 0 ${obj.radius}px ${color.replace('0.8', '0.3')}`,
                zIndex: isVoiced || isHugged ? 20 : 10
              } as any}
            >
              <div className="absolute rounded-full bg-white/40 blur-[1px]" style={{ width: '25%', height: '25%', top: '15%', left: '15%' }}></div>
            </div>
          );
        })}
        {crystals.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 px-10 text-center space-y-4">
             <i className="fa-solid fa-moon text-3xl text-amber-100 animate-pulse"></i>
             <p className="font-cursive text-sm leading-relaxed">捕捉生活中的微光...</p>
          </div>
        )}
      </div>
      <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-40 h-12 bg-slate-900 rounded-[25px] border-x border-t border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
        <div className="w-16 h-1 bg-white/20 rounded-full blur-[1px]"></div>
      </div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-56 h-6 bg-black/40 blur-xl rounded-[100%]"></div>
    </div>
  );
};

export default CrystalJar;
