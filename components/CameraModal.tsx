import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Image as ImageIcon, Check, Trash2, Undo2, PenTool, Video, Play, Pause, Palette, Loader2 } from 'lucide-react';

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

  // Camera State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Editor State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<Blob | null>(null);
  const [view, setView] = useState<'camera' | 'edit-photo' | 'review-video'>('camera');

  // Initialize Camera
  useEffect(() => {
    if (view !== 'camera') return;

    let mounted = true;

    const startCamera = async () => {
      setStream(null); // Clear stream to show loader
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true
        });
        
        if (mounted) {
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.muted = true;
            }
            setHasPermission(true);
        } else {
            // Cleanup if unmounted during load
            mediaStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.warn("Camera init error:", err);
        try {
           // Fallback: Try video only if audio fails
           const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
             video: { facingMode }
           });
           if (mounted) {
               setStream(videoOnlyStream);
               if (videoRef.current) videoRef.current.srcObject = videoOnlyStream;
               setHasPermission(true);
           } else {
               videoOnlyStream.getTracks().forEach(track => track.stop());
           }
        } catch (e) {
           if (mounted) setHasPermission(false);
        }
      }
    };
    startCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [view, facingMode]);

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

  // --- ACTIONS ---

  const flipCamera = () => {
      if (isRecording) return;
      // Stop current tracks
      if (stream) {
          stream.getTracks().forEach(t => t.stop());
      }
      setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Mirror image if using front camera
        if (facingMode === 'user') {
            context.translate(canvasRef.current.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(videoRef.current, 0, 0);
        
        // Reset transform
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        // Convert to data URL for the editor
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setView('edit-photo');
      }
    }
  };

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
        setCapturedVideo(blob);
        setView('review-video');
      };

      recorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Failed to start recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video')) {
         setCapturedVideo(file);
         setView('review-video');
      } else {
         // Convert file to dataURL for editor
         const reader = new FileReader();
         reader.onload = (e) => {
            if (e.target?.result) {
                setCapturedImage(e.target.result as string);
                setView('edit-photo');
            }
         };
         reader.readAsDataURL(file);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- RENDER CONTENT ---

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {view === 'edit-photo' && capturedImage && (
          <PhotoEditor 
            imageSrc={capturedImage} 
            onRetake={() => { setCapturedImage(null); setView('camera'); }}
            onConfirm={(blob) => onCapture(blob, 'image')}
          />
      )}

      {view === 'review-video' && capturedVideo && (
          <VideoReview 
            videoBlob={capturedVideo}
            onRetake={() => { setCapturedVideo(null); setView('camera'); }}
            onConfirm={() => onCapture(capturedVideo, 'video')}
          />
      )}

      {view === 'camera' && (
        <>
            <div className="flex-1 relative overflow-hidden bg-gray-900 rounded-b-3xl">
                {/* Loading State */}
                {!stream && hasPermission !== false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-2">
                        <Loader2 className="animate-spin" size={48} />
                        <p className="text-xs font-bold uppercase tracking-widest">Initializing Optics...</p>
                    </div>
                )}

                {/* Permission Error */}
                {hasPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center text-white px-8 text-center">
                    <p>Camera permission required to proceed.</p>
                </div>
                )}

                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} // Mirror front camera preview
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {isRecording && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600/80 px-4 py-1 rounded-full text-white font-mono font-bold animate-pulse">
                    {formatTime(recordingTime)}
                </div>
                )}

                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 bg-black/50 p-2 rounded-full text-white backdrop-blur-md z-10"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Control Area */}
            <div className="bg-black pt-4 pb-8 flex flex-col gap-4">
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
                    
                    <button 
                    onClick={mode === 'photo' ? takePicture : (isRecording ? stopRecording : startRecording)}
                    disabled={!stream}
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                        isRecording 
                        ? 'border-red-500 bg-red-500/20' 
                        : 'border-white bg-white/20'
                    } ${!stream ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                    <button 
                        onClick={flipCamera}
                        disabled={isRecording}
                        className="w-12 h-12 flex items-center justify-center text-white/80 rounded-full active:bg-white/10 transition-colors"
                    >
                      <RefreshCw size={24} />
                    </button>
                </div>
            </div>
        </>
      )}
    </motion.div>
  );
};

// --- SUB-COMPONENTS ---

