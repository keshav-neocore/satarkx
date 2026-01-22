import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MapPin, Clock, CheckCircle, Play, Loader2, Trash2 } from 'lucide-react';
import { fetchUserReports, deleteUserReport, Report } from '../services/api';

const ReportsScreen: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserReports();
      setReports(data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
          try {
              const success = await deleteUserReport(id);
              if (success) {
                  setReports(prev => prev.filter(r => r.id !== id));
              }
          } catch (e) {
              console.error("Failed to delete", e);
          }
      }
  };

  return (
    <div className="h-full overflow-y-auto pb-32 px-4 pt-6">
      <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-mint-100 p-2 rounded-xl text-mint-600">
                <FileText size={24} strokeWidth={2.5} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800">My Reports</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{reports.length} SUBMISSIONS</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-mint-600 w-10 h-10 mb-2" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading History...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center text-center">
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <FileText size={32} className="text-gray-300" />
                </div>
                <p className="text-slate-500 font-bold text-sm">No reports yet</p>
                <p className="text-slate-400 text-[10px] px-6 mt-1 uppercase tracking-tight font-black">Help your community by reporting hazards around you!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4 relative group"
                >
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(report.id)}
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors z-10"
                    title="Delete Report"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                     {report.type === 'video' ? (
                        <>
                         <video src={report.url} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="bg-white/30 backdrop-blur-sm p-1.5 rounded-full">
                                <Play size={16} fill="white" className="text-white" />
                            </div>
                         </div>
                        </>
                     ) : (
                        <img src={report.url} alt="Report" className="w-full h-full object-cover" />
                     )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center pr-8">
                     <div className="flex justify-between items-start mb-1">
                         <div className="flex items-center gap-1.5">
                             {report.status === 'Verified' ? (
                                <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle size={10} /> VERIFIED
                                </span>
                             ) : (
                                <span className="bg-yellow-100 text-yellow-700 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock size={10} /> PENDING
                                </span>
                             )}
                         </div>
                         <span className="text-[10px] font-bold text-slate-400">{new Date(report.timestamp).toLocaleDateString()}</span>
                     </div>
                     
                     <div className="flex items-center gap-1 text-slate-500 mb-2">
                        <MapPin size={12} />
                        <span className="text-[10px] font-bold truncate max-w-[120px]">
                            {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                        </span>
                     </div>
                     
                     <div className="flex items-center gap-1">
                         <span className="text-xs font-black text-mint-600 bg-mint-50 px-2 py-1 rounded-lg border border-mint-100">
                            +{report.pointsEarned} Points
                         </span>
                     </div>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          )}
      </div>
    </div>
  );
};

export default ReportsScreen;