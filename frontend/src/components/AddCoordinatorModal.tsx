import { useState } from "react";
import api from "../services/api";

interface AddCoordinatorModalProps {
    communityId: string;
    onClose: () => void;
    onSuccess: (message: string) => void;
}

export default function AddCoordinatorModal({ communityId, onClose, onSuccess }: AddCoordinatorModalProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        try {
            setLoading(true);
            setError("");
            const res = await api.post(`/communities/${communityId}/coordinators`, { email });
            onSuccess(res.data.message);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to add coordinator. Double check the email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md scale-100 rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-terra-950">Add Coordinator</h2>
                    <button onClick={onClose} className="rounded-full bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                    Enter the email address of the user you want to appoint as a coordinator.
                    They must already have an EcoBytes account.
                </p>

                {error && (
                    <div className="mb-6 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 ring-1 ring-red-100 animate-in shake duration-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">User Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="eco.warrior@example.com"
                            className="w-full rounded-2xl bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 ring-1 ring-gray-100 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-terra-300"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="group relative w-full overflow-hidden rounded-2xl bg-terra-600 py-4 font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-terra-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            "Add Coordinator"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
