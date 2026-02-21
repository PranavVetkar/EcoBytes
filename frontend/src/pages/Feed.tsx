import { useEffect, useState } from "react";
import api from "../services/api";
import { getCurrentUser } from "../services/auth";

function SocialPost({ post, onDelete }: { post: any; onDelete: (id: string) => void }) {
  const [liked, setLiked] = useState(false);
  const user = getCurrentUser();
  const isAuthor = user?.uid === post.author_id;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this eco-action? This cannot be undone.")) return;
    try {
      await api.delete(`/actions/${post.id}`);
      onDelete(post.id);
    } catch (err: any) {
      alert("Failed to delete post: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-terra-400 to-earth-200 flex items-center justify-center text-terra-900 font-black shadow-sm">
            {post.author_name?.charAt(0) || post.author_id?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-terra-950">{post.author_name || "EcoWarrior"} {isAuthor && <span className="text-[10px] text-terra-500 font-normal ml-1">(You)</span>}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
              {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : "Just now"}
            </span>
          </div>
        </div>

        {isAuthor && (
          <button
            onClick={handleDelete}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-500 hover:text-white ring-1 ring-red-100"
            title="Delete post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6m4-11v0m-4 0v0m4 11v-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Post Image/Video */}
      <div className="aspect-square w-full bg-gray-50">
        {post.video_url ? (
          <video src={post.video_url} className="h-full w-full object-cover" controls />
        ) : post.image_url ? (
          <img src={post.image_url} alt="Eco Action" className="h-full w-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4 pt-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center justify-center h-10 w-10 rounded-full transition-all active:scale-90 ${liked ? "bg-red-50 text-red-500 ring-1 ring-red-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
            <button className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-earth-50 px-3 py-1.5 ring-1 ring-earth-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-earth-600">
              {post.category?.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <p className="text-sm font-black text-terra-950 mb-1.5">{((post.likes_count || 0) + (liked ? 1 : 0)).toLocaleString()} likes</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-black mr-2 text-terra-900">{post.author_name || "EcoWarrior"}</span>
          {post.description}
        </p>
        <p className="mt-2 text-[10px] uppercase font-bold tracking-widest text-terra-500">
          Impact: <span className="text-gray-500">{post.quantity} {post.quantity_unit}</span>
        </p>
      </div>
    </div>
  );
}

const HARDCODED_POSTS = [
  {
    id: "p1",
    author_name: "GreenGuardian",
    image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?auto=format&fit=crop&w=800&q=80",
    category: "Tree Planting",
    description: "Just planted 5 saplings today at the neighborhood park! 🌳 Every small step counts towards a greener future. #EcoWarrior #TreePlanting",
    likes_count: 42,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    quantity: 5,
    quantity_unit: "trees",
  },
  {
    id: "p2",
    author_name: "SolarSolace",
    image_url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80",
    category: "Energy Saving",
    description: "Finally installed solar panels! Excited to reduce my carbon footprint and save on energy bills. ☀️⚡",
    likes_count: 156,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    quantity: 1,
    quantity_unit: "system",
  },
  {
    id: "p3",
    author_name: "OceanDefender",
    image_url: "https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=800&q=80",
    category: "Waste Cleanup",
    description: "Morning beach cleanup at Marine Drive. Collected 3 bags of plastic waste! Let's keep our oceans clean. 🌊🐚",
    likes_count: 89,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    quantity: 3,
    quantity_unit: "bags",
  },
];

export default function Feed() {
  const [posts, setPosts] = useState<any[]>(HARDCODED_POSTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await api.get<{ items: any[] }>("/feed/");
        // Append fetched real posts to the top of the hardcoded ones
        setPosts([...res.data.items, ...HARDCODED_POSTS]);
      } catch (err) {
        console.error("Failed to fetch feed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-terra-600">
            <span className="font-black text-white text-xs">EB</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-terra-950">EcoBytes</h1>
        </div>
        <button className="text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </button>
      </header>

      <main className="p-4 pb-20">
        {loading && posts.length === HARDCODED_POSTS.length ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-terra-500 border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-400">No eco-actions yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map((post) => (
            <SocialPost key={post.id} post={post} onDelete={handleDelete} />
          ))
        )}
      </main>
    </div>
  );
}
