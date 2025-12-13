import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface CameraModalProps {
  onClose: () => void;
  onCapture: (blob: Blob, type: 'image' | 'video') => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        // Request audio for video mode capability
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: true
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.muted = true; // Mute preview to avoid feedback
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera Error:", err);
        // Fallback: Try video only if audio failed
        try {
           const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
             video: { facingMode: 'environment' }
           });
           setStream(videoOnlyStream);
           if (videoRef.current) videoRef.current.srcObject = videoOnlyStream;
           setHasPermission(true);
        } catch (e) {
           setHasPermission(false);
        }
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Recording Timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Photo Capture Logic
  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) onCapture(blob, 'image');
        }, 'image/jpeg', 0.8);
      }
    }
  };

  // Video Recording Logic
  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        onCapture(blob, 'video');
      };

      recorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Recorder Error", e);
      alert("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      onCapture(file, type);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      <div className="flex-1 relative overflow-hidden bg-gray-900 rounded-b-3xl">
        {!hasPermission && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p>Camera permission required.</p>
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Timer Overlay */}
        {isRecording && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600/80 px-4 py-1 rounded-full text-white font-mono font-bold animate-pulse">
            {formatTime(recordingTime)}
          </div>
        )}

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 bg-black/50 p-2 rounded-full text-white backdrop-blur-md"
        >
          <X size={24} />
        </button>
      </div>

      {/* Control Area */}
      <div className="bg-black pt-4 pb-8 flex flex-col gap-4">
         
         {/* Mode Switcher */}
         <div className="flex justify-center items-center gap-8 text-sm font-bold uppercase tracking-wider">
            <button 
              onClick={() => !isRecording && setMode('photo')} 
              className={`transition-colors duration-300 ${mode === 'photo' ? 'text-yellow-400' : 'text-gray-500'}`}
            >
              Photo
            </button>
            <button 
              onClick={() => !isRecording && setMode('video')} 
              className={`transition-colors duration-300 ${mode === 'video' ? 'text-yellow-400' : 'text-gray-500'}`}
            >
              Video
            </button>
         </div>

         <div className="flex items-center justify-center gap-8 px-8">
            {/* Upload Button */}
            <button 
              className="w-12 h-12 flex items-center justify-center text-white/80 rounded-full bg-white/10 active:bg-white/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={24} />
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileUpload}
              />
            </button>
            
            {/* Shutter Button */}
            <button 
              onClick={mode === 'photo' ? takePicture : (isRecording ? stopRecording : startRecording)}
              className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                  ? 'border-red-500 bg-red-500/20' 
                  : 'border-white bg-white/20'
              }`}
            >
              <motion.div 
                animate={{ 
                  borderRadius: isRecording ? "4px" : "50%",
                  scale: isRecording ? 0.5 : 1,
                  backgroundColor: mode === 'video' ? "#EF4444" : "#FFFFFF"
                }}
                className="w-16 h-16"
              />
            </button>

            {/* Flip / Spacer */}
            <button 
                className="w-12 h-12 flex items-center justify-center text-white/80"
                onClick={() => { /* Toggle camera logic */ }}
            >
              <RefreshCw size={24} />
            </button>
         </div>
      </div>
    </motion.div>
  );
};

export default CameraModal;