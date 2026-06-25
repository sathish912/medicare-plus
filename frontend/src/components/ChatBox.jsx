import { useState, useEffect, useRef } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getConsultationChatHistory } from "../api/endpoints";

export default function ChatBox({ appointmentId, currentUserId, status }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const isClosed = status === "completed" || status === "cancelled";

  useEffect(() => {
    // 1. Fetch History
    getConsultationChatHistory(appointmentId)
      .then((res) => {
        setMessages(res.data);
      })
      .catch((err) => {
        toast.error("Failed to load chat history");
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Connect WebSocket
    const token = localStorage.getItem("mcp_token");
    if (!token) return;

    // Use appropriate wss:// or ws:// depending on environment, hardcoded ws for local dev
    const ws = new WebSocket(`ws://localhost:8000/api/chat/ws/${appointmentId}?token=${token}`);
    
    ws.onopen = () => {
      console.log("Connected to chat");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          toast.error(msg.error);
        } else {
          setMessages((prev) => [...prev, msg]);
        }
      } catch (err) {}
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    ws.onclose = () => {
      console.log("Disconnected from chat");
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [appointmentId]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || isClosed) return;

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(inputText);
      setInputText("");
    } else {
      toast.error("Chat disconnected. Refresh page to reconnect.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-xl bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Live Consultation Chat</h3>
        {isClosed && (
          <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded">Closed</span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className="text-xs text-slate-400 mb-1 px-1">
                {isMe ? "You" : msg.sender_name}
              </div>
              <div 
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  isMe 
                    ? "bg-primary-600 text-white rounded-br-none" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                }`}
              >
                {msg.content}
              </div>
              <div className="text-[10px] text-slate-300 mt-1 px-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <p>No messages yet.</p>
            <p className="text-xs mt-1">Start the conversation below.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isClosed ? "Chat is closed" : "Type a message..."}
          disabled={isClosed}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!inputText.trim() || isClosed}
          className="btn-primary p-2 aspect-square flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
