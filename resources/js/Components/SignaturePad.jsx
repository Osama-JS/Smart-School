import React, { useRef, useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';

export default function SignaturePad({ onChange, className = '', error }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        // Setup canvas for high resolution
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
    }, []);

    const startDrawing = (e) => {
        const { offsetX, offsetY } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault(); // prevent scrolling on touch
        const { offsetX, offsetY } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const ctx = canvasRef.current.getContext('2d');
            ctx.closePath();
            
            // Export as WebP
            if (onChange) {
                const dataUrl = canvasRef.current.toDataURL('image/webp', 0.8);
                onChange(dataUrl);
            }
        }
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY
        };
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onChange) onChange(null);
    };

    return (
        <div className={`relative ${className}`}>
            <div className={`border-2 rounded-xl bg-white dark:bg-gray-900 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}>
                <canvas
                    ref={canvasRef}
                    className="w-full h-40 touch-none cursor-crosshair rounded-xl"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <button
                type="button"
                onClick={clear}
                className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="مسح التوقيع"
            >
                <RefreshCcw size={16} />
            </button>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
    );
}
