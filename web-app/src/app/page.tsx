"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  Heart, Sparkles, Play, X, Loader2, MonitorPlay, LayoutDashboard,
  MessageCircleHeart, ArrowRight, ChevronDown, CheckCircle2
} from "lucide-react";

type DemoOverrides = {
  patient: string; spouse: string; caregiver: string;
  daughter: string; grandson: string; granddaughter: string; dog: string;
};

const DEFAULTS: DemoOverrides = {
  patient: "Thomas", spouse: "Martha", caregiver: "David",
  daughter: "Sarah", grandson: "Jake", granddaughter: "Emily", dog: "Buster"
};

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [overrides, setOverrides] = useState<DemoOverrides>({ patient: "", spouse: "", caregiver: "", daughter: "", grandson: "", granddaughter: "", dog: "" });

  // Redirect authenticated users straight to studio
  useEffect(() => {
    if (status === "authenticated") router.replace("/studio");
  }, [status, router]);

  const n = useCallback((key: keyof DemoOverrides) =>
    overrides[key].trim() || DEFAULTS[key], [overrides]);

  const encode = useCallback(() => {
    const active = Object.fromEntries(
      Object.entries(overrides).filter(([_, v]) => v.trim() !== "")
    );
    return Object.keys(active).length > 0 ? btoa(encodeURIComponent(JSON.stringify(active))) : null;
  }, [overrides]);

  const handleLaunchFrame = async () => {
    setLaunching(true);
    try {
      const res = await fetch("/api/demo-launch");
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      const encoded = encode();
      let url = `${window.location.origin}/frame?token=${token}`;
      if (encoded) url += `&demo_names=${encoded}`;
      window.open(url, "_blank");
      setLaunched(true);
    } catch {
      await signIn("credentials", { callbackUrl: "/studio" });
    } finally {
      setLaunching(false);
    }
  };

  const stories = [
    { emoji: "🔧", title: "The Mechanic's Legacy", body: `${n("grandson")} is rebuilding a car in the garage right now — using ${n("patient")}'s old silver wrenches. He has a photo of ${n("patient")}'s Mustang on the wall. He calls it his inspiration board.` },
    { emoji: "🎣", title: "The Patience Lesson", body: `${n("caregiver")} still lives by ${n("patient")}'s words from 1990: "Fishing isn't about the fish. It's about learning to be still."` },
    { emoji: "🥧", title: "The Apple Pie", body: `${n("daughter")}'s bakery sells out of "${n("patient")}'s Apple Pie" by 9am every morning. She named it after him. It's been a family recipe since 1965.` },
    { emoji: "⚾", title: "The Championship", body: `Before ${n("granddaughter")}'s final pitch, she closed her eyes and heard ${n("patient")}'s voice. After winning, her first call was to him.` },
  ];

  const prompts = [
    { say: `"I wonder what happened to my old tools."`, trigger: `AI shows ${n("grandson")}'s garage → photo switches autonomously` },
    { say: `"Tell me about the bakery."`, trigger: `AI recalls ${n("daughter")}'s pie named after ${n("patient")}` },
    { say: `"I miss ${n("spouse")}."`, trigger: `AI pivots warmly to a ${n("spouse")} memory` },
    { say: `"I'm getting tired now."`, trigger: `AI says goodbye & closes the session on its own` },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] overflow-x-hidden selection:bg-rose-200 selection:text-rose-900 font-sans">

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-100" />
          <span className="font-bold text-gray-900 tracking-tight">Memory Portal</span>
        </div>
        <button onClick={() => signIn("google")}
          className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1.5 transition-colors">
          Caregiver Login <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-rose-100 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob pointer-events-none" />
        <div className="absolute top-[10%] right-[-15%] w-[50%] h-[50%] bg-amber-100 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[20%] w-[60%] h-[60%] bg-emerald-100 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 animate-blob animation-delay-4000 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">

          {/* 1. Product Name — the anchor */}
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-100" />
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Memory Portal</span>
          </div>

          {/* 2. Credential badge */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
            Powered by Gemini Live AI
          </span>

          {/* 3. Tagline — soft, readable */}
          <p className="text-lg sm:text-xl text-gray-600 font-normal mb-10">
            Where stories come back to life
          </p>

          {/* 4. Emotional hook */}
          <h1 className="font-bold tracking-tight leading-snug mb-6 text-2xl sm:text-3xl md:whitespace-nowrap md:text-[clamp(1.4rem,2.8vw,2rem)]">
            <span className="text-gray-900 block">They don't need someone to remember <em className="not-italic">for</em> them.</span>
            <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent block">
              They need someone to remember <em className="not-italic">with</em> them.
            </span>
          </h1>
          <div className="text-base sm:text-lg text-gray-500 leading-relaxed mb-10 space-y-1 px-2 sm:px-0">
            <p>An AI companion that knows every photo, every name, and every story.</p>
            <p className="text-gray-500">So your loved one never has to reminisce alone.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setShowModal(true)}
              className="group flex items-center gap-3 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl text-lg">
              <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
              Watch the Magic Happen
            </button>
            <a href="#how-it-works" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium text-base transition-colors">
              See how it works <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Frame Mockup */}
        <div className="relative z-10 mt-14 w-full max-w-2xl mx-auto px-4">
          <div className="bg-black rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.3)] overflow-hidden border border-gray-700">
            <div className="relative h-72 sm:h-80">
              <img src="https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=900"
                className="w-full h-full object-cover opacity-60" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-4 right-4 bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-3.5 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex gap-0.5 items-end h-4">
                    {[3, 5, 7, 5, 3].map((h, i) => (
                      <div key={i} className="w-1 bg-emerald-400 rounded-full animate-pulse" style={{ height: `${h * 2}px`, animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">AI is speaking</span>
                </div>
                <p className="text-white/90 text-sm leading-relaxed italic">
                  "{n("patient")}, {n("caregiver")} told me you built that dock with your own hands back in 1988. I can only imagine how proud you must have felt the first time the whole family sat out there together."
                </p>
              </div>
            </div>
            <div className="bg-black px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Magic Frame · Reminiscing with {n("patient")}
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                <MessageCircleHeart className="w-3 h-3 text-rose-400" />
                <span className="text-white/50 text-[10px]">Live</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-10 bg-rose-300/30 blur-2xl rounded-full pointer-events-none" />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">How It Works</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-4 mb-3 tracking-tight">A self-improving loop of love.</h2>
            <p className="text-gray-500 max-w-md mx-auto">Four steps. Two people. One conversation that gets richer every single time.</p>
          </div>

          {/* Sequential flow */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute left-[2.25rem] top-12 bottom-12 w-px bg-gradient-to-b from-rose-200 via-amber-200 to-emerald-200" />

            <div className="space-y-6">
              {[
                {
                  step: "01",
                  who: "Caregiver",
                  whoColor: "text-emerald-600",
                  badge: "bg-emerald-50 border-emerald-200",
                  icon: "📸",
                  title: "Family uploads photos & stories",
                  body: `${n("caregiver")} uploads cherished family photos and records a quick voice note for each one — the story behind it, the names, the moment. The AI uses this as its memory.`,
                  accent: "border-l-emerald-400"
                },
                {
                  step: "02",
                  who: "Loved One",
                  whoColor: "text-rose-600",
                  badge: "bg-rose-50 border-rose-200",
                  icon: "🖼️",
                  title: `${n("patient")} sits with the Magic Frame`,
                  body: `The frame shows an ambient photo slideshow. ${n("patient")} taps Reminisce. The AI greets him by name, speaks first, and guides a warm voice conversation — no typing, no pressure.`,
                  accent: "border-l-rose-400"
                },
                {
                  step: "03",
                  who: "Gemini AI",
                  whoColor: "text-amber-600",
                  badge: "bg-amber-50 border-amber-200",
                  icon: "🧠",
                  title: "AI listens, adapts, and harvests",
                  body: `Mid-conversation, ${n("patient")} mentions his old tools. The screen instantly switches to ${n("grandson")}'s garage photo. After the session, the AI quietly distills new facts and feelings from the transcript.`,
                  accent: "border-l-amber-400"
                },
                {
                  step: "04",
                  who: "Caregiver",
                  whoColor: "text-emerald-600",
                  badge: "bg-emerald-50 border-emerald-200",
                  icon: "💌",
                  title: "Caregiver sees insights, loop repeats",
                  body: `${n("caregiver")} opens the Studio and sees what ${n("patient")} remembered today. The AI suggests which photos to upload next. Every session makes the next one richer.`,
                  accent: "border-l-emerald-400"
                },
              ].map(({ step, who, whoColor, badge, icon, title, body, accent }) => (
                <div key={step} className="flex gap-6 items-start">
                  {/* Step number circle */}
                  <div className="flex-shrink-0 w-[4.5rem] flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xl z-10">{icon}</div>
                    <span className="text-[10px] font-bold text-gray-300 tracking-widest">{step}</span>
                  </div>
                  {/* Card */}
                  <div className={`flex-1 bg-white border border-gray-100 border-l-4 ${accent} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${whoColor} bg-opacity-10 border px-2 py-0.5 rounded-full ${badge}`}>{who}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base mb-1.5">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Loop indicator */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
              <div className="flex items-center gap-2 bg-gradient-to-r from-rose-50 to-emerald-50 border border-gray-200 rounded-full px-5 py-2">
                <span className="text-sm font-semibold text-gray-600">↩ Then it repeats — getting smarter every time</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO SPLIT CTA ───────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#fafaf9]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">Try both sides of the experience.</h2>
          <p className="text-center text-gray-500 mb-10 text-sm max-w-lg mx-auto">No login needed for the Frame. One click to see the Studio.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-gray-900 rounded-3xl p-8 text-white flex flex-col gap-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Most Powerful</span>
                <h3 className="text-2xl font-bold mt-1 mb-2">Experience the Frame</h3>
                <p className="text-white/60 text-sm leading-relaxed">Become {n("patient")} for a few minutes. Have a real voice conversation with the AI. Watch it switch photos mid-sentence.</p>
              </div>
              <ul className="space-y-2 text-sm text-white/70 flex-1">
                {["Zero login required", "Real Gemini Live voice AI", "Photos switch autonomously mid-conversation", "Test barge-in: interrupt the AI and watch it stop"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <button onClick={() => setShowModal(true)}
                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2">
                <Play className="w-4 h-4 fill-white" /> Launch the Magic Frame
              </button>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-gray-200 flex flex-col gap-5 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Caregiver View</span>
                <h3 className="text-2xl font-bold mt-1 mb-2 text-gray-900">Explore the Studio</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Log in as a guest caregiver. See the memory vault, family graph, and real AI-generated insights from {n("patient")}'s sessions.</p>
              </div>
              <ul className="space-y-2 text-sm text-gray-500 flex-1">
                {["Pre-loaded with the Miller family story", "10 photos with deep caregiver context", "Family graph with 6 members built", "AI Insights dashboard pre-populated"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <button onClick={() => signIn("credentials", { callbackUrl: "/studio" })}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Open Demo Studio
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO FULL-SCREEN MODAL ───────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex overflow-hidden">

          {/* LEFT: Story Panel */}
          <div className="relative hidden lg:flex lg:w-[55%] flex-col overflow-y-auto bg-gray-900">

            <div className="relative z-10 flex flex-col h-full p-12 gap-8">
              <button onClick={() => setShowModal(false)}
                className="self-start flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm font-medium">
                <X className="w-4 h-4" /> Close
              </button>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-400 block mb-3">Live Demo Experience</span>
                <h2 className="text-5xl font-bold text-white leading-tight mb-2">Meet {n("patient")}.</h2>
                <p className="text-lg text-gray-400 font-light">82 years of stories. One conversation at a time.</p>
              </div>

              {/* Story cards — white background for maximum legibility */}
              <div className="grid grid-cols-2 gap-3">
                {stories.map(({ emoji, title, body }) => (
                  <div key={title} className="bg-white/[0.07] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.11] transition-colors">
                    <div className="text-xl mb-2">{emoji}</div>
                    <p className="text-white text-xs font-bold mb-1.5">{title}</p>
                    <p className="text-gray-300 text-xs leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400 whitespace-nowrap">Say these — watch the magic</p>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="space-y-2">
                  {prompts.map(({ say, trigger }) => (
                    <div key={say} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 hover:bg-white/[0.10] hover:border-white/20 transition-all">
                      <MessageCircleHeart className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-sm font-semibold leading-snug">{say}</p>
                        <p className="text-amber-400 text-[11px] mt-1 font-medium">{trigger}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-5 leading-relaxed border-t border-white/10 pt-4">
                  💡 While the AI is speaking, interrupt it out loud. It stops mid-sentence, listens, and responds naturally — that's the barge-in feature.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Personalize + Launch */}
          <div className="w-full lg:w-[45%] bg-[#fafaf9] flex flex-col overflow-y-auto relative">
            <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-rose-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-80 pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-amber-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-80 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full p-8 lg:p-12 gap-6">

              {/* Mobile close */}
              <button onClick={() => setShowModal(false)} className="self-end lg:hidden text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-full p-1.5">
                <X className="w-4 h-4" />
              </button>

              {/* Mobile story teaser */}
              <div className="lg:hidden bg-gray-900 rounded-2xl p-5 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1">Live Demo</span>
                <h3 className="text-xl font-bold mb-1">Meet {n("patient")}.</h3>
                <p className="text-white/50 text-xs leading-relaxed">The AI knows his whole family, his tools, his recipes, and the lessons he lived by. You're about to have a real conversation with it.</p>
              </div>

              {/* Post-launch success state */}
              {launched ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{n("patient")}'s story is open!</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                      Check the new tab — click <strong>Reminisce</strong>, put on headphones, and start talking.<br/><br/>
                      When you're ready, come back here to see what the caregiver sees after a session.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={() => signIn("credentials", { callbackUrl: "/studio" })}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2">
                      <LayoutDashboard className="w-5 h-5" /> Explore the Caretaker Studio
                    </button>
                    <p className="text-gray-400 text-xs">See AI insights, the memory vault, and the family graph</p>
                    <button onClick={() => { setLaunched(false); setShowModal(false); }}
                      className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
                      Back to the homepage
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-bold text-gray-900">Make it personal</h3>
                      <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2.5 py-1 rounded-full font-medium">Optional</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">Swap any names. The AI will use them as if it always knew your family.</p>
                    <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                      Nothing is ever saved
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {(["patient", "spouse", "caregiver", "daughter", "grandson", "granddaughter"] as const).map((key) => {
                      const meta: Record<string, {emoji: string; label: string}> = {
                        patient: { emoji: "👴", label: "The Loved One" }, spouse: { emoji: "💑", label: "The Spouse" },
                        caregiver: { emoji: "👨", label: "The Son" }, daughter: { emoji: "👩", label: "The Daughter" },
                        grandson: { emoji: "🔧", label: "The Grandson" }, granddaughter: { emoji: "⚾", label: "The Granddaughter" },
                      };
                      return (
                        <div key={key}>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{meta[key].emoji} {meta[key].label}</label>
                          <input type="text" placeholder={DEFAULTS[key]}
                            className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all"
                            value={overrides[key]}
                            onChange={(e) => setOverrides(prev => ({ ...prev, [key]: e.target.value }))} />
                        </div>
                      );
                    })}
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">🐶 The Family Dog</label>
                      <input type="text" placeholder={DEFAULTS.dog}
                        className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all"
                        value={overrides.dog}
                        onChange={(e) => setOverrides(prev => ({ ...prev, dog: e.target.value }))} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                    <button onClick={handleLaunchFrame} disabled={launching}
                      className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 disabled:opacity-70 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 text-base">
                      {launching ? <><Loader2 className="w-5 h-5 animate-spin" /> Opening Magic Frame…</> : <><Play className="w-5 h-5 fill-white" /> Begin {n("patient")}'s Story</>}
                    </button>
                    <p className="text-center text-gray-400 text-xs">Opens in a new tab · No account needed</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 font-medium">or</span><div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <button onClick={() => signIn("credentials", { callbackUrl: "/studio" })}
                      className="w-full bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm">
                      <LayoutDashboard className="w-4 h-4 text-emerald-500" /> Explore the Caretaker Studio
                    </button>
                    <p className="text-center text-gray-400 text-xs">See what caregivers see · Insights · Memory vault</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
