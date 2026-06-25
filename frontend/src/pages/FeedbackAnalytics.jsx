import { useState, useEffect } from "react";
import { Star, TrendingUp, Users, MessageSquare } from "lucide-react";
import { getAllFeedback, getFeedbackAnalytics } from "../api/endpoints";

export default function FeedbackAnalytics() {
  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedbackRes, analyticsRes] = await Promise.all([
          getAllFeedback(),
          getFeedbackAnalytics()
        ]);
        setFeedback(feedbackRes.data);
        setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error("Failed to fetch feedback data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Patient Satisfaction Analytics</h1>
        <p className="text-slate-500 mt-1">Monitor hospital performance and read patient reviews.</p>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Average Rating Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <h3 className="text-slate-500 font-semibold mb-2">Average Rating</h3>
            <div className="flex items-center gap-3">
              <span className="text-5xl font-extrabold text-slate-800">{analytics.average_rating.toFixed(1)}</span>
              <Star className="w-10 h-10 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-sm text-slate-400 mt-2">Out of 5.0</p>
          </div>

          {/* Total Reviews Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-50 p-4 rounded-full mb-3">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-slate-500 font-semibold mb-1">Total Reviews</h3>
            <span className="text-3xl font-extrabold text-slate-800">{analytics.total_reviews}</span>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Distribution
            </h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(star => {
                const count = analytics.rating_distribution[star] || 0;
                const percentage = analytics.total_reviews === 0 ? 0 : Math.round((count / analytics.total_reviews) * 100);
                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-12 font-medium text-slate-600 flex items-center gap-1">{star} <Star className="w-3 h-3 fill-amber-400 text-amber-400"/></span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-red-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-right text-slate-500 text-xs">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-500" /> Recent Patient Feedback
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {feedback.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No feedback submitted yet.</div>
          ) : (
            feedback.map(item => (
              <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{item.patient?.first_name} {item.patient?.last_name}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                {item.comments ? (
                  <p className="text-slate-600 mt-2 whitespace-pre-wrap">{item.comments}</p>
                ) : (
                  <p className="text-slate-400 mt-2 italic text-sm">No comments provided.</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
