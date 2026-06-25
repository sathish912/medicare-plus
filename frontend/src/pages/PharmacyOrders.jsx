import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { getMyOrders } from "../api/endpoints";

export default function PharmacyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await getMyOrders();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'paid': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return "bg-orange-100 text-orange-800";
      case 'paid': return "bg-blue-100 text-blue-800";
      case 'shipped': return "bg-purple-100 text-purple-800";
      case 'delivered': return "bg-emerald-100 text-emerald-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-8 h-8 text-primary-600" />
          My Orders
        </h1>
        <p className="text-slate-500 mt-2">Track the status of your pharmacy orders.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700">No Orders Yet</h2>
          <p className="text-slate-500 mt-2">You haven't placed any pharmacy orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Order #{order.id}</p>
                  <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 uppercase tracking-wide ${getStatusBadge(order.status)}`}>
                  {getStatusIcon(order.status)} {order.status}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium">Total Amount</p>
                  <p className="text-lg font-black text-slate-800">₹{order.total_amount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Shipping To</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{order.shipping_address}</p>
                </div>
                
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Items</h4>
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      <img 
                        src={item.medicine.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80"} 
                        alt={item.medicine.name}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-100"
                      />
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-800">{item.medicine.name}</h5>
                        <p className="text-sm text-slate-500">Qty: {item.quantity} x ₹{item.unit_price.toFixed(2)}</p>
                      </div>
                      <div className="font-bold text-slate-700">
                        ₹{(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
