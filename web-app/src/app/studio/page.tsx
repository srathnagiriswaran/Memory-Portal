"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Mic, CheckCircle2, Image as ImageIcon, Settings, Heart, LogOut,
  Loader2, Upload, Plus, X, MonitorPlay, Trash2, Edit2, Sparkles, Camera, LayoutDashboard, Users,
  ArrowRight, Play, ChevronDown, MessageCircleHeart
} from "lucide-react";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PhotoCard, MemoryItem } from "@/components/PhotoCard";

function StudioDashboardInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [pendingMemories, setPendingMemories] = useState<MemoryItem[]>([]);
  const [vaultMemories, setVaultMemories] = useState<any[]>([]);
  const [harvestedMemories, setHarvestedMemories] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [patientName, setPatientName] = useState("");
  const [savedPatientName, setSavedPatientName] = useState("");
  const [savingPatient, setSavingPatient] = useState(false);
  
  const [invites, setInvites] = useState<any[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', relationship: 'Daughter', customRelationship: '', details: '' });
  const [addingFamily, setAddingFamily] = useState(false);

  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editMemoryText, setEditMemoryText] = useState("");
  
  const [editingHarvestId, setEditingHarvestId] = useState<string | null>(null);
  const [editHarvestFacts, setEditHarvestFacts] = useState<string[]>([]);
  
  const [insights, setInsights] = useState<{overallMood: string, currentFixations: string, uploadSuggestions: string[]} | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "vault" | "family" | "settings">("dashboard");
  const [isWelcomeBannerVisible, setIsWelcomeBannerVisible] = useState(true);

  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [demoLaunching, setDemoLaunching] = useState(false);
  const [demoOverrides, setDemoOverrides] = useState({
    patient: "",
    spouse: "",
    caregiver: "",
    daughter: "",
    grandson: "",
    granddaughter: "",
    dog: ""
  });

  const RELATIONSHIPS = ["Son", "Daughter", "Husband", "Wife", "Partner", "Brother", "Sister", "Grandson", "Granddaughter", "Friend", "Other"];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, activeRes, harvestRes, familyRes, patientRes, invitesRes] = await Promise.all([
        fetch("/api/memories?status=pending_voice"),
        fetch("/api/memories?status=active"),
        fetch("/api/harvested"),
        fetch("/api/family-graph"),
        fetch("/api/patient"),
        fetch("/api/invites"),
      ]);

      const pending = pendingRes.ok ? await pendingRes.json() : { memories: [] };
      const active = activeRes.ok ? await activeRes.json() : { memories: [] };
      const harvest = harvestRes.ok ? await harvestRes.json() : { harvested: [] };
      const family = familyRes.ok ? await familyRes.json() : { members: [] };
      const patient = patientRes.ok ? await patientRes.json() : { name: "" };
      const invitesData = invitesRes.ok ? await invitesRes.json() : { invites: [] };

      setPendingMemories(pending.memories || []);
      setVaultMemories(active.memories || []);
      setHarvestedMemories(harvest.harvested || []);
      setFamilyMembers(family.members || []);
      setPatientName(patient.name || "");
      setSavedPatientName(patient.name || "");
      setInvites(invitesData.invites || []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerateInsights = useCallback(async (isAuto = false) => {
    setGeneratingInsights(true);
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      if (res.ok && data.insights) {
        setInsights(data.insights);
        localStorage.setItem("caregiver_insights", JSON.stringify(data.insights));
        if (data.metadata) {
          localStorage.setItem("caregiver_insights_meta", JSON.stringify(data.metadata));
        }
        if (!isAuto) flash("Insights generated successfully!", "ok");
      } else {
        if (!isAuto) flash(data.message || data.error || "Failed to generate insights", "err");
      }
    } catch (err) {
      console.error(err);
      if (!isAuto) flash("Error generating insights", "err");
    } finally {
      setGeneratingInsights(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAll();

      // Auto-launch Magic Frame if redirected from the pre-login personalize flow
      const shouldLaunch = searchParams.get("launch_frame") === "1";
      if (shouldLaunch) {
        const demoNames = searchParams.get("demo_names");
        (async () => {
          try {
            const res = await fetch("/api/frame-setup");
            if (!res.ok) return;
            const data = await res.json();
            let url = `${window.location.origin}/frame?token=${data.token}`;
            if (demoNames) url += `&demo_names=${demoNames}`;
            window.open(url, "_blank");
            // Clean up URL so it doesn't re-launch on refresh
            window.history.replaceState({}, document.title, "/studio");
          } catch (err) {
            console.error("Auto-launch failed:", err);
          }
        })();
      }

      // Check if we should auto-generate new insights
      const checkInsightsAutoUpdate = async () => {
        try {
          const cached = localStorage.getItem("caregiver_insights");
          const cachedMetaStr = localStorage.getItem("caregiver_insights_meta");
          
          const res = await fetch("/api/insights?check=true");
          const data = await res.json();
          
          if (res.ok && data.totalValidSessions !== undefined) {
            let shouldUpdate = false;
            
            if (!cached || !cachedMetaStr) {
              // No cached insights, but there are sessions
              if (data.totalValidSessions > 0) shouldUpdate = true;
            } else {
              const cachedMeta = JSON.parse(cachedMetaStr);
              // If there are at least 2 new sessions since last generation
              if (data.totalValidSessions >= (cachedMeta.totalValidSessions || 0) + 2) {
                shouldUpdate = true;
              }
            }
            
            if (shouldUpdate) {
              handleGenerateInsights(true);
            }
          }
        } catch (e) {
          console.error("Failed to check insights auto-update", e);
        }
      };
      
      checkInsightsAutoUpdate();
    }
  }, [status, fetchAll, handleGenerateInsights]);

  useEffect(() => {
    // Load cached insights on initial mount
    const cached = localStorage.getItem("caregiver_insights");
    if (cached) {
      try {
        setInsights(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached insights", e);
      }
    }
    
    // Load welcome banner preference
    const bannerPref = localStorage.getItem("caregiver_welcome_banner");
    if (bannerPref === "hidden") {
      setIsWelcomeBannerVisible(false);
    }
  }, []);

  const dismissWelcomeBanner = () => {
    setIsWelcomeBannerVisible(false);
    localStorage.setItem("caregiver_welcome_banner", "hidden");
  };

  const flash = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) { flash("No valid images selected", "err"); return; }

    setUploading(true);
    let ok = 0;
    try {
      for (const file of images) {
        const form = new FormData();
        form.append("photo", file);
        const res = await fetch("/api/upload-photo", { method: "POST", body: form });
        if (res.ok) {
          const data = await res.json();
          setPendingMemories((prev) => [{ id: data.id, photoUrl: data.photoUrl, status: "pending_voice" }, ...prev]);
          ok++;
        } else {
          const err = await res.json().catch(() => ({}));
          console.error("Upload failed:", err);
          flash(err.error || `Upload failed (${res.status})`, "err");
        }
      }
      if (ok > 0) flash(`${ok} photo${ok > 1 ? "s" : ""} uploaded — record a voice anchor next!`);
    } catch (err: any) {
      console.error("Upload error:", err);
      flash(err.message || "Upload failed", "err");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, []);

  const handleVerify = async (id: string, action: "verify" | "reject", photoId?: string, facts?: string[]) => {
    try {
      await fetch("/api/harvested", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, photoId, facts }),
      });
      setHarvestedMemories((prev) => prev.filter((m) => m.id !== id));
      flash(action === 'verify' ? "Memory verified and saved!" : "Memory discarded");
      if (action === 'verify') {
        fetchAll(); // Refresh the vault to show the new memories
      }
    } catch (err) {
      console.error("Error updating memory:", err);
      flash("Failed to update memory", "err");
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingFamily(true);
    
    const finalRelationship = newFamilyMember.relationship === 'Other' 
      ? newFamilyMember.customRelationship 
      : newFamilyMember.relationship;
      
    try {
      const res = await fetch("/api/family-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFamilyMember.name,
          relationship: finalRelationship,
          details: newFamilyMember.details
        }),
      });
      if (res.ok) {
        setNewFamilyMember({ name: '', relationship: 'Daughter', customRelationship: '', details: '' });
        fetchAll(); // Refresh the list
        flash("Family member added successfully");
      } else {
        flash("Failed to add family member", "err");
      }
    } catch (err) {
      console.error("Error adding family member:", err);
      flash("Error adding family member", "err");
    } finally {
      setAddingFamily(false);
    }
  };

  const handleSavePatient = async () => {
    setSavingPatient(true);
    try {
      const res = await fetch("/api/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: patientName }),
      });
      if (res.ok) {
        setSavedPatientName(patientName);
        flash("Loved one's profile updated!");
      } else {
        flash("Failed to save profile", "err");
      }
    } catch (err) {
      console.error("Error saving patient:", err);
      flash("Failed to save profile", "err");
    } finally {
      setSavingPatient(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newInviteEmail }),
      });
      if (res.ok) {
        setNewInviteEmail("");
        fetchAll();
        flash("Caregiver invited successfully!");
      } else {
        const data = await res.json().catch(() => ({}));
        flash(data.error || "Failed to invite caregiver", "err");
      }
    } catch (err) {
      console.error("Error inviting:", err);
      flash("Failed to invite caregiver", "err");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveInvite = async (email: string) => {
    if (!confirm(`Remove access for ${email}?`)) return;
    try {
      const res = await fetch(`/api/invites?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInvites(prev => prev.filter(i => i.email !== email));
        flash("Access removed");
      } else {
        const data = await res.json().catch(() => ({}));
        flash(data.error || "Failed to remove access", "err");
      }
    } catch (err) {
      console.error("Error removing invite:", err);
      flash("Failed to remove access", "err");
    }
  };

  const handleDeleteFamilyMember = async (id: string) => {
    try {
      await fetch(`/api/family-graph?id=${id}`, { method: "DELETE" });
      setFamilyMembers(prev => prev.filter(m => m.id !== id));
      flash("Removed family member");
    } catch (err) {
      console.error("Error deleting family member:", err);
      flash("Failed to remove", "err");
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this memory from the Magic Frame?")) return;
    try {
      const res = await fetch(`/api/memories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setVaultMemories(prev => prev.filter(m => m.id !== id));
        flash("Memory deleted");
      } else {
        flash("Failed to delete memory", "err");
      }
    } catch (err) {
      console.error("Error deleting memory:", err);
      flash("Failed to delete memory", "err");
    }
  };

  const handleDeleteFact = async (memoryId: string, factIndex: number) => {
    if (!confirm("Are you sure you want to delete this insight? It will no longer be used as context for the AI.")) return;
    try {
      const memory = vaultMemories.find(m => m.id === memoryId);
      if (!memory) return;
      
      const updatedFacts = memory.learnedFacts.filter((_: any, idx: number) => idx !== factIndex);
      
      const res = await fetch('/api/memories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memoryId, learnedFacts: updatedFacts })
      });
      
      if (res.ok) {
        setVaultMemories(prev => prev.map(m => 
          m.id === memoryId ? { ...m, learnedFacts: updatedFacts } : m
        ));
        flash("Insight removed successfully");
      } else {
        flash("Failed to remove insight", "err");
      }
    } catch (err) {
      console.error("Error deleting fact:", err);
      flash("Failed to remove insight", "err");
    }
  };

  const startEditingMemory = (memory: any) => {
    setEditingMemoryId(memory.id);
    setEditMemoryText(memory.transcription || "");
  };

  const cancelEditingMemory = () => {
    setEditingMemoryId(null);
    setEditMemoryText("");
  };

  const handleSaveMemoryEdit = async (id: string) => {
    if (!editMemoryText.trim()) return;
    try {
      const res = await fetch("/api/upload-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId: id, transcription: editMemoryText.trim() })
      });

      if (res.ok) {
        setVaultMemories(prev => prev.map(m => m.id === id ? { ...m, transcription: editMemoryText.trim() } : m));
        setEditingMemoryId(null);
        flash("Memory context updated");
      } else {
        flash("Failed to update context", "err");
      }
    } catch (err) {
      console.error(err);
      flash("Failed to update context", "err");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] text-rose-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    // All demo & landing content lives at /  — redirect there
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }


  const launchMagicFrame = async (personalized = false) => {
    try {
      const res = await fetch("/api/frame-setup");
      if (!res.ok) throw new Error("Failed to get frame token");
      const data = await res.json();
      let url = `${window.location.origin}/frame?token=${data.token}`;
      
      if (personalized) {
        // Only include fields that the user actually typed in
        const activeOverrides = Object.fromEntries(
          Object.entries(demoOverrides).filter(([_, v]) => v.trim() !== "")
        );
        if (Object.keys(activeOverrides).length > 0) {
          // Use btoa safely with UTF-8
          const encoded = btoa(encodeURIComponent(JSON.stringify(activeOverrides)));
          url += `&demo_names=${encoded}`;
        }
      }
      
      window.open(url, "_blank");
      setShowPersonalizeModal(false);
    } catch (err) {
      console.error(err);
      flash("Failed to launch Magic Frame.", "err");
    }
  };


  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 font-sans selection:bg-rose-200 selection:text-rose-900 pb-24 relative overflow-hidden">
      {/* Abstract Blurred Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-[50%] h-[50%] bg-emerald-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-amber-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 text-rose-500">
          <Heart className="w-6 h-6 fill-rose-100" />
          <span className="font-bold text-xl tracking-tight text-gray-900">Memory Studio</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="hidden sm:flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            {patientName ? `${patientName}'s Frame is Active` : "Magic Frame is Active"}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium hidden sm:inline">{session?.user?.name}</span>
            {session?.user?.image ? (
              <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 border flex items-center justify-center">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
            )}
            <button onClick={() => signOut()} className="text-gray-500 hover:text-red-500 transition-colors ml-2" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Welcome Banner for First-Time Users / Judges */}
        {isWelcomeBannerVisible && (
          <div className="mb-8 bg-white/60 backdrop-blur-xl border border-white shadow-lg rounded-[2rem] p-6 relative group">
            <button 
              onClick={dismissWelcomeBanner}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-white/50 hover:bg-white p-1.5 rounded-full transition-all"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-rose-100 to-amber-100 p-3 rounded-2xl flex-shrink-0 shadow-sm border border-white">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-200" />
              </div>
              <div className="w-full pr-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">Welcome to the Caretaker Studio! 👋</h2>
                <p className="text-sm text-gray-700 mb-5 leading-relaxed">
                  This dashboard is where families curate the <strong>Magic Frame</strong> experience. You can upload cherished photos, add personal voice notes, build a family knowledge graph, and review AI-generated emotional insights after conversations.
                </p>
                
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <MonitorPlay className="w-4 h-4 text-emerald-600" />
                    Quick Start & Demo Guide
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 mb-1">1. Explore the Data</h4>
                      <p className="text-xs text-gray-600 mb-3">If you are in the <strong>Guest Demo</strong>, check out the pre-populated photos in the Vault and relatives in the Family Graph.</p>
                      <h4 className="text-xs font-semibold text-gray-900 mb-1">2. Launch the Magic Frame</h4>
                      <p className="text-xs text-gray-600 mb-3">Click below to open the Magic Frame in a new tab—exactly as your loved one would see it.</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => launchMagicFrame(false)}
                          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow flex items-center gap-2"
                        >
                          <MonitorPlay className="w-4 h-4" />
                          Launch Magic Frame
                        </button>
                        <button 
                          onClick={() => setShowPersonalizeModal(true)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Personalize Demo
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 mb-1">3. Test the Gemini Live AI</h4>
                      <p className="text-xs text-gray-600 mb-3">In the Frame, click <strong>Reminisce</strong>. Test the low-latency "barge-in" by interrupting the AI while it speaks!</p>
                      <h4 className="text-xs font-semibold text-gray-900 mb-1">4. Review Insights</h4>
                      <p className="text-xs text-gray-600">Come back here to the Overview tab and click <strong>Generate Insights</strong> to see AI-driven analysis of the conversation.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar mb-8">
          <div className="flex space-x-2 p-1 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all rounded-xl whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("vault")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all rounded-xl whitespace-nowrap ${
                activeTab === "vault"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Memory Vault
            </button>
            <button
              onClick={() => setActiveTab("family")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all rounded-xl whitespace-nowrap ${
                activeTab === "family"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              <Users className="w-4 h-4" />
              Family Graph
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all rounded-xl whitespace-nowrap ${
                activeTab === "settings"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        <div className="space-y-8">
        
        {/* === SETTINGS TAB === */}
        {activeTab === "settings" && (
          <>
        {/* Loved One Profile */}
            <section>
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-1">Loved One's Profile</h2>
              <p className="text-sm text-gray-600">Set the name of your loved one so the AI companion can address them warmly by name.</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <input
                type="text"
                placeholder="E.g. Grandpa"
                className="flex-1 sm:w-64 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
              <button
                onClick={handleSavePatient}
                disabled={savingPatient || patientName === savedPatientName}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {savingPatient ? <Loader2 className="w-5 h-5 animate-spin" /> : (patientName === savedPatientName && patientName !== "" ? "Saved ✓" : "Save")}
              </button>
            </div>
          </div>
        </section>

          </>
        )}

        {/* === DASHBOARD TAB === */}
        {activeTab === "dashboard" && (
          <>
        {/* AI Caregiver Insights */}
        <section>
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-medium text-indigo-900 mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  AI Caregiver Insights
                </h2>
                <p className="text-sm text-indigo-700">Analyze recent conversations from the Magic Frame to understand your loved one's emotional state and get AI-driven suggestions on what photos to upload next.</p>
              </div>
              <button
                onClick={() => handleGenerateInsights(false)}
                disabled={generatingInsights}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {generatingInsights ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {generatingInsights ? "Analyzing..." : "Generate Insights"}
              </button>
            </div>

            {insights && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-indigo-100/50">
                  <div className="flex flex-col gap-1 mb-3">
                    <div className="flex items-center gap-2 text-indigo-800">
                      <Heart className="w-5 h-5 fill-indigo-200" />
                      <h3 className="font-semibold">Overall Mood</h3>
                    </div>
                    <span className="text-[10px] text-indigo-600/70 font-medium uppercase tracking-wider">How are they feeling?</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{insights.overallMood}</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-indigo-100/50">
                  <div className="flex flex-col gap-1 mb-3">
                    <div className="flex items-center gap-2 text-indigo-800">
                      <Mic className="w-5 h-5" />
                      <h3 className="font-semibold">Recent Topics</h3>
                    </div>
                    <span className="text-[10px] text-indigo-600/70 font-medium uppercase tracking-wider">What's on their mind?</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{insights.currentFixations}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-indigo-100/50">
                  <div className="flex flex-col gap-1 mb-3">
                    <div className="flex items-center gap-2 text-indigo-800">
                      <Camera className="w-5 h-5" />
                      <h3 className="font-semibold">Upload Suggestions</h3>
                    </div>
                    <span className="text-[10px] text-indigo-600/70 font-medium uppercase tracking-wider">To Spark Joy Next Time</span>
                  </div>
                  <ul className="text-gray-700 text-sm leading-relaxed list-disc list-inside space-y-1">
                    {insights.uploadSuggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

          </>
        )}

        {activeTab === "settings" && (
          <>
        {/* Magic Frame Device Setup */}
        <section>
          <div className="bg-white/80 backdrop-blur-xl border border-white shadow-sm rounded-3xl overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-1">Magic Frame Setup</h2>
                <p className="text-sm text-gray-500">Launch the Magic Frame interface in a new tab to experience what your loved one will see.</p>
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                <button
                  onClick={() => launchMagicFrame(false)}
                  className="bg-white/80 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <MonitorPlay className="w-4 h-4" />
                  Launch Magic Frame
                </button>
                <button
                  onClick={() => setShowPersonalizeModal(true)}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  Personalize Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Caregiver Access */}
        <section>
          <div className="bg-white/80 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Caregiver Access
              </h2>
              <p className="text-sm text-gray-500">Invite other family members or caregivers to contribute photos, voice notes, and review AI insights together.</p>
            </div>
            
            <form onSubmit={handleInvite} className="flex w-full sm:w-auto gap-2">
              <input
                type="email"
                placeholder="caregiver@example.com"
                className="flex-1 sm:w-64 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={inviting || !newInviteEmail}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {inviting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Invite"}
              </button>
            </form>

            {invites.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Allowed Caregivers</h3>
                <ul className="space-y-2">
                  {invites.map((invite) => (
                    <li key={invite.email} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                      <span className="text-sm text-gray-600">{invite.email}</span>
                      <button
                        onClick={() => handleRemoveInvite(invite.email)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Remove Access"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

          </>
        )}

        {activeTab === "dashboard" && (
          <>
        {/* Memory Harvest */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-1 text-gray-800">Latest Memory Harvest</h2>
            <p className="text-sm text-gray-500">Review the memories and facts the AI has gently gathered during conversations. Verify them to enrich the Family Knowledge Graph and make future chats even more personal.</p>
          </div>
          {harvestedMemories.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white text-center text-gray-500">
              No new memories harvested yet. Start a session to see insights!
            </div>
          ) : (
            <div className="space-y-4">
              {harvestedMemories.map((memory) => (
                <div key={memory.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  {memory.photoUrl ? (
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={memory.photoUrl} alt="Memory context" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600 flex-shrink-0">
                      <Mic className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">Session Summary &amp; Extracted Memories</h3>
                    {memory.emotionalSummary && (
                      <div className="mb-4">
                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1 block">Conversation Vibe</span>
                        <p className="text-sm text-emerald-800 bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg italic">
                          {memory.emotionalSummary}
                        </p>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">New Facts Learned</span>
                    {editingHarvestId === memory.id ? (
                      <div className="space-y-2">
                        {editHarvestFacts.map((fact, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={fact}
                              onChange={(e) => {
                                const newFacts = [...editHarvestFacts];
                                newFacts[idx] = e.target.value;
                                setEditHarvestFacts(newFacts);
                              }}
                              className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
                            />
                            <button
                              onClick={() => setEditHarvestFacts(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setEditHarvestFacts(prev => [...prev, ""])}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Add fact
                        </button>
                      </div>
                    ) : (
                      <ul className="text-gray-600 text-sm leading-relaxed list-disc list-inside ml-1">
                        {memory.facts?.map((fact: string, idx: number) => (
                          <li key={idx}>&quot;{fact}&quot;</li>
                        ))}
                      </ul>
                    )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {editingHarvestId === memory.id ? (
                      <>
                        <button
                          onClick={() => {
                            const validFacts = editHarvestFacts.filter(f => f.trim() !== "");
                            handleVerify(memory.id, "verify", memory.photoId, validFacts);
                            setEditingHarvestId(null);
                          }}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Save &amp; Attach
                        </button>
                        <button
                          onClick={() => setEditingHarvestId(null)}
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingHarvestId(memory.id);
                            setEditHarvestFacts(memory.facts || []);
                          }}
                          className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <Edit2 className="w-4 h-4" />
                          Review &amp; Edit
                        </button>
                        <button
                          onClick={() => handleVerify(memory.id, "verify", memory.photoId, memory.facts)}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Quick Approve
                        </button>
                        <button
                          onClick={() => handleVerify(memory.id, "reject")}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          Discard
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

          </>
        )}

        {/* === FAMILY TAB === */}
        {activeTab === "family" && (
          <>
        {/* Family Knowledge Graph */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-medium text-gray-800">Family Knowledge Base</h2>
            <span className="text-sm text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">
              {familyMembers.length} Entries
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-6">Build a web of familiar faces and stories. The AI companion uses this graph to recognize names, understand relationships, and guide conversations with reassuring context.</p>
          
          <div className="bg-white/80 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Add New Context</h3>
            <form onSubmit={handleAddFamilyMember} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Name (e.g. Sarah)"
                  className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gray-900"
                  value={newFamilyMember.name}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, name: e.target.value })}
                  required
                />
                
                <select
                  className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gray-900 bg-white"
                  value={newFamilyMember.relationship}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, relationship: e.target.value })}
                >
                  {RELATIONSHIPS.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
                
                {newFamilyMember.relationship === 'Other' && (
                  <input
                    type="text"
                    placeholder="Custom Relationship"
                    className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gray-900"
                    value={newFamilyMember.customRelationship}
                    onChange={(e) => setNewFamilyMember({ ...newFamilyMember, customRelationship: e.target.value })}
                    required
                  />
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Details (e.g. loves gardening)"
                  className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gray-900"
                  value={newFamilyMember.details}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, details: e.target.value })}
                />
                <button
                  type="submit"
                  disabled={addingFamily}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {addingFamily ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Add Context"}
                </button>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : familyMembers.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-white shadow-sm text-gray-500">
              No family members added yet. Add some context to help the AI remember!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {familyMembers.map((member) => (
                <div key={member.id} className="bg-white/80 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-5 flex flex-col relative group">
                  <button 
                    onClick={() => handleDeleteFamilyMember(member.id)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h3 className="font-semibold text-gray-900 text-lg">{member.name}</h3>
                  <p className="text-sm font-medium text-rose-600 mb-2">{member.relationship}</p>
                  {member.details && (
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg mt-auto">"{member.details}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

          </>
        )}

        {/* === VAULT TAB === */}
        {activeTab === "vault" && (
          <>
        {/* Upload Zone */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-medium text-gray-800">Upload Photos</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Browse Files
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Add new moments to the Magic Frame. The AI will analyze the images and ask you for context so it can talk about them naturally.</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-sm font-medium">Uploading…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload className="w-10 h-10" />
                <p className="text-sm font-medium text-gray-600">Drag &amp; drop photos here, or click to browse</p>
                <p className="text-xs text-gray-400">JPG, PNG, HEIC — up to 10 MB each</p>
              </div>
            )}
          </div>
        </section>

        {/* Curation Queue */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-medium text-gray-800">Curation Queue</h2>
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {pendingMemories.length} Pending
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Photos waiting for your voice notes. Speak a memory about the photo to give the AI context before it appears on the Magic Frame.</p>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : pendingMemories.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-white shadow-sm text-gray-500">
              No photos waiting for voice anchors. Upload some above!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pendingMemories.map((memory) => (
                <PhotoCard
                  key={memory.id}
                  memory={memory}
                  onUploadSuccess={fetchAll}
                />
              ))}
            </div>
          )}
        </section>

        {/* Active Vault */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-medium text-gray-800">Active Vault</h2>
            <span className="text-sm text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">
              {vaultMemories.length} Active in Magic Frame
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            These photos are currently displayed on the Magic Frame. The <b>Captured Memories</b> attached to these photos give the AI companion rich context to personalize its conversations. You can easily edit or remove any facts you don't want the AI to mention.
          </p>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : vaultMemories.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-white shadow-sm text-gray-500">
              No photos in the vault yet. Upload voice notes to add them.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {vaultMemories.map((memory) => (
                <div key={memory.id} className="bg-white/80 backdrop-blur-xl border border-white shadow-sm rounded-3xl overflow-hidden flex flex-col group">
                  <div className="h-32 bg-gray-200 relative">
                    <img src={memory.photoUrl} alt="Vault memory" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-md text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </div>
                    <button 
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 backdrop-blur-md text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    {editingMemoryId === memory.id ? (
                      <div className="flex flex-col gap-2 h-full">
                        <textarea
                          className="w-full border rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none flex-1"
                          value={editMemoryText}
                          onChange={(e) => setEditMemoryText(e.target.value)}
                          placeholder="Type memory context..."
                        />
                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={cancelEditingMemory}
                            className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveMemoryEdit(memory.id)}
                            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm text-gray-600 line-clamp-3 italic">&quot;{memory.transcription}&quot;</p>
                          <button 
                            onClick={() => startEditingMemory(memory)}
                            className="text-gray-400 hover:text-emerald-600 transition-colors p-1"
                            title="Edit Context"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                        {memory.learnedFacts && memory.learnedFacts.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-xs font-medium text-emerald-700">Captured Memories:</span>
                            <ul className="text-xs text-gray-500 flex flex-col gap-1">
                              {memory.learnedFacts.map((fact: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1 group/fact">
                                  <span className="text-emerald-500 mt-0.5">•</span>
                                  <span className="line-clamp-2 flex-1">{fact}</span>
                                  <button
                                    onClick={() => handleDeleteFact(memory.id, idx)}
                                    className="opacity-0 group-hover/fact:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5"
                                    title="Remove this insight"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <span className="text-xs text-gray-400 mt-auto pt-2">From: {memory.caretakerName || "Family"}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </>
        )}
        </div>
      </main>

      {/* Personalize Demo Modal */}
      {showPersonalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full relative">
            <button 
              onClick={() => setShowPersonalizeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Make It Personal
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Let's map this story to your family for the demo. We won't save this data permanently.
            </p>
            
            <div className="space-y-3 mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Leave blank to keep the default name</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">👴 The Loved One</label>
                  <input 
                    type="text" 
                    placeholder="Default: Thomas"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={demoOverrides.patient}
                    onChange={(e) => setDemoOverrides(prev => ({ ...prev, patient: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">💑 The Spouse</label>
                  <input 
                    type="text" 
                    placeholder="Default: Martha"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={demoOverrides.spouse}
                    onChange={(e) => setDemoOverrides(prev => ({ ...prev, spouse: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">👨 The Son (Caregiver)</label>
                  <input 
                    type="text" 
                    placeholder="Default: David"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={demoOverrides.caregiver}
                    onChange={(e) => setDemoOverrides(prev => ({ ...prev, caregiver: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">👩 The Daughter (Baker)</label>
                  <input 
                    type="text" 
                    placeholder="Default: Sarah"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={demoOverrides.daughter}
                    onChange={(e) => setDemoOverrides(prev => ({ ...prev, daughter: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">🔧 The Grandson (Mechanic)</label>
                  <input 
                    type="text" 
                    placeholder="Default: Jake"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={demoOverrides.grandson}
                    onChange={(e) => setDemoOverrides(prev => ({ ...prev, grandson: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">⚾ The Granddaughter (Pitcher)</label>
                  <input 
                    type="text" 
                    placeholder="Default: Emily"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={demoOverrides.granddaughter}
                    onChange={(e) => setDemoOverrides(prev => ({ ...prev, granddaughter: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">🐶 The Family Dog</label>
                  <input 
                    type="text" 
                    placeholder="Default: Buster"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={demoOverrides.dog}
                    onChange={(e) => setDemoOverrides(prev => ({ ...prev, dog: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={() => launchMagicFrame(true)}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <MonitorPlay className="w-5 h-5" />
              Launch Personalized Frame
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white flex justify-around p-3 pb-safe z-50">
        <button className="flex flex-col items-center text-rose-500">
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Queue</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 hover:text-rose-500 transition-colors">
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-xs mt-1">Vault</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 hover:text-rose-500 transition-colors">
          <Settings className="w-6 h-6" />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default function StudioDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    }>
      <StudioDashboardInner />
    </Suspense>
  );
}
