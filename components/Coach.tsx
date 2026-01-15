import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Type, FunctionDeclaration } from '@google/genai';
import { encodePCM, decodePCM, decodeAudioData } from '../services/geminiService';

const logWaterFunction: FunctionDeclaration = {
  name: 'logWater',
  parameters: {
    type: Type.OBJECT,
    description: 'Log an amount of water the user has consumed in milliliters.',
    properties: {
      amount: {
        type: Type.NUMBER,
        description: 'Amount of water in ml (e.g. 250, 500).'
      }
    },
    required: ['amount']
  }
};

interface CoachProps {
  onClose: () => void;
  onLogWater?: (amt: number) => void;
}

const Coach: React.FC<CoachProps> = ({ onClose, onLogWater }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Ready to chat');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const startSession = async () => {
    try {
      setStatus('Connecting...');
      // Initialize AI inside the function call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputNodeRef.current = audioContextRef.current.createGain();
      outputNodeRef.current.connect(audioContextRef.current.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      const inputContext = new AudioContext({ sampleRate: 16000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('Eyeing your food...');
            
            // Audio input
            const source = inputContext.createMediaStreamSource(stream);
            const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: encodePCM(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
              }));
            };
            source.connect(scriptProcessor);
            const silentNode = inputContext.createGain();
            silentNode.gain.value = 0;
            scriptProcessor.connect(silentNode);
            silentNode.connect(inputContext.destination);

            // Vision input (1 frame per second)
            frameIntervalRef.current = window.setInterval(() => {
              if (videoRef.current && canvasRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                canvas.width = 320; // Lower res for efficiency
                canvas.height = 240;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionPromise.then(s => s.sendRealtimeInput({
                    media: { data: base64, mimeType: 'image/jpeg' }
                  }));
                }
              }
            }, 1000);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodePCM(base64), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNodeRef.current!);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'logWater') {
                  const amt = (fc.args as any).amount;
                  if (onLogWater) onLogWater(amt);
                  console.debug(`System: Logged ${amt}ml water via voice.`);
                  sessionRef.current?.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { status: 'success' } }
                  });
                }
              }
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Coach Error:', e),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: 'You are an elite nutrition coach with vision. You can see what the user is showing you via camera. Be brief, encouraging, and sharp. Do not repeat back what the user says verbatim. If a user tells you they drank water, use the logWater tool to record it.',
          tools: [{ functionDeclarations: [logWaterFunction] }],
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('Error starting coach');
    }
  };

  const stopSession = () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    sessionRef.current?.close();
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsActive(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 text-white flex flex-col p-8 overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-emerald-400 italic">NutriVision Coach</h2>
          <p className="text-slate-400 text-sm">{status}</p>
        </div>
        <button onClick={stopSession} className="p-2 bg-white/10 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative gap-8">
        <div className="relative group">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-64 h-64 object-cover rounded-[2rem] border-4 border-emerald-500/30 bg-slate-900 transition-all duration-700 ${isActive ? 'scale-100' : 'scale-90 opacity-50'}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          {isActive && (
            <div className="absolute -inset-4 rounded-[2.5rem] border-2 border-emerald-500 animate-ping opacity-20 pointer-events-none" />
          )}
        </div>
        
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          {isActive ? (
             <div className="flex items-center gap-2">
               <div className="flex gap-1">
                 <div className="w-1.5 h-6 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_0ms]" />
                 <div className="w-1.5 h-6 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms]" />
                 <div className="w-1.5 h-6 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_400ms]" />
               </div>
               <span className="text-emerald-400 font-black uppercase tracking-widest text-xs">Listening...</span>
             </div>
          ) : (
            <p className="text-slate-500 text-sm">Face the camera towards your food to start the audit.</p>
          )}
        </div>
      </div>

      {!isActive && (
        <button 
          onClick={startSession}
          className="w-full bg-emerald-600 py-5 rounded-2xl font-black text-xl hover:bg-emerald-500 shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all active:scale-95 mb-8"
        >
          Activate Live Session
        </button>
      )}
      
      <div className="flex justify-center gap-4 text-slate-500">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
           <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Vision
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Bi-Directional Audio
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { height: 1.5rem; transform: translateY(0); }
          50% { height: 3rem; transform: translateY(-0.75rem); }
        }
      `}</style>
    </div>
  );
};

export default Coach;