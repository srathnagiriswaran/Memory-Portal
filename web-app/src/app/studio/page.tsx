"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Mic, CheckCircle2, Image as ImageIcon, Settings, Heart, LogOut,
  Loader2, Upload, Plus, X, MonitorPlay, Trash2, Edit2
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { PhotoCard, MemoryItem } from "@/components/PhotoCard";

export default function StudioDashboard() {
  const { data: session, status } = useSession();
  const [pendingMemories, setPendingMemories] = useState<MemoryItem[]>([]);
  const [vaultMemories, setVaultMemories] = useState<any[]>([]);
  const [harvestedMemories, setHarvestedMemories] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [patientName, setPatientName] = useState("");
  const [savedPatientName, setSavedPatientName] = useState("");
  const [savingPatient, setSavingPatient] = useState(false);
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

  const RELATIONSHIPS = ["Son", "Daughter", "Husband", "Wife", "Partner", "Brother", "Sister", "Grandson", "Granddaughter", "Friend", "Other"];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, activeRes, harvestRes, familyRes, patientRes] = await Promise.all([
        fetch("/api/memories?status=pending_voice"),
        fetch("/api/memories?status=active"),
        fetch("/api/harvested"),
        fetch("/api/family-graph"),
        fetch("/api/patient"),
      ]);

      const pending = pendingRes.ok ? await pendingRes.json() : { memories: [] };
      const active = activeRes.ok ? await activeRes.json() : { memories: [] };
      const harvest = harvestRes.ok ? await harvestRes.json() : { harvested: [] };
      const family = familyRes.ok ? await familyRes.json() : { members: [] };
      const patient = patientRes.ok ? await patientRes.json() : { name: "" };

      setPendingMemories(pending.memories || []);
      setVaultMemories(active.memories || []);
      setHarvestedMemories(harvest.harvested || []);
      setFamilyMembers(family.members || []);
      setPatientName(patient.name || "");
      setSavedPatientName(patient.name || "");
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchAll();
  }, [status, fetchAll]);

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
        flash("Patient profile updated!");
      } else {
        flash("Failed to save patient", "err");
      }
    } catch (err) {
      console.error("Error saving patient:", err);
      flash("Failed to save patient", "err");
    } finally {
      setSavingPatient(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <Heart className="w-12 h-12 text-emerald-500 mx-auto mb-4 fill-current" />
          <h1 className="text-2xl font-semibold mb-2 text-gray-900">Caretaker Studio</h1>
          <p className="text-gray-600 mb-8">Sign in with Google to manage memories and settings for the Magic Frame.</p>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const generateFrameLink = async () => {
    try {
      const res = await fetch("/api/frame-setup");
      if (!res.ok) throw new Error("Failed to get frame token");
      const data = await res.json();
      const url = `${window.location.origin}/frame?token=${data.token}`;
      navigator.clipboard.writeText(url);
      flash("Secure Magic Frame link copied to clipboard! Open it on the tablet.", "ok");
    } catch (err) {
      console.error(err);
      flash("Failed to generate Magic Frame link.", "err");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-emerald-600">
          <Heart className="w-6 h-6 fill-current" />
          <span className="font-semibold text-xl tracking-tight text-gray-900">Memory Studio</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {patientName ? `${patientName}'s Frame is Active` : "Magic Frame is Active"}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium hidden sm:inline">{session?.user?.name}</span>
            {session?.user?.image ? (
              <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border" />
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

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Patient Profile */}
        <section>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium text-emerald-900 mb-1">Patient Profile</h2>
              <p className="text-sm text-emerald-700">Set the name of the person using the Magic Frame so the AI knows who it&apos;s talking to.</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <input
                type="text"
                placeholder="E.g. Grandpa John"
                className="flex-1 sm:w-64 border border-emerald-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
              <button
                onClick={handleSavePatient}
                disabled={savingPatient || patientName === savedPatientName}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {savingPatient ? <Loader2 className="w-5 h-5 animate-spin" /> : (patientName === savedPatientName && patientName !== "" ? "Saved ✓" : "Save")}
              </button>
            </div>
          </div>
        </section>

        {/* Magic Frame Device Setup */}
        <section>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-1">Magic Frame Setup</h2>
              <p className="text-sm text-gray-500">Generate a secure, one-time link to authorize the patient&apos;s tablet.</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={generateFrameLink}
                className="bg-white border-2 border-emerald-100 hover:bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <MonitorPlay className="w-4 h-4" />
                Copy Setup Link
              </button>
            </div>
          </div>
        </section>

        {/* Memory Harvest */}
        <section>
          <h2 className="text-xl font-medium mb-4 text-gray-800">Latest Memory Harvest</h2>
          {harvestedMemories.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
              No new memories harvested yet. Start a session to see insights!
            </div>
          ) : (
            <div className="space-y-4">
              {harvestedMemories.map((memory) => (
                <div key={memory.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
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
                    <h3 className="font-medium text-gray-900 mb-1">New insight from {memory.caretakerName || "a recent"} session</h3>
                    {memory.emotionalSummary && (
                      <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg mb-3 italic">
                        {memory.emotionalSummary}
                      </p>
                    )}
                    
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
                              className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500"
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
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {editingHarvestId === memory.id ? (
                      <>
                        <button
                          onClick={() => {
                            const validFacts = editHarvestFacts.filter(f => f.trim() !== "");
                            handleVerify(memory.id, "verify", memory.photoId, validFacts);
                            setEditingHarvestId(null);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
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
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
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

        {/* Family Knowledge Graph */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-gray-800">Family Knowledge Base</h2>
            <span className="text-sm text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
              {familyMembers.length} Entries
            </span>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Add New Context</h3>
            <form onSubmit={handleAddFamilyMember} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Name (e.g. Sarah)"
                  className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  value={newFamilyMember.name}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, name: e.target.value })}
                  required
                />
                
                <select
                  className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white"
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
                    className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
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
                  className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  value={newFamilyMember.details}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, details: e.target.value })}
                />
                <button
                  type="submit"
                  disabled={addingFamily}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
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
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-500">
              No family members added yet. Add some context to help the AI remember!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {familyMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col relative group">
                  <button 
                    onClick={() => handleDeleteFamilyMember(member.id)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h3 className="font-semibold text-gray-900 text-lg">{member.name}</h3>
                  <p className="text-sm font-medium text-emerald-600 mb-2">{member.relationship}</p>
                  {member.details && (
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg mt-auto">"{member.details}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upload Zone */}
        <section>
          <div className="flex items-center justify-between mb-4">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-gray-800">Curation Queue</h2>
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {pendingMemories.length} Pending
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : pendingMemories.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-500">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-gray-800">Active Vault</h2>
            <span className="text-sm text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
              {vaultMemories.length} Active in Magic Frame
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : vaultMemories.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-500">
              No photos in the vault yet. Upload voice notes to add them.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {vaultMemories.map((memory) => (
                <div key={memory.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
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
                          className="w-full border rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none flex-1"
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
                        <span className="text-xs text-gray-400 mt-auto">From: {memory.caretakerName || "Family"}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 pb-safe z-50">
        <button className="flex flex-col items-center text-emerald-600">
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Queue</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 hover:text-emerald-600 transition-colors">
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-xs mt-1">Vault</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 hover:text-emerald-600 transition-colors">
          <Settings className="w-6 h-6" />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </nav>
    </div>
  );
}
