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
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 px-4 py-4 backdrop-blur-md">
        <Link to="/" className="text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-terra-950">New EcoAction</h1>
        <button
          onClick={handleSubmit}
          disabled={submitting || !file || !quantity}
          className="font-bold text-terra-600 disabled:opacity-30"
        >
          {submitting ? "..." : "Share"}
        </button>
      </header>

      <main className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload / Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl bg-gray-100 transition hover:bg-gray-200 ${!previewUrl ? "border-2 border-dashed border-gray-300 flex items-center justify-center" : ""}`}
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
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <p className="font-bold">Upload Evidence</p>
                <p className="text-xs">Image or Video</p>
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
                placeholder="Write a caption about your eco-action..."
                className="w-full border-none bg-transparent px-0 py-2 text-sm focus:ring-0"
                rows={3}
              />
              {file && file.type.startsWith("image/") && (
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={generatingCaption}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-terra-50 px-3 py-1.5 text-[10px] font-bold text-terra-600 ring-1 ring-terra-200 transition-colors hover:bg-terra-100 focus:outline-none disabled:opacity-50"
                >
                  {generatingCaption ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-terra-600 border-t-transparent" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Auto-Caption</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Category */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActionCategory)}
                className="rounded-lg border-none bg-gray-50 px-3 py-1.5 text-xs font-semibold focus:ring-terra-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">Quantity ({UNITS[category]})</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.0"
                required
                className="w-24 rounded-lg border-none bg-gray-50 px-3 py-1.5 text-right text-xs font-semibold focus:ring-terra-400"
              />
            </div>

            {/* City Selection */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border-none bg-gray-50 px-3 py-1.5 text-xs font-semibold focus:ring-terra-400"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">
              {error}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