const PhotoEditor: React.FC<{ imageSrc: string; onRetake: () => void; onConfirm: (blob: Blob) => void }> = ({ imageSrc, onRetake, onConfirm }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [color, setColor] = useState('#EF4444'); // Default Red
    const [isDrawing, setIsDrawing] = useState(false);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Initialize Canvas with Image
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            // Set canvas size to image size
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            // Draw initial image
            ctx.drawImage(img, 0, 0);
            
            // Setup brush style
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = 15; // Proportional to high res image
            contextRef.current = ctx;
        };
    }, [imageSrc]);

    // Update Color
    useEffect(() => {
        if(contextRef.current) contextRef.current.strokeStyle = color;
    }, [color]);

    const startDrawing = ({ nativeEvent }: any) => {
        if (!contextRef.current) return;
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }: any) => {
        if (!isDrawing || !contextRef.current) return;
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const stopDrawing = () => {
        if(contextRef.current) contextRef.current.closePath();
        setIsDrawing(false);
    };

    // Helper to get touch/mouse coordinates relative to canvas scaling
    const getCoordinates = (event: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;
        if ('touches' in event) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = (event as MouseEvent).clientX;
            clientY = (event as MouseEvent).clientY;
        }

        return {
            offsetX: (clientX - rect.left) * scaleX,
            offsetY: (clientY - rect.top) * scaleY
        };
    };

    const handleSave = () => {
        if (canvasRef.current) {
            canvasRef.current.toBlob((blob) => {
                if(blob) onConfirm(blob);
            }, 'image/jpeg', 0.85);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black">
            {/* Toolbar */}
            <div className="px-4 py-4 flex justify-between items-center bg-black/50 z-20">
                <button onClick={onRetake} className="text-white p-2 rounded-full hover:bg-white/10">
                    <Trash2 size={24} />
                </button>
                <div className="flex items-center gap-4 bg-gray-800 rounded-full px-4 py-2">
                    <button onClick={() => setColor('#EF4444')} className={`w-6 h-6 rounded-full bg-red-500 border-2 ${color === '#EF4444' ? 'border-white' : 'border-transparent'}`} />
                    <button onClick={() => setColor('#EAB308')} className={`w-6 h-6 rounded-full bg-yellow-500 border-2 ${color === '#EAB308' ? 'border-white' : 'border-transparent'}`} />
                    <button onClick={() => setColor('#FFFFFF')} className={`w-6 h-6 rounded-full bg-white border-2 ${color === '#FFFFFF' ? 'border-gray-400' : 'border-transparent'}`} />
                </div>
                <button className="text-white font-bold text-sm bg-mint-600 px-4 py-2 rounded-full flex items-center gap-1" onClick={handleSave}>
                    Next <Check size={16} />
                </button>
            </div>

            {/* Canvas Area */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-900 touch-none flex items-center justify-center">
                <canvas 
                    ref={canvasRef}
                    className="max-w-full max-h-full object-contain shadow-2xl"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full pointer-events-none">
                    Draw on screen to circle hazards
                </div>
            </div>
        </div>
    );
};

const VideoReview: React.FC<{ videoBlob: Blob; onRetake: () => void; onConfirm: () => void }> = ({ videoBlob, onRetake, onConfirm }) => {
    const videoUrl = React.useMemo(() => URL.createObjectURL(videoBlob), [videoBlob]);
    const vidRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    const togglePlay = () => {
        if(vidRef.current) {
            if(isPlaying) vidRef.current.pause();
            else vidRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black relative">
            <video 
                ref={vidRef}
                src={videoUrl} 
                className="flex-1 w-full h-full object-contain bg-gray-900" 
                autoPlay 
                loop 
                playsInline
                onClick={togglePlay}
            />
            
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Play size={48} className="text-white/80 fill-white" />
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/50 to-transparent flex justify-between items-end">
                <button onClick={onRetake} className="flex flex-col items-center text-white gap-1 active:opacity-70">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600">
                        <Trash2 size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase">Retake</span>
                </button>

                <button onClick={onConfirm} className="flex flex-col items-center text-white gap-1 active:opacity-70">
                    <div className="w-16 h-16 rounded-full bg-mint-600 flex items-center justify-center border-4 border-mint-400 shadow-coin">
                        <Check size={32} />
                    </div>
                    <span className="text-[10px] font-bold uppercase">Submit</span>
                </button>
            </div>
        </div>
    );
};

export default CameraModal;