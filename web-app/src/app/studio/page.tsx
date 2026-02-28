"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Mic, CheckCircle2, Image as ImageIcon, Settings, Heart, LogOut, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaItem } from "@/lib/googlePhotos";
import { PhotoCard } from "@/components/PhotoCard";

export default function StudioDashboard() {
  const { data: session, status } = useSession();
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [harvestedMemories, setHarvestedMemories] = useState<any[]>([]);
  const [vaultMemories, setVaultMemories] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    // Only fetch photos if user is authenticated and we have an access token
    if (status === "authenticated") {
      const fetchPhotosAndVault = async () => {
        setLoadingPhotos(true);
        try {
          // Fetch Google Photos
          const resPhotos = await fetch('/api/photos');
          const dataPhotos = resPhotos.ok ? await resPhotos.json() : { mediaItems: [] };
          
          // Fetch Vault (memories in Firestore)
          const resVault = await fetch('/api/memories');
          const dataVault = resVault.ok ? await resVault.json() : { memories: [] };
          
          setVaultMemories(dataVault.memories || []);
          
          // Filter out photos that are already in the vault
          const vaultPhotoIds = new Set(dataVault.memories?.map((m: any) => m.id) || []);
          const pendingPhotos = (dataPhotos.mediaItems || []).filter((p: MediaItem) => !vaultPhotoIds.has(p.id));
          
          setPhotos(pendingPhotos);
        } catch (error) {
          console.error("Error fetching photos or vault:", error);
        } finally {
          setLoadingPhotos(false);
        }
      };

      const fetchHarvested = async () => {
        try {
          const res = await fetch('/api/harvested');
          if (res.ok) {
            const data = await res.json();
            setHarvestedMemories(data.harvested || []);
          }
        } catch (error) {
          console.error("Error fetching harvested memories:", error);
        }
      };

      fetchPhotosAndVault();
      fetchHarvested();
    }
  }, [status]);

  const handleVerify = async (id: string, action: 'verify' | 'reject') => {
    try {
      await fetch('/api/harvested', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      setHarvestedMemories(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Error updating memory:", err);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-600"><Loader2 className="w-8 h-8 animate-spin" /></div>;
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
            Sarah's Frame is Active
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
            <button 
              onClick={() => signOut()}
              className="text-gray-500 hover:text-red-500 transition-colors ml-2"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Memory Harvest Section */}
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
                  <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600">
                    <Mic className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">New insight from {memory.caretakerName || "a recent"} session</h3>
                    <ul className="text-gray-600 leading-relaxed list-disc list-inside ml-2">
                      {memory.facts?.map((fact: string, idx: number) => (
                        <li key={idx}>"{fact}"</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleVerify(memory.id, 'verify')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Verify & Save
                    </button>
                    <button 
                      onClick={() => handleVerify(memory.id, 'reject')}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Curation Queue */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-gray-800">Curation Queue</h2>
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {photos.length} Pending
            </span>
          </div>
          
          {loadingPhotos ? (
            <div className="py-12 flex justify-center items-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-500">
              No new photos in the shared album right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {photos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} onUploadSuccess={() => {
                  setPhotos(prev => prev.filter(p => p.id !== photo.id));
                  setVaultMemories(prev => [{
                    id: photo.id,
                    photoUrl: `${photo.baseUrl}=w1024-h1024-c`,
                    transcription: "Processing...",
                  }, ...prev]);
                }} />
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
          
          {loadingPhotos ? (
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
                <div key={memory.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="h-32 bg-gray-200 relative">
                    <img 
                      src={memory.photoUrl} 
                      alt="Vault memory" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-md text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <p className="text-sm text-gray-600 line-clamp-3 italic">"{memory.transcription}"</p>
                    <span className="text-xs text-gray-400 mt-auto">From: {memory.caretakerName || "Family"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Mobile Bottom Nav (visible only on small screens) */}
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
