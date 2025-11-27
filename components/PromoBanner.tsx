import { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './PromoBanner.css';

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
  
  const text = customization?.promoBannerText || 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF';
  const bgColor = customization?.promoBannerBgColor || '#FDD8A7';
  const textColor = customization?.promoBannerTextColor || '#000000';
  const useGradient = customization?.promoBannerUseGradient ?? true;
  const animation = (customization?.promoBannerAnimation && customization.promoBannerAnimation !== 'none') ? customization.promoBannerAnimation : 'gradient';
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
            ...(!useGradient ? { color: textColor } : {}),
            ...(isAdminMode ? { cursor: 'pointer', userSelect: 'none' } : {}),
            ...(useGradient ? {
              '--animation-speed': animationSpeed
            } : {})
          } as React.CSSProperties}
          title={isAdminMode ? 'Clique duas vezes para editar' : undefined}
        >
          {text}
        </p>
      )}
    </section>
  );
};

export default PromoBanner;

