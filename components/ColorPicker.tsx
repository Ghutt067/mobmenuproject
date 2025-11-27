import { useState, useEffect, useRef } from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const pickerRef = useRef<HTMLDivElement>(null);
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSaturation = useRef(false);
  const isDraggingHue = useRef(false);
  const isUserInteracting = useRef(false);

  // Converter HSV para HEX
  const hsvToHex = (h: number, s: number, v: number) => {
    h = h / 360;
    s = s / 100;
    v = v / 100;

    const c = v * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (s === 0) {
      r = g = b = v;
    } else {
      const h6 = h * 6;
      if (h6 < 1) {
        r = c; g = x; b = 0;
      } else if (h6 < 2) {
        r = x; g = c; b = 0;
      } else if (h6 < 3) {
        r = 0; g = c; b = x;
      } else if (h6 < 4) {
        r = 0; g = x; b = c;
      } else if (h6 < 5) {
        r = x; g = 0; b = c;
      } else {
        r = c; g = 0; b = x;
      }
      
      r += m;
      g += m;
      b += m;
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Converter HEX para HSV
  const hexToHsv = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, v: 0 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta) % 6;
      } else if (max === g) {
        h = (b - r) / delta + 2;
      } else {
        h = (r - g) / delta + 4;
      }
      h = h * 60;
      if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      v: Math.round(v * 100),
    };
  };

  // Converter HSL para RGB e depois para HEX
  const hslToHex = (h: number, s: number, l: number) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Converter HEX para HSL
  const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  // Atualizar valores quando o valor hex mudar externamente (apenas se não estiver interagindo)
  useEffect(() => {
    if (!isUserInteracting.current) {
      const hsv = hexToHsv(value);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setLightness(hsv.v); // Usar lightness como value para compatibilidade
    }
  }, [value]);

  // Inicializar valores quando o popup abrir
  useEffect(() => {
    if (isOpen && !isUserInteracting.current) {
      const hsv = hexToHsv(value);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setLightness(hsv.v); // Usar lightness como value para compatibilidade
    }
  }, [isOpen, value]);

  // Fechar quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updateColor = (newHue: number, newSaturation: number, newValue: number) => {
    const newHex = hsvToHex(newHue, newSaturation, newValue);
    onChange(newHex);
  };

  const handleSaturationClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!saturationRef.current) return;
    isUserInteracting.current = true;
    const rect = saturationRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const newSaturation = Math.round((x / rect.width) * 100);
    const newValue = Math.round(100 - (y / rect.height) * 100);
    setSaturation(newSaturation);
    setLightness(newValue); // Usar lightness como value
    updateColor(hue, newSaturation, newValue);
  };

  const handleSaturationMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingSaturation.current = true;
    isUserInteracting.current = true;
    handleSaturationClick(e);
  };

  const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current) return;
    isUserInteracting.current = true;
    const rect = hueRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const newHue = Math.round((y / rect.height) * 360);
    setHue(newHue);
    updateColor(newHue, saturation, lightness); // lightness é o value
  };

  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingHue.current = true;
    isUserInteracting.current = true;
    handleHueClick(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSaturation.current && saturationRef.current) {
        const rect = saturationRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const newSaturation = Math.round((x / rect.width) * 100);
        const newValue = Math.round(100 - (y / rect.height) * 100);
        setSaturation(newSaturation);
        setLightness(newValue); // Usar lightness como value
        updateColor(hue, newSaturation, newValue);
      }
      if (isDraggingHue.current && hueRef.current) {
        const rect = hueRef.current.getBoundingClientRect();
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const newHue = Math.round((y / rect.height) * 360);
        setHue(newHue);
        updateColor(newHue, saturation, lightness); // lightness é o value
      }
    };

    const handleMouseUp = () => {
      isDraggingSaturation.current = false;
      isDraggingHue.current = false;
      // Aguardar um pouco antes de permitir atualizações externas
      setTimeout(() => {
        isUserInteracting.current = false;
      }, 100);
    };

    if (isDraggingSaturation.current || isDraggingHue.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [hue, saturation, lightness]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Renderizar gradiente no canvas
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Limpar canvas
    ctx.clearRect(0, 0, width, height);

    // Renderizar pixel por pixel
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // X: 0 (esquerda) = saturação 0%, X: width (direita) = saturação 100%
        const s = (x / width);
        // Y: 0 (topo) = value 100%, Y: height (fundo) = value 0%
        const v = 1 - (y / height);
        
        // Usar HSV (Hue, Saturation, Value) para renderizar
        // Converter HSV para RGB
        const h = hue / 360;
        const c = v * s; // Chroma
        const x_hsv = c * (1 - Math.abs(((h * 6) % 2) - 1));
        const m = v - c;

        let r, g, b;

        if (s === 0) {
          // Sem saturação = escala de cinza
          r = g = b = v;
        } else {
          const h6 = h * 6;
          if (h6 < 1) {
            r = c; g = x_hsv; b = 0;
          } else if (h6 < 2) {
            r = x_hsv; g = c; b = 0;
          } else if (h6 < 3) {
            r = 0; g = c; b = x_hsv;
          } else if (h6 < 4) {
            r = 0; g = x_hsv; b = c;
          } else if (h6 < 5) {
            r = x_hsv; g = 0; b = c;
          } else {
            r = c; g = 0; b = x_hsv;
          }
          
          r += m;
          g += m;
          b += m;
        }

        const index = (y * width + x) * 4;
        data[index] = Math.round(r * 255);     // R
        data[index + 1] = Math.round(g * 255); // G
        data[index + 2] = Math.round(b * 255); // B
        data[index + 3] = 255;                 // A
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [hue, isOpen]);

  return (
    <div className="color-picker-wrapper" ref={pickerRef}>
      <div
        className="color-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: value }}
        title={label || `Clique para alterar a cor (${value})`}
      />
      
      {isOpen && (
        <div className="color-picker-popup">
          <div className="color-picker-visual">
            {/* Área de saturação e luminosidade */}
            <div
              ref={saturationRef}
              className="color-picker-saturation"
              onMouseDown={handleSaturationMouseDown}
              onClick={handleSaturationClick}
            >
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                }}
              />
              <div
                className="color-picker-cursor"
                style={{
                  left: `${saturation}%`,
                  top: `${100 - lightness}%`, // lightness agora é value
                }}
              />
            </div>
            
            {/* Barra de matiz (hue) */}
            <div
              ref={hueRef}
              className="color-picker-hue"
              onMouseDown={handleHueMouseDown}
              onClick={handleHueClick}
            >
              <div
                className="color-picker-hue-cursor"
                style={{
                  top: `${(hue / 360) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

