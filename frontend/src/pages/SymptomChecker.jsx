import { useState } from "react";
import { Activity, AlertTriangle, ArrowRight, CheckCircle, ChevronLeft, Loader2, Search } from "lucide-react";
import { checkSymptoms } from "../api/endpoints";
import { Link } from "react-router-dom";

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Headache", "Nausea", "Vomiting", 
  "Fatigue", "Shortness of breath", "Chest pain", 
  "Dizziness", "Stomach ache", "Rash", "Joint pain", "Muscle pain"
];

const DURATIONS = [
  "Less than 24 hours",
  "1-3 days",
  "4-7 days",
  "1-2 weeks",
  "More than 2 weeks",
  "More than a month"
];

export default function SymptomChecker() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    main_symptom: "",
    other_symptoms: [],
    duration: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleSymptom = (symp) => {
    setFormData(prev => {
      if (prev.other_symptoms.includes(symp)) {
        return { ...prev, other_symptoms: prev.other_symptoms.filter(s => s !== symp) };
      } else {
        return { ...prev, other_symptoms: [...prev.other_symptoms, symp] };
      }
    });
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setStep(4);
    try {
      const res = await checkSymptoms(formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <Activity className="w-8 h-8 text-primary-600" />
          AI Symptom Checker
        </h1>
        <p className="text-slate-500 mt-2">Describe your symptoms to receive an AI-powered triage and department recommendation.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-600">Step {step} of 4</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-2 w-8 rounded-full ${step >= i ? "bg-primary-500" : "bg-slate-200"}`} />
            ))}
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800">What is your main symptom?</h2>
              <p className="text-slate-500 text-sm">Briefly describe the primary issue you are experiencing.</p>
              <textarea
                className="input-field min-h-[120px] text-lg"
                placeholder="e.g., Severe headache and dizziness..."
                value={formData.main_symptom}
                onChange={e => setFormData({ ...formData, main_symptom: e.target.value })}
                autoFocus
              />
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleNext} 
                  disabled={!formData.main_symptom.trim()}
                  className="btn-primary flex items-center gap-2 px-8"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800">Any other symptoms?</h2>
              <p className="text-slate-500 text-sm">Select any additional symptoms that apply, or skip if none.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COMMON_SYMPTOMS.map(symp => {
                  const isSelected = formData.other_symptoms.includes(symp);
                  return (
                    <button
                      key={symp}
                      onClick={() => toggleSymptom(symp)}
                      className={`px-4 py-3 text-sm rounded-xl border text-left transition-all ${
                        isSelected 
                          ? "border-primary-500 bg-primary-50 text-primary-700 font-medium" 
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {symp}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleNext} className="btn-primary flex items-center gap-2 px-8">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800">How long have you had these symptoms?</h2>
              
              <div className="space-y-3">
                {DURATIONS.map(dur => (
                  <label key={dur} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${formData.duration === dur ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="duration" 
                      value={dur}
                      checked={formData.duration === dur}
                      onChange={() => setFormData({ ...formData, duration: dur })}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={formData.duration === dur ? 'font-medium text-primary-700' : 'text-slate-700'}>{dur}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={!formData.duration}
                  className="btn-primary flex items-center gap-2 px-8"
                >
                  Analyze Symptoms <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-primary-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <h3 className="text-lg font-medium text-slate-700">Analyzing your symptoms...</h3>
                  <p className="text-sm text-slate-500">Checking medical knowledge base</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {/* Triage Level */}
                  <div className={`p-6 rounded-2xl border flex items-start gap-4 ${
                    result.triage_level === 'Emergency' ? 'bg-red-50 border-red-200 text-red-800' :
                    result.triage_level === 'Urgent' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                    'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {result.triage_level === 'Routine' ? <CheckCircle className="w-8 h-8 shrink-0" /> : <AlertTriangle className="w-8 h-8 shrink-0" />}
                    <div>
                      <h3 className="font-bold text-lg mb-1">{result.triage_level} Triage</h3>
                      <p className="text-sm opacity-90 leading-relaxed">{result.advice}</p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center space-y-4">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Recommended Specialist</p>
                    <h2 className="text-3xl font-bold text-slate-800">{result.recommended_department.replace('_', ' ')}</h2>
                    <div className="pt-4 flex justify-center gap-4">
                      <button 
                        onClick={() => {
                          setStep(1);
                          setFormData({ main_symptom: "", other_symptoms: [], duration: "" });
                          setResult(null);
                        }}
                        className="btn-secondary"
                      >
                        Start Over
                      </button>
                      <Link 
                        to={`/doctors?specialization=${result.recommended_department}`}
                        className="btn-primary px-8 flex items-center gap-2 text-lg shadow-lg shadow-primary-500/30"
                      >
                        Find a Doctor <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-red-500">Failed to analyze symptoms. Please try again.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
