import { useEffect, useRef, useState } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { getChatHistory, sendChatMessage } from "../api/endpoints";

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getChatHistory().then((res) => setMessages(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (e, forceText = null) => {
    if (e) e.preventDefault();
    const userText = forceText || input;
    if (!userText.trim()) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, sender: "user", message: userText, created_at: new Date().toISOString() },
    ]);
    setSending(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate typing delay
      const res = await sendChatMessage(userText);
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      const errorMsg = err.response?.data?.detail || "Sorry, something went wrong connecting to the backend. Please ensure your backend server is restarted and running.";
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, sender: "ai", message: errorMsg, created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold mb-1">AI Healthcare Assistant</h1>
      <p className="text-slate-500 text-sm mb-6">
        Ask general health questions or ask about your appointments and records. This is not a substitute for professional medical advice.
      </p>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-2xl border border-slate-100 p-4 mb-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-slate-400 text-sm text-center mt-10">
            Start the conversation — try "I have a fever and headache".
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            {m.sender === "ai" && (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.sender === "user" 
                  ? "bg-primary-600 text-white rounded-br-sm" 
                  : "bg-white border border-slate-200 shadow-sm text-slate-700 rounded-bl-sm"
              }`}
            >
              {m.message.includes("**EMERGENCY WARNING**") ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-800">
                  <strong className="flex items-center gap-1 mb-1">⚠️ Emergency Warning</strong>
                  {m.message.replace("**EMERGENCY WARNING**:", "").replace("**EMERGENCY WARNING**", "").trim()}
                </div>
              ) : (
                m.message.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                  }
                  return <span key={i}>{part}</span>;
                })
              )}
            </div>
            {m.sender === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-600" />
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          "I have a fever and headache",
          "When is my next appointment?",
          "Where are my lab tests?",
          "I can't breathe"
        ].map((s, i) => (
          <button 
            key={i} 
            onClick={() => handleSend(null, s)}
            disabled={sending}
            className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="input-field"
          placeholder="Describe your symptoms or ask a health question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={sending} className="btn-primary px-4">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
