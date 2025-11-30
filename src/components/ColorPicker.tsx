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
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSaturation = useRef(false);
  const isDraggingHue = useRef(false);
  const isUserInteracting = useRef(false);
  const [isEyeDropperActive, setIsEyeDropperActive] = useState(false);
  const shouldIgnoreEyeDropperResult = useRef(false);
  const eyeDropperButtonRef = useRef<HTMLButtonElement>(null);
  const eyeDropperActivatedAt = useRef<number>(0);

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

  // Calcular posição do popup quando abrir
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const popupWidth = 240; // largura aproximada do popup (200px + padding)
          const popupHeight = 250; // altura aproximada do popup
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          let left = rect.left;
          let top = rect.bottom + 8;
          
          // Ajustar se sair da tela à direita
          if (left + popupWidth > viewportWidth) {
            left = viewportWidth - popupWidth - 8;
          }
          
          // Ajustar se sair da tela à esquerda
          if (left < 0) {
            left = 8;
          }
          
          // Ajustar se sair da tela embaixo
          if (top + popupHeight > viewportHeight) {
            top = rect.top - popupHeight - 8;
          }
          
          // Garantir que não fique acima da tela
          if (top < 0) {
            top = 8;
          }
          
          setPopupPosition({ top, left });
        }
      };
      
      // Usar requestAnimationFrame para garantir que o DOM está atualizado
      requestAnimationFrame(() => {
        updatePosition();
      });
      
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

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

  // Função para usar a pinça (EyeDropper API)
  const handleEyeDropper = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Se a pinça já está ativa, desativar (ignorar próximo resultado)
    if (isEyeDropperActive) {
      shouldIgnoreEyeDropperResult.current = true;
      setIsEyeDropperActive(false);
      return;
    }
    
    // Verificar se a API EyeDropper está disponível
    if ('EyeDropper' in window) {
      try {
        setIsEyeDropperActive(true);
        shouldIgnoreEyeDropperResult.current = false;
        eyeDropperActivatedAt.current = Date.now();
        
        // Adicionar um pequeno delay para evitar capturar o clique do próprio botão
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verificar novamente se ainda deve ignorar (usuário pode ter clicado no botão novamente durante o delay)
        if (shouldIgnoreEyeDropperResult.current) {
          setIsEyeDropperActive(false);
          shouldIgnoreEyeDropperResult.current = false;
          return;
        }
        
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        
        // Se o resultado deve ser ignorado (usuário clicou no botão novamente), não aplicar
        if (shouldIgnoreEyeDropperResult.current) {
          setIsEyeDropperActive(false);
          shouldIgnoreEyeDropperResult.current = false;
          return;
        }
        
        // Verificar se o clique foi muito rápido após ativar (provavelmente foi no próprio botão)
        const timeSinceActivation = Date.now() - eyeDropperActivatedAt.current;
        if (timeSinceActivation < 300) {
          // Clique muito rápido, provavelmente foi no botão - ignorar
          setIsEyeDropperActive(false);
          shouldIgnoreEyeDropperResult.current = false;
          return;
        }
        
        if (result.sRGBHex) {
          onChange(result.sRGBHex);
          const hsv = hexToHsv(result.sRGBHex);
          setHue(hsv.h);
          setSaturation(hsv.s);
          setLightness(hsv.v);
          isUserInteracting.current = true;
          setTimeout(() => {
            isUserInteracting.current = false;
          }, 100);
        }
        
        setIsEyeDropperActive(false);
        shouldIgnoreEyeDropperResult.current = false;
      } catch (error: any) {
        // Usuário cancelou ou erro
        if (error.name !== 'AbortError') {
          console.error('Erro ao usar pinça:', error);
        }
        setIsEyeDropperActive(false);
        shouldIgnoreEyeDropperResult.current = false;
      }
    } else {
      // Fallback: mostrar mensagem ou usar método alternativo
      alert('A pinça de cor não está disponível no seu navegador. Use Chrome, Edge ou Opera para esta funcionalidade.');
    }
  };

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

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      // Calcular posição antes de abrir
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 240;
      const popupHeight = 250;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let left = rect.left;
      let top = rect.bottom + 8;
      
      // Ajustar se sair da tela à direita
      if (left + popupWidth > viewportWidth) {
        left = viewportWidth - popupWidth - 8;
      }
      
      // Ajustar se sair da tela à esquerda
      if (left < 0) {
        left = 8;
      }
      
      // Ajustar se sair da tela embaixo
      if (top + popupHeight > viewportHeight) {
        top = rect.top - popupHeight - 8;
      }
      
      // Garantir que não fique acima da tela
      if (top < 0) {
        top = 8;
      }
      
      setPopupPosition({ top, left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="color-picker-wrapper" ref={pickerRef}>
      <div
        ref={triggerRef}
        className="color-picker-trigger"
        onClick={handleToggle}
        style={{ backgroundColor: value }}
        title={label || `Clique para alterar a cor (${value})`}
      />
      
      {isOpen && (
        <div 
          ref={popupRef}
          className="color-picker-popup"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`
          }}
        >
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
          
          {/* Botão de pinça */}
          <div className="color-picker-actions">
            <div style={{ position: 'relative' }}>
              <button
                ref={eyeDropperButtonRef}
                type="button"
                className={`color-picker-eyedropper ${isEyeDropperActive ? 'active' : ''}`}
                onClick={handleEyeDropper}
                title={isEyeDropperActive ? "Clique para desativar a pinça" : "Selecionar cor da tela (pinça)"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                  <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
                  <path d="M16.5 18.5l-1.5-1.5 4-4 1.5 1.5-4 4z" fill="currentColor"/>
                  <path d="M19.5 19.5l-1.5-1.5 1-1 1.5 1.5-1 1z" fill="currentColor"/>
                </svg>
                <span>Pinça</span>
              </button>
              {/* Overlay invisível para proteger o botão quando a pinça está ativa */}
              {isEyeDropperActive && (
                <div
                  className="color-picker-eyedropper-overlay"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEyeDropper(e);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

