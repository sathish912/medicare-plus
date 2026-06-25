import { useState } from "react";
import { Star, MessageSquareHeart, CheckCircle } from "lucide-react";
import { submitFeedback } from "../api/endpoints";
import toast from "react-hot-toast";

export default function SubmitFeedback() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    try {
      await submitFeedback({ rating, comments });
      setSubmitted(true);
      toast.success("Feedback submitted!");
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto mt-16 p-8 bg-white rounded-3xl shadow-xl text-center border border-slate-100">
        <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Thank You!</h2>
        <p className="text-slate-600 text-lg mb-8">Your feedback helps us continuously improve our patient care.</p>
        <button 
          onClick={() => { setSubmitted(false); setRating(0); setComments(""); }}
          className="px-6 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors"
        >
          Submit Another Review
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white">
          <MessageSquareHeart className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">How was your experience?</h1>
          <p className="opacity-90">We value your feedback and use it to enhance our services.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Star Rating */}
            <div className="text-center">
              <label className="block text-lg font-semibold text-slate-700 mb-4">Rate Your Visit</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-12 h-12 ${
                        (hoverRating || rating) >= star 
                          ? "fill-amber-400 text-amber-400" 
                          : "text-slate-300"
                      } transition-colors`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-sm mt-3 font-medium">
                {rating === 1 && "Very Dissatisfied"}
                {rating === 2 && "Dissatisfied"}
                {rating === 3 && "Neutral"}
                {rating === 4 && "Satisfied"}
                {rating === 5 && "Very Satisfied"}
                {!rating && "Click to rate"}
              </p>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Comments (Optional)</label>
              <textarea
                className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                rows="4"
                placeholder="Tell us what you loved, or how we can improve..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            >
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
