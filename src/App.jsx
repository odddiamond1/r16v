import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Maximize, Rotate3D } from 'lucide-react';

export default function App() {
  // Application State: 'idle', 'inspecting', 'playing', 'paused'
  const [appState, setAppState] = useState('idle');
  const audioRef = useRef(null);

  // Audio Playback Handlers
  const handleStartPlay = () => {
    setAppState('playing');
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  };

  const togglePlay = () => {
    if (appState === 'playing') {
      setAppState('paused');
      if (audioRef.current) audioRef.current.pause();
    } else if (appState === 'paused') {
      setAppState('playing');
      if (audioRef.current) audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#ececec] flex items-center justify-center overflow-hidden font-sans select-none">
      {/* CSS for custom animations that are tricky to do purely with standard Tailwind classes */}
      <style>{`
        @keyframes spinRecord {
          from { transform: translateX(-50%) translateY(-50%) rotate(0deg); }
          to { transform: translateX(-50%) translateY(-50%) rotate(360deg); }
        }
        .vinyl-spin {
          animation: spinRecord 3.5s linear infinite;
        }
        .paused-spin {
          animation-play-state: paused;
        }
      `}</style>

      {/* Main Responsive Canvas - Acts as the fixed coordinate system */}
      <div className="relative w-full max-w-[1600px] shadow-2xl flex items-center justify-center">
        {/* Base Background Image */}
        <img 
          src="background.jpg" 
          className="w-full h-auto object-contain block pointer-events-none" 
          alt="Room Background" 
        />

        {/* --- RECORD PLAYER ELEMENTS --- */}
        
        {/* Vinyl Disc */}
        <div 
          className={`absolute z-10 w-[31.5%] aspect-square top-[50.5%] left-[43%] rounded-full shadow-2xl transition-opacity duration-700 ease-in-out origin-center ${
            (appState === 'playing' || appState === 'paused') ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${appState === 'playing' ? 'vinyl-spin' : 'vinyl-spin paused-spin'}`}
          style={{ transform: 'translateX(-50%) translateY(-50%)' }}
        >
          <img
            src="R16_Vinyl_Disc.jpg"
            className="w-full h-full object-cover rounded-full drop-shadow-2xl pointer-events-none"
            alt="Spinning Vinyl"
          />
        </div>

        {/* Player Arm */}
        {/* Transform Origin is set near the top of the arm image where the pivot cylinder is located */}
        <img
          src="Arm.png"
          className="absolute z-20 transition-transform duration-1000 ease-in-out drop-shadow-2xl pointer-events-none"
          style={{
            left: '56.2%', 
            top: '23%', 
            width: '6.5%',
            transformOrigin: '50% 12%',
            transform: (appState === 'playing' || appState === 'paused') 
              ? 'translate(-50%, -12%) rotate(22deg)' 
              : 'translate(-50%, -12%) rotate(-12deg)'
          }}
          alt="Player Arm"
        />

        {/* Interactive Play/Pause Toggle Area (Invisible button over the record player) */}
        {(appState === 'playing' || appState === 'paused') && (
          <div 
            className="absolute z-30 w-[35%] h-[50%] top-[25%] left-[25%] cursor-pointer group flex items-center justify-center"
            onClick={togglePlay}
          >
            <div className="bg-black/60 rounded-full p-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-90 group-hover:scale-100 shadow-xl backdrop-blur-sm">
              {appState === 'playing' ? <Pause size={48} /> : <Play size={48} className="ml-2" />}
            </div>
          </div>
        )}

        {/* --- RECORD CRATE ELEMENTS --- */}

        {/* Record Cover sitting on the crate */}
        <div
          className={`absolute z-10 shadow-xl cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-2xl group ${
            appState === 'inspecting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ 
            left: '71.4%', 
            top: '42.6%', 
            width: '21.6%', 
            aspectRatio: '1/1' 
          }}
          onClick={() => setAppState('inspecting')}
        >
          <img 
            src="R16_Vinyl_Front.jpg" 
            className="w-full h-full object-cover rounded-sm" 
            alt="Record Cover" 
          />
          {/* Hover Hint Overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white rounded-sm">
            <Maximize size={32} className="mb-2" />
            <span className="font-semibold tracking-wider text-sm uppercase">Inspect Record</span>
          </div>
        </div>
      </div>

      {/* --- 3D INSPECTION OVERLAY --- */}
      {appState === 'inspecting' && (
        <InspectModal 
          onClose={() => setAppState('idle')} 
          onPlay={handleStartPlay} 
        />
      )}

      {/* Audio Source: Using a high-quality royalty-free placeholder track. 
        In a real app, replace this src with your actual audio file URL.
      */}
      <audio 
        ref={audioRef} 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
        loop 
      />
    </div>
  );
}

// Sub-component for the Interactive 3D Vinyl Sleeve
function InspectModal({ onClose, onPlay }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const previousPointer = useRef({ x: 0, y: 0 });
  
  // Animation ref for smooth auto-rotation entry
  const [isAutoAnimating, setIsAutoAnimating] = useState(true);

  useEffect(() => {
    // Initial entrance animation
    const timer = setTimeout(() => {
      setRotation({ x: 15, y: -25 });
      setIsAutoAnimating(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePointerDown = (e) => {
    isDragging.current = true;
    setIsAutoAnimating(false);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    previousPointer.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - previousPointer.current.x;
    const deltaY = clientY - previousPointer.current.y;

    setRotation(prev => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.5)), // Clamp X rotation to prevent flipping upside down
      y: prev.y + deltaX * 0.5
    }));

    previousPointer.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e) => {
    setScale(prev => Math.min(Math.max(prev - e.deltaY * 0.002, 0.6), 2.5));
  };

  return (
    <div 
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Header / Controls */}
      <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center z-50">
        <div className="text-white/60 flex items-center gap-2">
          <Rotate3D size={20} />
          <span className="text-sm tracking-wide">Drag to rotate • Scroll to zoom</span>
        </div>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* 3D Object Container */}
      <div 
        className="relative w-64 md:w-96 aspect-square cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        style={{ perspective: '1200px' }}
      >
        <div 
          className="w-full h-full relative"
          style={{
            transformStyle: 'preserve-3d',
            transform: `scale(${scale}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: isAutoAnimating ? 'transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'transform 0.05s linear',
          }}
        >
          {/* Front of Cover */}
          <div 
            className="absolute inset-0 shadow-2xl rounded-sm border border-white/10"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <img src="R16_Vinyl_Front.jpg" className="w-full h-full object-cover rounded-sm pointer-events-none" alt="Cover Front" />
          </div>
          
          {/* Back of Cover */}
          <div 
            className="absolute inset-0 shadow-2xl rounded-sm border border-white/10"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <img src="R16_Vinyl_Back.png" className="w-full h-full object-cover rounded-sm pointer-events-none" alt="Cover Back" />
          </div>
        </div>
      </div>

      {/* Play Action Button */}
      <div className="absolute bottom-12 z-50">
        <button 
          onClick={onPlay}
          className="group relative flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
        >
          <Play fill="black" size={24} />
          PLAY RECORD
        </button>
      </div>
    </div>
  );
}