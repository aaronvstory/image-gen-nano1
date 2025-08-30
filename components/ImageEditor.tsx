
import React, { useState, useEffect, useCallback } from 'react';
import { OriginalImage, GeneratedImage } from '../types';
import { expandImage } from '../services/geminiService';
import { createExpandedCanvas } from '../utils/imageUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Slider } from './ui/Slider';
import { ChevronLeftIcon, LoaderIcon, WandIcon } from './ui/Icons';
import GeneratedImageHistory from './GeneratedImageHistory';
import { useAppContext } from '../App';

interface ImageEditorProps {
  originalImage: OriginalImage;
  onReset: () => void;
}

const MAX_DIM = 4096;

const ImageEditor: React.FC<ImageEditorProps> = ({ originalImage, onReset }) => {
  const { apiKey } = useAppContext();
  const [width, setWidth] = useState(originalImage.width);
  const [height, setHeight] = useState(originalImage.height);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  useEffect(() => {
    setWidth(originalImage.width);
    setHeight(originalImage.height);
  }, [originalImage]);

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
        setError("Please set your Gemini API key using the key icon in the header.");
        return;
    }
    if (width === originalImage.width && height === originalImage.height) {
        setError("The new dimensions are the same as the original. Please expand the canvas.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const finalPrompt = prompt || `Photorealistically expand this image to fill the transparent areas. Do not alter, change, or edit the original centered image content. Match the style, lighting, and details of the original image to create a seamless, cohesive, and natural-looking extension.`;
      
      const canvasBase64 = await createExpandedCanvas(originalImage.src, width, height, originalImage.width, originalImage.height);
      const resultBase64 = await expandImage(canvasBase64, finalPrompt, apiKey);
      
      const newImages: GeneratedImage[] = resultBase64.map(src => ({
        id: crypto.randomUUID(),
        src: `data:image/png;base64,${src}`
      }));
      
      setGeneratedImages(prev => [...newImages, ...prev]);
      setIsHistoryVisible(true);
    // Fix: Added curly braces to the catch block to fix a syntax error.
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, width, height, prompt, apiKey]);

  const setAspectRatio = useCallback((ratio: 'landscape' | 'portrait' | 'square' | 'auto') => {
    const originalW = originalImage.width;
    const originalH = originalImage.height;
    let newW = originalW;
    let newH = originalH;

    switch (ratio) {
      case 'landscape': {
        const targetAspectRatio = 16 / 9;
        // Expand the canvas to fit the target aspect ratio while containing the original image
        if (originalW / originalH < targetAspectRatio) {
          // Image is taller or less wide than 16:9, so expand width
          newW = Math.round(originalH * targetAspectRatio);
        } else {
          // Image is wider or has the same aspect ratio as 16:9, so expand height
          newH = Math.round(originalW / targetAspectRatio);
        }
        break;
      }
      case 'portrait': {
        const targetAspectRatio = 9 / 16;
        // Expand the canvas to fit the target aspect ratio while containing the original image
        if (originalW / originalH > targetAspectRatio) {
          // Image is wider or less tall than 9:16, so expand height
          newH = Math.round(originalW / targetAspectRatio);
        } else {
          // Image is taller or has the same aspect ratio as 9:16, so expand width
          newW = Math.round(originalH * targetAspectRatio);
        }
        break;
      }
      case 'square': {
        const side = Math.max(originalW, originalH);
        newW = side;
        newH = side;
        break;
      }
      case 'auto': { // This is the "1:1 +30%" preset
        const side = Math.round(Math.max(originalW, originalH) * 1.3);
        newW = side;
        newH = side;
        break;
      }
    }
    
    setWidth(newW);
    setHeight(newH);
  }, [originalImage.width, originalImage.height]);


  const imageScale = Math.min(
    (window.innerWidth * 0.7) / width,
    (window.innerHeight * 0.6) / height,
    1
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
        <Button variant="ghost" className="absolute top-16 sm:top-4 left-4 z-20" onClick={onReset}>
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Back
        </Button>
        <div 
            className="flex-grow flex items-center justify-center w-full p-4 overflow-hidden relative"
            style={{ touchAction: 'none' }}
        >
            <div
              className="relative transition-all duration-200"
              style={{
                  width: width * imageScale,
                  height: height * imageScale,
              }}
            >
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <img
                    src={originalImage.src}
                    alt="Original"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                        width: originalImage.width * imageScale,
                        height: originalImage.height * imageScale,
                    }}
                />
                 <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none"></div>
            </div>
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-20">
            {error && <p className="text-destructive text-center mb-2">{error}</p>}
            <div className="bg-secondary/80 backdrop-blur-sm border border-border rounded-xl p-4 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                           <label htmlFor="width" className="text-sm font-medium w-16">Width</label>
                           <Slider id="width" value={[width]} onValueChange={([val]) => setWidth(val)} max={MAX_DIM} step={1} />
                           <Input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="height" className="text-sm font-medium w-16">Height</label>
                            <Slider id="height" value={[height]} onValueChange={([val]) => setHeight(val)} max={MAX_DIM} step={1} />
                            <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-24" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setAspectRatio('landscape')}>Landscape</Button>
                        <Button variant="outline" onClick={() => setAspectRatio('portrait')}>Portrait</Button>
                        <Button variant="outline" onClick={() => setAspectRatio('square')}>1:1</Button>
                        <Button variant="outline" onClick={() => setAspectRatio('auto')}>1:1 +30%</Button>
                    </div>
                </div>
                 <div className="mt-4 flex items-center gap-2">
                    <Input 
                        placeholder="Prompt (optional - describe the expanded areas)" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading} size="lg">
                        {isLoading ? <LoaderIcon className="animate-spin mr-2"/> : <WandIcon className="mr-2 h-4 w-4" />}
                        Generate
                    </Button>
                 </div>
            </div>
        </div>

        {generatedImages.length > 0 && 
            <GeneratedImageHistory 
              images={generatedImages} 
              isVisible={isHistoryVisible} 
              onToggle={() => setIsHistoryVisible(v => !v)}
              onRegenerate={handleGenerate}
              isGenerating={isLoading}
            />
        }
    </div>
  );
};

export default ImageEditor;

const BgGrid: React.FC = () => (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
    <defs>
      <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M 8 0 L 0 0 0 8" fill="none" stroke="hsl(var(--muted))" strokeWidth="0.5"/>
      </pattern>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" fill="url(#smallGrid)"/>
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="hsl(var(--muted))" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);
