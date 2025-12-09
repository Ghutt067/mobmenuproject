import { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './PromoBanner.css';

// Estilos inline para as animações e barra promocional
const animationStyles = `
  .promo-banner {
    width: 100%;
    padding: 12px 16px;
    text-align: center;
    background-color: #E8E8E8;
    box-sizing: border-box;
  }
  .promo-text {
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @keyframes blinkAnimation {
    0%, 50%, 100% { opacity: 1; }
    25%, 75% { opacity: 0.3; }
  }
  @keyframes slideAnimation {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(10px); }
  }
  @keyframes pulseAnimation {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  .promo-text.animation-blink {
    animation: blinkAnimation var(--animation-speed, 1s) ease-in-out infinite;
  }
  .promo-text.animation-slide {
    animation: slideAnimation var(--animation-speed, 2s) ease-in-out infinite;
    white-space: nowrap;
    overflow: visible;
    display: inline-block;
  }
  .promo-text.animation-pulse {
    animation: pulseAnimation var(--animation-speed, 1.5s) ease-in-out infinite;
  }
  .promo-text.animation-shimmer {
    position: relative;
    display: inline-block;
    background-size: 250% 100%, auto;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-repeat: no-repeat, padding-box;
    background-image: 
      linear-gradient(90deg, 
        transparent calc(50% - var(--spread, 50px)), 
        rgba(255, 255, 255, 0) calc(50% - var(--spread, 50px) + 15px),
        rgba(255, 255, 255, 0.3) calc(50% - var(--spread, 50px) + 25px),
        rgba(255, 255, 255, 0.6) calc(50% - var(--spread, 50px) + 35px),
        rgba(255, 255, 255, 0.9) calc(50% - 10px),
        rgba(255, 255, 255, 0.95) calc(50% - 5px),
        rgba(255, 255, 255, 0.95) calc(50% + 5px),
        rgba(255, 255, 255, 0.9) calc(50% + 10px),
        rgba(255, 255, 255, 0.6) calc(50% + var(--spread, 50px) - 35px),
        rgba(255, 255, 255, 0.3) calc(50% + var(--spread, 50px) - 25px),
        rgba(255, 255, 255, 0) calc(50% + var(--spread, 50px) - 15px),
        transparent calc(50% + var(--spread, 50px))
      ),
      linear-gradient(var(--text-color, #000), var(--text-color, #000));
    animation: shimmerAnimation var(--animation-speed, 2s) linear infinite;
  }
  @keyframes shimmerAnimation {
    0% { background-position: 100% center, 0% center; }
    100% { background-position: 0% center, 0% center; }
  }
`;

const PromoBanner = () => {
  const { store, reloadCustomizations } = useStore();
  const { user } = useAuth();
  const location = useLocation();
  
  const customization = store?.customizations;
  
  // Verificar se está em modo admin - APENAS quando estiver em rota admin
  // A edição só é permitida quando estiver em uma rota admin, não apenas quando autenticado
  const isAdminMode = location.pathname.startsWith('/admin') || location.pathname.includes('/admin');
  
  // Estados para edição inline
  const [isEditingPromoText, setIsEditingPromoText] = useState(false);
  const [editingPromoText, setEditingPromoText] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Se o banner não deve aparecer, não renderizar
  if (customization && !customization.promoBannerVisible) {
    return null;
  }
  
  const text = customization?.promoBannerText || '';
  // Se o texto estiver vazio, não mostrar o banner
  if (!text || text.trim() === '') {
    return null;
  }
  
  const bgColor = customization?.promoBannerBgColor || '#E8E8E8';
  const textColor = customization?.promoBannerTextColor || '#000000';
  const useGradient = customization?.promoBannerUseGradient ?? true;
  const animation = (customization?.promoBannerAnimation && customization.promoBannerAnimation !== 'none') ? customization.promoBannerAnimation : 'blink';
  const animationSpeed = customization?.promoBannerAnimationSpeed ?? 1;
  
  // Funções para edição inline
  const handlePromoTextDoubleClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdminMode) {
      console.log('Modo admin não ativo', { user, pathname: location.pathname });
      return;
    }
    console.log('Iniciando edição do banner');
    setIsEditingPromoText(true);
    setEditingPromoText(text);
  };

  const handlePromoTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingPromoText(e.target.value);
  };

  const handlePromoTextSave = async () => {
    if (!editingPromoText.trim() || !store?.id) {
      setIsEditingPromoText(false);
      return;
    }

    const newText = editingPromoText.trim();
    
    // Se o texto não mudou, apenas cancelar a edição
    if (newText === text) {
      setIsEditingPromoText(false);
      setEditingPromoText('');
      return;
    }

    setSaving(true);

    try {
      const { data: existingCustomization } = await supabase
        .from('store_customizations')
        .select('id')
        .eq('store_id', store.id)
        .maybeSingle();

      const updateData = {
        promo_banner_text: newText,
        updated_at: new Date().toISOString()
      };

      if (existingCustomization) {
        const { error: updateError } = await supabase
          .from('store_customizations')
          .update(updateData)
          .eq('store_id', store.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('store_customizations')
          .insert({
            store_id: store.id,
            promo_banner_visible: customization?.promoBannerVisible ?? true,
            promo_banner_bg_color: bgColor,
            promo_banner_text_color: textColor,
            promo_banner_use_gradient: useGradient,
            ...updateData
          });

        if (insertError) throw insertError;
      }

      // Recarregar customizações
      await reloadCustomizations();
      setIsEditingPromoText(false);
      setEditingPromoText('');
    } catch (error: any) {
      console.error('Erro ao salvar texto do banner:', error);
      setIsEditingPromoText(false);
      setEditingPromoText('');
    } finally {
      setSaving(false);
    }
  };

  const handlePromoTextCancel = () => {
    setIsEditingPromoText(false);
    setEditingPromoText('');
  };

  const handlePromoTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePromoTextSave();
    } else if (e.key === 'Escape') {
      handlePromoTextCancel();
    }
  };
  
  return (
    <>
      <style>{animationStyles}</style>
      <section 
        className="promo-banner"
        style={{ backgroundColor: bgColor }}
      >
      {isEditingPromoText ? (
        <input
          type="text"
          value={editingPromoText}
          onChange={handlePromoTextChange}
          onBlur={handlePromoTextSave}
          onKeyDown={handlePromoTextKeyDown}
          autoFocus
          disabled={saving}
          style={{
            fontSize: '16px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: 0,
            border: '2px solid #007bff',
            borderRadius: '4px',
            padding: '4px 8px',
            width: '100%',
            maxWidth: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            fontFamily: 'inherit',
            opacity: saving ? 0.6 : 1
          }}
        />
      ) : (
        <p 
          className={`promo-text ${useGradient ? `animation-${animation}` : ''}`}
          onDoubleClick={handlePromoTextDoubleClick}
          onClick={(e) => {
            // Prevenir que cliques simples interfiram
            if (isAdminMode) {
              e.stopPropagation();
            }
          }}
          style={{
            // Aplicar cor sempre, exceto para animações que usam gradiente (rotate) ou shimmer
            color: animation !== 'rotate' && animation !== 'shimmer' ? textColor : undefined,
            ...(animation === 'shimmer' ? {
              '--text-color': textColor,
              '--spread': '50px'
            } : {}),
            ...(isAdminMode ? { cursor: 'pointer', userSelect: 'none' } : {}),
            ...(useGradient ? {
              '--animation-speed': (() => {
                // Durações base para cada animação (mais lentas)
                const baseDuration = animation === 'blink' ? 2 : animation === 'slide' ? 4 : animation === 'shimmer' ? 2 : 3;
                // Calcular duração: quanto maior a velocidade, menor a duração
                const calculatedDuration = baseDuration / animationSpeed;
                return `${calculatedDuration}s`;
              })()
            } : {})
          } as React.CSSProperties}
          title={isAdminMode ? 'Clique duas vezes para editar' : undefined}
        >
          {text}
        </p>
      )}
    </section>
    </>
  );
};

export default PromoBanner;

