"use client";

import Link from "next/link";
import { Heart, MonitorPlay, Sparkles, Users, ArrowRight, Activity, Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem("frame_token"));
  }, []);

  const handleFrameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasToken) {
      router.push("/frame");
    } else {
      router.push("/studio");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center font-sans overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100 rounded-full blur-[120px] opacity-60 mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-emerald-100 rounded-full blur-[120px] opacity-60 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-amber-100 rounded-full blur-[120px] opacity-60 mix-blend-multiply" />
      </div>

      <div className="max-w-6xl w-full px-6 py-12 md:py-16 relative z-10 flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-16 md:mb-20 flex flex-col items-center max-w-4xl">
          <div className="inline-flex items-center justify-center p-4 bg-white/80 backdrop-blur-xl rounded-full shadow-sm border border-white mb-6">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-100" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 mb-6 tracking-tight">
            Memory Portal
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Memory is a muscle. Connection is its fuel.
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-light max-w-3xl">
            Bridging generations with the power of Gemini Live AI. A gentle <span className="font-medium text-emerald-600">"gym for the mind"</span> that uses your family's stories to turn an ambient photo frame into an empathetic companion.
          </p>
        </div>

        {/* Action Cards (Moved to the Top) */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 w-full mb-20 md:mb-32">
          
          {/* Caretaker Studio Card */}
          <Link 
            href="/studio"
            className="group relative bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-white hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Caretaker Studio</h2>
                <span className="text-sm font-semibold text-emerald-600 uppercase tracking-widest">For The Family</span>
              </div>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-10 flex-1 text-lg">
              Curate the experience. Upload cherished photos, record voice notes, build a family knowledge graph, and review AI-generated emotional insights after conversations.
            </p>
            
            <div className="flex items-center justify-between text-sm mt-auto pt-6 border-t border-gray-100">
              <span className="font-semibold text-emerald-600 flex items-center gap-2 group-hover:gap-3 transition-all text-lg">
                Enter Studio <ArrowRight className="w-5 h-5" />
              </span>
              <span className="text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Demo Available
              </span>
            </div>
          </Link>

          {/* Magic Frame Card */}
          <button 
            onClick={handleFrameClick}
            className="group relative bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-amber-900/5 border border-white hover:shadow-2xl hover:shadow-amber-900/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col text-left text-inherit"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500 opacity-80 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform duration-500">
                <MonitorPlay className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Magic Frame</h2>
                <span className="text-sm font-semibold text-amber-600 uppercase tracking-widest">For Your Loved One</span>
              </div>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-10 flex-1 text-lg">
              An ambient digital photo frame that transforms with a single tap. It awakens a warm AI companion that knows the stories behind the pictures and guides fluid, real-time reminiscence.
            </p>
            
            <div className="flex items-center justify-between text-sm mt-auto pt-6 border-t border-gray-100">
              <span className={`font-semibold flex items-center gap-2 group-hover:gap-3 transition-all text-lg ${hasToken ? 'text-amber-600' : 'text-gray-400'}`}>
                {hasToken ? "Launch Frame" : "Setup Required"} <ArrowRight className="w-5 h-5" />
              </span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm border ${hasToken ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {hasToken ? "Ready to start" : "Click to setup via Studio"}
              </span>
            </div>
          </button>

        </div>

        {/* Feature Highlights (Moved to Bottom) */}
        <div className="w-full text-center mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Features designed for care</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full">
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-sm flex flex-col items-center text-center hover:bg-white/60 transition-colors">
            <div className="bg-rose-100/50 p-3 rounded-2xl mb-4 text-rose-600">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Combat Isolation</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Transforms a passive screen into an active, warm conversation partner, anytime.</p>
          </div>
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-sm flex flex-col items-center text-center hover:bg-white/60 transition-colors">
            <div className="bg-emerald-100/50 p-3 rounded-2xl mb-4 text-emerald-600">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Cognitive Exercise</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Encourages fluid reminiscence therapy using familiar faces and cherished family stories.</p>
          </div>
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-sm flex flex-col items-center text-center hover:bg-white/60 transition-colors">
            <div className="bg-indigo-100/50 p-3 rounded-2xl mb-4 text-indigo-600">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Caregiver Insights</h3>
            <p className="text-gray-600 text-sm leading-relaxed">AI distills emotional well-being from daily conversations, providing peace of mind.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
