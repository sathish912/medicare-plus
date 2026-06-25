import { useState, useEffect } from "react";
import { Pill, Search, ShoppingCart, Info, AlertTriangle } from "lucide-react";
import { getMedicines } from "../api/endpoints";
import { useCart } from "../context/CartContext";

export default function Pharmacy() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    fetchMedicines();
  }, [search]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await getMedicines(search);
      setMedicines(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="w-8 h-8 text-primary-600" />
            Digital Pharmacy
          </h1>
          <p className="text-slate-500 mt-2">Order medicines online and get them delivered to your doorstep.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search medicines..." 
            className="input-field pl-12 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {medicines.map(med => (
            <div key={med.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col">
              <div className="relative h-48 bg-slate-50 p-6 flex items-center justify-center">
                {med.requires_prescription && (
                  <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3 h-3" /> Rx Required
                  </div>
                )}
                <img 
                  src={med.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"} 
                  alt={med.name} 
                  className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{med.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1" title={med.description}>{med.description}</p>
                
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-primary-700">₹{med.price.toFixed(2)}</span>
                  </div>
                  
                  <button 
                    onClick={() => addToCart(med)}
                    disabled={med.stock <= 0}
                    className="btn-primary w-12 h-12 p-0 flex items-center justify-center rounded-xl shadow-md shadow-primary-500/20 disabled:bg-slate-300 disabled:shadow-none"
                    title={med.stock <= 0 ? "Out of stock" : "Add to Cart"}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
                {med.stock <= 0 && <p className="text-red-500 text-xs font-semibold mt-2 text-right">Out of Stock</p>}
                {med.stock > 0 && med.stock <= 10 && <p className="text-orange-500 text-xs font-semibold mt-2 text-right">Only {med.stock} left!</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
