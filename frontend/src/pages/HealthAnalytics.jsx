import { useState, useEffect } from "react";
import { Activity, Plus, HeartPulse, Scale, Droplet, Watch, Footprints, Flame } from "lucide-react";
import { getMyHealthMetrics, logHealthMetric, syncWearableData } from "../api/endpoints";
import toast from "react-hot-toast";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { format } from "date-fns";

export default function HealthAnalytics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Log Form State
  const [metricType, setMetricType] = useState("heart_rate");
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState(""); // For Diastolic BP
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wearables State
  const [connectedProvider, setConnectedProvider] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleSync = async () => {
    if (!connectedProvider) return;
    setIsSyncing(true);
    try {
      const res = await syncWearableData(connectedProvider);
      toast.success(res.data.message);
      await fetchMetrics();
    } catch (err) {
      toast.error("Failed to sync data");
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await getMyHealthMetrics();
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogMetric = async (e) => {
    e.preventDefault();
    if (!value) return;

    setIsSubmitting(true);
    try {
      if (metricType === "blood_pressure") {
        if (!value2) {
          toast.error("Please enter diastolic value");
          setIsSubmitting(false);
          return;
        }
        await logHealthMetric({ metric_type: "blood_pressure_systolic", value: parseFloat(value), unit: "mmHg" });
        await logHealthMetric({ metric_type: "blood_pressure_diastolic", value: parseFloat(value2), unit: "mmHg" });
      } else {
        let unit = "";
        if (metricType === "heart_rate") unit = "bpm";
        if (metricType === "weight") unit = "kg";
        if (metricType === "blood_sugar") unit = "mg/dL";
        await logHealthMetric({ metric_type: metricType, value: parseFloat(value), unit });
      }
      
      toast.success("Metric logged successfully!");
      setValue("");
      setValue2("");
      fetchMetrics();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to log metric");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process data for charts
  const getChartData = (type) => {
    const filtered = metrics.filter(m => m.metric_type === type);
    return filtered.map(m => ({
      date: format(new Date(m.recorded_at), 'MMM dd, HH:mm'),
      value: m.value
    }));
  };

  const getBPChartData = () => {
    const sys = metrics.filter(m => m.metric_type === "blood_pressure_systolic");
    const dia = metrics.filter(m => m.metric_type === "blood_pressure_diastolic");
    
    // Group by exact time
    const dataMap = {};
    sys.forEach(m => {
      const time = new Date(m.recorded_at).getTime();
      dataMap[time] = { ...dataMap[time], date: format(new Date(m.recorded_at), 'MMM dd, HH:mm'), systolic: m.value };
    });
    dia.forEach(m => {
      // Find closest time (since they are created sequentially)
      const time = new Date(m.recorded_at).getTime();
      const closestSys = Object.keys(dataMap).reduce((prev, curr) => 
        Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev
      , Object.keys(dataMap)[0] || time);
      
      if (dataMap[closestSys]) {
        dataMap[closestSys].diastolic = m.value;
      }
    });

    return Object.values(dataMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary-600" />
          Health Analytics
        </h1>
        <p className="text-slate-500 mt-2">Track and visualize your vital health metrics over time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Log Metric Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-600" /> Log New Metric
            </h2>
            
            <form onSubmit={handleLogMetric} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Metric Type</label>
                <select 
                  className="input-field"
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value)}
                >
                  <option value="heart_rate">Heart Rate (bpm)</option>
                  <option value="blood_pressure">Blood Pressure (mmHg)</option>
                  <option value="weight">Weight (kg)</option>
                  <option value="blood_sugar">Blood Sugar (mg/dL)</option>
                </select>
              </div>

              {metricType === "blood_pressure" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Systolic</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="120"
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Diastolic</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="80"
                      value={value2}
                      onChange={e => setValue2(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="input-field" 
                    placeholder="Enter value"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    required
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary w-full py-3"
              >
                {isSubmitting ? "Logging..." : "Save Metric"}
              </button>
            </form>
          </div>
          
          {/* Wearables Integration */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg border border-slate-700 p-6 sticky top-[450px] mt-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Watch className="w-5 h-5 text-indigo-400" /> Device Sync
            </h2>
            <p className="text-sm text-slate-300 mb-6">Connect your smartwatch or fitness app to automatically import health data.</p>
            
            <div className="space-y-3 mb-6">
              {['Google Fit', 'Apple Health', 'Fitbit'].map(provider => (
                <button
                  key={provider}
                  onClick={() => setConnectedProvider(provider)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${connectedProvider === provider ? 'bg-indigo-600 border-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700'}`}
                >
                  <span className="font-semibold">{provider}</span>
                  {connectedProvider === provider && <span className="float-right text-indigo-200 text-sm">Connected</span>}
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleSync}
              disabled={!connectedProvider || isSyncing}
              className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl shadow-md disabled:bg-slate-600 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <div className="w-5 h-5 border-2 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
              ) : (
                "Sync Data Now"
              )}
            </button>
          </div>
        </div>

        {/* Charts Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Steps Chart */}
              {getChartData("steps").length > 0 && (
                <ChartCard 
                  title="Daily Steps" 
                  icon={<Footprints className="w-5 h-5 text-indigo-500" />}
                  data={getChartData("steps")}
                  color="#6366f1"
                  unit="steps"
                />
              )}

              {/* Active Calories Chart */}
              {getChartData("active_calories").length > 0 && (
                <ChartCard 
                  title="Active Calories" 
                  icon={<Flame className="w-5 h-5 text-orange-500" />}
                  data={getChartData("active_calories")}
                  color="#f97316"
                  unit="kcal"
                />
              )}

              {/* Heart Rate Chart */}
              <ChartCard 
                title="Heart Rate Trend" 
                icon={<HeartPulse className="w-5 h-5 text-rose-500" />}
                data={getChartData("heart_rate")}
                color="#f43f5e"
                unit="bpm"
              />

              {/* Blood Pressure Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-bold text-slate-800">Blood Pressure Trend</h3>
                </div>
                {getBPChartData().length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getBPChartData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                        <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No blood pressure data logged yet.</div>
                )}
              </div>

              {/* Weight Chart */}
              <ChartCard 
                title="Weight Trend" 
                icon={<Scale className="w-5 h-5 text-emerald-500" />}
                data={getChartData("weight")}
                color="#10b981"
                unit="kg"
              />

              {/* Blood Sugar Chart */}
              <ChartCard 
                title="Blood Sugar Trend" 
                icon={<Droplet className="w-5 h-5 text-sky-500" />}
                data={getChartData("blood_sugar")}
                color="#0ea5e9"
                unit="mg/dL"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, data, color, unit }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      {data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
              <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} stroke="#94a3b8" />
              <Tooltip 
                formatter={(value) => [`${value} ${unit}`, title]}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={3} 
                dot={{r: 4, fill: color}} 
                activeDot={{r: 6}} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
          No data logged yet.
        </div>
      )}
    </div>
  );
}
