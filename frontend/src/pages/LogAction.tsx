import { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import type { ActionCategory } from "../types";

const CATEGORIES: { value: ActionCategory; label: string }[] = [
  { value: "tree_planting", label: "🌳 Tree Planting" },
  { value: "waste_cleanup", label: "🗑️ Waste Cleanup" },
  { value: "recycling", label: "♻️ Recycling" },
  { value: "composting", label: "🌿 Composting" },
  { value: "water_conservation", label: "💧 Water Conservation" },
  { value: "energy_saving", label: "⚡ Energy Saving" },
  { value: "carpooling", label: "🚗 Carpooling" },
  { value: "public_transport", label: "🚌 Public Transport" },
  { value: "cycling", label: "🚴 Cycling" },
  { value: "sustainable_purchase", "label": "🛍️ Sustainable Purchase" },
  { value: "other", label: "✅ Other" },
];

const CITIES = ["Delhi", "Mumbai", "Chennai", "Pune"];

const UNITS: Record<ActionCategory, string> = {
  tree_planting: "saplings",
  waste_cleanup: "sessions/bags",
  recycling: "batches",
  composting: "setups/actions",
  water_conservation: "concrete actions",
  energy_saving: "concrete actions",
  carpooling: "trips",
  public_transport: "trips",
  cycling: "trips",
  sustainable_purchase: "purchases",
  other: "actions",
};

export default function LogAction() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialCommunityId = (location.state as any)?.community_id || null;
  const [communityId] = useState<string | null>(initialCommunityId);

  const [category, setCategory] = useState<ActionCategory>("tree_planting");
  const [quantity, setQuantity] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [city, setCity] = useState<string>("Mumbai");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleGenerateCaption = async () => {
    if (!file) return;

    // Check if it's an image, as the backend endpoint might not support video well
    if (!file.type.startsWith("image/")) {
      setError("AI captions currently only support images.");
      return;
    }

    setGeneratingCaption(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/actions/generate-caption", formData);
      if (res.data?.caption) {
        setDescription(res.data.caption);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate caption.");
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    if (!file) {
      setError("Please upload an image or video as evidence.");
      return;
    }

    const formData = new FormData();
    formData.append("category", category);
    formData.append("quantity", qty.toString());
    formData.append("quantity_unit", UNITS[category]);
    formData.append("description", description);
    formData.append("city", city);
    formData.append("file", file);
    if (communityId) {
      formData.append("community_id", communityId);
    }

    setSubmitting(true);
    try {
      await api.post("/actions/", formData);
      if (communityId) {
        navigate(`/communities/${communityId}`);
      } else {
        navigate("/feed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <header className="mb-10 flex items-center justify-between">
        <Link to="/" className="text-garden-olive/40 hover:text-garden-olive transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </Link>
        <h1 className="text-3xl font-black text-garden-olive tracking-tight font-creative italic text-center">New Action</h1>
        <button
          onClick={handleSubmit}
          disabled={submitting || !file || !quantity}
          className="font-black text-garden-purple text-sm uppercase tracking-widest disabled:opacity-30 active:scale-90 transition-transform"
        >
          {submitting ? "..." : "Share"}
        </button>
      </header>

      <main className="p-4">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload / Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative aspect-square w-full cursor-pointer overflow-hidden rounded-[3rem] bg-garden-cream/50 transition-all hover:bg-garden-cream border-2 border-dashed border-garden-lavender shadow-inner flex items-center justify-center group`}
          >
            {previewUrl ? (
              <>
                {file?.type.startsWith("video/") ? (
                  <video src={previewUrl} className="h-full w-full object-cover" controls />
                ) : (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition hover:opacity-100">
                  <p className="text-sm font-bold text-white">Change Media</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-garden-olive/40 group-hover:text-garden-olive transition-colors">
                <div className="h-20 w-20 rounded-full bg-white/50 flex items-center justify-center shadow-lg border border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                </div>
                <p className="font-black uppercase tracking-widest text-xs">Upload Evidence</p>
                <p className="text-[10px] font-medium italic opacity-60">Photo or Video is required</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>

          <div className="space-y-4">
            {/* Description / Caption */}
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the story of your eco-action..."
                className="w-full border-none bg-white/40 rounded-3xl p-6 text-sm focus:ring-2 focus:ring-garden-olive placeholder:text-garden-olive/30 shadow-inner"
                rows={4}
              />
              {file && file.type.startsWith("image/") && (
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={generatingCaption}
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2.5 text-[10px] font-black text-garden-olive ring-1 ring-garden-lavender shadow-lg backdrop-blur-md transition-all hover:bg-garden-olive hover:text-white disabled:opacity-50 active:scale-95"
                >
                  {generatingCaption ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-garden-olive border-t-transparent" />
                      <span className="uppercase tracking-widest">Growing...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">✨</span>
                      <span className="uppercase tracking-widest">AI Caption</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Category */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-garden-olive/40 ml-4">Action Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActionCategory)}
                className="w-full rounded-[2rem] border-none bg-white px-6 py-4 text-sm font-black text-garden-olive focus:ring-2 focus:ring-garden-olive shadow-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and City (Combined Row) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-garden-olive/40 ml-4">Quantity ({UNITS[category]})</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.0"
                  required
                  className="w-full rounded-[2rem] border-none bg-white px-6 py-4 text-sm font-black text-garden-olive focus:ring-2 focus:ring-garden-olive shadow-sm"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-garden-olive/40 ml-4">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-[2rem] border-none bg-white px-6 py-4 text-sm font-black text-garden-olive focus:ring-2 focus:ring-garden-olive shadow-sm"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-[2rem] bg-red-50 p-5 text-xs font-black text-red-600 border border-red-100 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
