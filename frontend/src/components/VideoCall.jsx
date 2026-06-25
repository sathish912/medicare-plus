import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function VideoCall({ roomName, userName, isClosed }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (isClosed) return;

    // Load the Jitsi External API script dynamically
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;

    script.onload = () => {
      if (window.JitsiMeetExternalAPI) {
        const domain = "meet.jit.si";
        const options = {
          roomName: roomName,
          width: "100%",
          height: "100%",
          parentNode: containerRef.current,
          userInfo: {
            displayName: userName
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true
          },
          interfaceConfigOverwrite: {
            SHOW_CHROME_EXTENSION_BANNER: false,
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "closedcaptions", "desktop", "fullscreen",
              "fodeviceselection", "profile", "chat", "recording",
              "livestreaming", "etherpad", "sharedvideo", "settings", "raisehand",
              "videoquality", "filmstrip", "feedback", "stats", "shortcuts",
              "tileview", "select-background", "download", "help", "mute-everyone"
            ]
          }
        };

        apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      }
    };

    document.body.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      document.body.removeChild(script);
    };
  }, [roomName, userName, isClosed]);

  if (isClosed) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-500 shadow-inner">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <span className="text-2xl">End</span>
        </div>
        <p>This consultation has ended.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner">
      {!apiRef.current && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 z-0">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-500" />
          <p>Connecting to secure video room...</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-10" />
    </div>
  );
}
