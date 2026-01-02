import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Users,
  Book,
  DollarSign,
  Settings,
  Plus,
  ChevronRight,
  Check,
  Loader2,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import GoldFoil from "../components/ui/GoldFoil";
import { AppRoutes } from "../types";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

interface ClientSession {
  id: string;
  clientName: string;
  clientEmail: string;
  photoCount: number;
  createdAt: string;
  status: "pending" | "ready" | "ordered" | "delivered";
}

/**
 * PhotographerPortal - B2B Portal for Professional Photographers
 * Phase 3: The Tradition Ecosystem - Partner with studios to upsell storybooks
 */
const PhotographerPortal = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSession, setNewSession] = useState({
    clientName: "",
    clientEmail: "",
  });

  // Demo data for display
  const demoSessions: ClientSession[] = [
    {
      id: "1",
      clientName: "The Johnson Family",
      clientEmail: "johnson@example.com",
      photoCount: 45,
      createdAt: "2024-12-15",
      status: "ready",
    },
    {
      id: "2",
      clientName: "Emma & Michael Wedding",
      clientEmail: "emma.m@example.com",
      photoCount: 120,
      createdAt: "2024-12-20",
      status: "ordered",
    },
    {
      id: "3",
      clientName: "Baby Oliver Newborn",
      clientEmail: "olivers.parents@example.com",
      photoCount: 32,
      createdAt: "2024-12-28",
      status: "pending",
    },
  ];

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) {
        setSessions(demoSessions);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("photographer_sessions")
          .select("*")
          .eq("photographer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSessions(data || demoSessions);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setSessions(demoSessions);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  const handleCreateSession = async () => {
    if (!newSession.clientName || !newSession.clientEmail) return;

    // Demo mode: just add to local state
    const session: ClientSession = {
      id: Date.now().toString(),
      clientName: newSession.clientName,
      clientEmail: newSession.clientEmail,
      photoCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      status: "pending",
    };

    setSessions([session, ...sessions]);
    setNewSession({ clientName: "", clientEmail: "" });
    setShowNewSession(false);
  };

  const stats = [
    {
      label: "Active Sessions",
      value: sessions.length,
      icon: Camera,
      color: "text-emerald-600",
    },
    {
      label: "Books Created",
      value: sessions.filter(
        (s) => s.status === "ordered" || s.status === "delivered"
      ).length,
      icon: Book,
      color: "text-amber-600",
    },
    {
      label: "Revenue Share",
      value: "$1,240",
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      label: "Clients Served",
      value: sessions.length,
      icon: Users,
      color: "text-stone-600",
    },
  ];

  const statusColors = {
    pending: "bg-stone-100 text-stone-600",
    ready: "bg-amber-100 text-amber-700",
    ordered: "bg-emerald-100 text-emerald-700",
    delivered: "bg-emerald-200 text-emerald-800",
  };

  return (
    <div className="min-h-screen bg-stone-50 py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="text-amber-500" size={32} />
              <GoldFoil className="text-3xl md:text-4xl font-serif">
                Photographer Portal
              </GoldFoil>
            </div>
            <p className="text-stone-500 max-w-xl">
              Turn your photography sessions into premium storybooks. Upload
              client photos and let AI create magical keepsakes they'll treasure
              forever.
            </p>
          </div>
          <Button
            onClick={() => setShowNewSession(true)}
            icon={<Plus size={18} />}
          >
            New Client Session
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100"
            >
              <stat.icon className={`${stat.color} mb-3`} size={24} />
              <p className="text-2xl font-serif text-emerald-950 mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-stone-500 uppercase tracking-widest">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* New Session Modal */}
        {showNewSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewSession(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-serif text-emerald-950 mb-6">
                New Client Session
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={newSession.clientName}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        clientName: e.target.value,
                      })
                    }
                    placeholder="The Smith Family"
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-transparent rounded-xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-2">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={newSession.clientEmail}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        clientEmail: e.target.value,
                      })
                    }
                    placeholder="client@email.com"
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-transparent rounded-xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNewSession(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSession}
                  disabled={!newSession.clientName || !newSession.clientEmail}
                  icon={<Check size={18} />}
                  className="flex-1"
                >
                  Create Session
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Sessions List */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h2 className="text-xl font-serif text-emerald-950">
              Client Sessions
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="text-amber-500 animate-spin" size={32} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 px-6">
              <Camera className="mx-auto text-stone-300 mb-4" size={48} />
              <h3 className="text-xl font-serif text-emerald-950 mb-2">
                No sessions yet
              </h3>
              <p className="text-stone-500 mb-6 max-w-md mx-auto">
                Create your first client session to start turning your
                photography into premium storybooks.
              </p>
              <Button
                onClick={() => setShowNewSession(true)}
                icon={<Plus size={18} />}
              >
                Create First Session
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                        <Camera className="text-amber-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-emerald-950">
                          {session.clientName}
                        </h3>
                        <p className="text-sm text-stone-500">
                          {session.clientEmail} · {session.photoCount} photos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                          statusColors[session.status]
                        }`}
                      >
                        {session.status}
                      </span>
                      <span className="text-sm text-stone-400">
                        {session.createdAt}
                      </span>
                      <Link
                        to={`${AppRoutes.DIRECTOR}?session=${session.id}`}
                        className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                      >
                        <ChevronRight className="text-stone-400" size={20} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Info */}
        <div className="mt-12 bg-gradient-to-r from-emerald-900 to-emerald-950 rounded-3xl p-8 md:p-12 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <GoldFoil className="text-2xl font-serif mb-2 block">
                Earn 20% Commission
              </GoldFoil>
              <p className="text-emerald-100/70 max-w-lg">
                For every storybook your clients purchase, you earn a 20%
                commission. The average Heirloom edition ($200) earns you $40
                per sale.
              </p>
            </div>
            <Link to="#">
              <Button variant="secondary" icon={<Settings size={18} />}>
                Partner Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotographerPortal;
