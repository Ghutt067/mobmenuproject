import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../contexts/StoreContext';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import ColorPicker from '../../components/ColorPicker';
import CustomDropdown from '../../components/CustomDropdown';
import addImageIcon from '../../icons/addimage.svg';
import trashIcon from '../../icons/trash-svgrepo-com.svg';
import { deleteImageFromStorage } from '../../utils/storageHelper';
import { compressImageIfNeeded, compressBlobIfNeeded } from '../../utils/imageHelper';
import { getAllProducts, type Product } from '../../services/productService';
import { getProductImage } from '../../utils/imageHelper';
import { formatPrice } from '../../utils/priceFormatter';
import './Personalization.css';
import '../../components/PromoBanner.css';

// Estilos inline para as animações do banner promocional
const promoBannerAnimationStyles = `
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
  @keyframes shimmerAnimation {
    0% { background-position: 100% center, 0% center; }
    100% { background-position: 0% center, 0% center; }
  }
`;

export default function AdminPersonalization() {
  const { store, loading: storeLoading, loadStoreByAdminUser, reloadCustomizations } = useStore();
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 450, height: 450 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, containerX: 0, containerY: 0 });
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);
  
  // Estados para edição da foto de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedProfileImageFile, setSelectedProfileImageFile] = useState<File | null>(null);
  const [imageToEditProfile, setImageToEditProfile] = useState<string | null>(null);
  const [cropDataProfile, setCropDataProfile] = useState({ x: 0, y: 0, width: 500, height: 500 });
  const [imageSizeProfile, setImageSizeProfile] = useState({ width: 0, height: 0 });
  const [scaleProfile, setScaleProfile] = useState(1);
  const profileImageRef = useRef<HTMLImageElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingProfileRef = useRef(false);
  const dragStartProfileRef = useRef({ x: 0, y: 0, containerX: 0, containerY: 0 });
  const pinchStartProfileRef = useRef<{ distance: number; scale: number } | null>(null);
  const lastTouchDistanceProfileRef = useRef<number | null>(null);
  
  // Estados para PromoBanner
  const [promoBannerVisible, setPromoBannerVisible] = useState(true);
  const [promoBannerText, setPromoBannerText] = useState('');
  const [promoBannerBgColor, setPromoBannerBgColor] = useState('#E8E8E8');
  const [promoBannerTextColor, setPromoBannerTextColor] = useState('#000000');
  const [promoBannerUseGradient, setPromoBannerUseGradient] = useState(true);
  const [promoBannerAnimation, setPromoBannerAnimation] = useState<string>('blink');
  const [promoBannerAnimationSpeed, setPromoBannerAnimationSpeed] = useState<number>(1);
  const [savingPromoBanner, setSavingPromoBanner] = useState(false);

  // Estados para edição inline do texto do banner
  const [isEditingPromoText, setIsEditingPromoText] = useState(false);
  const [editingPromoText, setEditingPromoText] = useState('');

  // Estados para cores da loja
  const [primaryColor, setPrimaryColor] = useState('#808080');
  const [secondaryColor, setSecondaryColor] = useState('#2C3E50');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [textColor, setTextColor] = useState('#000000');
  const [savingColors, setSavingColors] = useState(false);

  // Estado para exibir botão de comprar
  const [showBuyButton, setShowBuyButton] = useState(true);
  const [savingBuyButton, setSavingBuyButton] = useState(false);
  
  // Estado para botões de alto contraste
  const [highContrastButtons, setHighContrastButtons] = useState(true);
  const [savingHighContrastButtons, setSavingHighContrastButtons] = useState(false);
  
  // Refs para controle de salvamento do botão de comprar
  const isInitialBuyButtonLoadRef = useRef(true);
  const previousBuyButtonValueRef = useRef<boolean | null>(null);
  
  // Refs para controle de salvamento dos botões de alto contraste
  const isInitialHighContrastButtonsLoadRef = useRef(true);
  const previousHighContrastButtonsValueRef = useRef<boolean | null>(null);

  // Refs para controle de salvamento do botão flutuante
  const isInitialFixedButtonLoadRef = useRef(true);
  const previousFixedButtonValueRef = useRef<boolean | null>(null);

  // Estados para produtos recomendados
  const [recommendedProductIds, setRecommendedProductIds] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchProductTerm, setSearchProductTerm] = useState('');
  const [savingRecommendedProducts, setSavingRecommendedProducts] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [searchAddProductTerm, setSearchAddProductTerm] = useState('');
  const [showAddProductChoiceModal, setShowAddProductChoiceModal] = useState(false);

  // Estados para pedido mínimo
  const [minimumOrderValue, setMinimumOrderValue] = useState<number>(0);
  const [minimumOrderValueDisplay, setMinimumOrderValueDisplay] = useState<string>('0,00');
  const [savingMinimumOrder, setSavingMinimumOrder] = useState(false);

  // Estado para botão flutuante
  const [showFixedButton, setShowFixedButton] = useState(true);
  const [savingFixedButton, setSavingFixedButton] = useState(false);

  
  // Refs para controle de salvamento dos produtos recomendados
  const isInitialRecommendedProductsLoadRef = useRef(true);
  const previousRecommendedProductsRef = useRef<string[] | null>(null);

  // Refs para controle de salvamento automático
  const previousValuesRef = useRef<{
    promoBannerVisible: boolean;
    promoBannerText: string;
    promoBannerBgColor: string;
    promoBannerTextColor: string;
    promoBannerUseGradient: boolean;
    promoBannerAnimation: string;
    promoBannerAnimationSpeed: number;
  } | null>(null);


  const previousColorsRef = useRef<{
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  } | null>(null);

  // Aguardar AuthContext terminar de carregar
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!store && !storeLoading && user) {
      loadStoreByAdminUser(user.id);
      return;
    }

    if (store?.customizations?.logoUrl) {
      setLogoPreview(store.customizations.logoUrl);
    } else {
      setLogoPreview(null);
    }

    if (store?.customizations?.profileImageUrl) {
      setProfileImagePreview(store.customizations.profileImageUrl);
    } else {
      setProfileImagePreview(null);
    }
    
    // Carregar valores do PromoBanner - usar exatamente os mesmos valores que o componente PromoBanner usa
    // Isso garante que o formulário mostre o valor que está sendo exibido no site
    if (store) {
      const customization = store.customizations;
      // Usar a mesma lógica do PromoBanner para determinar os valores
      // O PromoBanner usa: customization?.promoBannerText || ''
      // Então se promoBannerText for undefined/null, mostrar o padrão
      const textToShow = customization?.promoBannerText || '';
      const bgColorToShow = customization?.promoBannerBgColor || '#E8E8E8';
      const textColorToShow = customization?.promoBannerTextColor || '#000000';
      const visible = customization?.promoBannerVisible ?? true;
      const useGradient = customization?.promoBannerUseGradient ?? true;
      const animation = (customization?.promoBannerAnimation && customization.promoBannerAnimation !== 'none') ? customization.promoBannerAnimation : 'blink';
      const animationSpeed = customization?.promoBannerAnimationSpeed ?? 1;
      
      // Só atualizar os estados se os valores realmente mudaram (evitar resetar valores que o usuário acabou de selecionar)
      setPromoBannerVisible(prev => prev !== visible ? visible : prev);
      setPromoBannerText(prev => prev !== textToShow ? textToShow : prev);
      setPromoBannerBgColor(prev => prev !== bgColorToShow ? bgColorToShow : prev);
      setPromoBannerTextColor(prev => prev !== textColorToShow ? textColorToShow : prev);
      setPromoBannerUseGradient(prev => prev !== useGradient ? useGradient : prev);
      setPromoBannerAnimation(prev => prev !== animation ? animation : prev);
      setPromoBannerAnimationSpeed(prev => prev !== animationSpeed ? animationSpeed : prev);

      // Atualizar valores anteriores quando carregar do banco (para evitar salvamento desnecessário)
      previousValuesRef.current = {
        promoBannerVisible: visible,
        promoBannerText: textToShow,
        promoBannerBgColor: bgColorToShow,
        promoBannerTextColor: textColorToShow,
        promoBannerUseGradient: useGradient,
        promoBannerAnimation: animation,
        promoBannerAnimationSpeed: animationSpeed
      };

      // Carregar valores das cores da loja
      const primaryColorToShow = customization?.primaryColor || '#808080';
      const secondaryColorToShow = customization?.secondaryColor || '#2C3E50';
      const backgroundColorToShow = customization?.backgroundColor || '#FFFFFF';
      const storeTextColorToShow = customization?.textColor || '#000000';

      setPrimaryColor(primaryColorToShow);
      setSecondaryColor(secondaryColorToShow);
      setBackgroundColor(backgroundColorToShow);
      setTextColor(storeTextColorToShow);

      // Atualizar valores anteriores das cores
      previousColorsRef.current = {
        primaryColor: primaryColorToShow,
        secondaryColor: secondaryColorToShow,
        backgroundColor: backgroundColorToShow,
        textColor: storeTextColorToShow
      };

      // Carregar valor de exibir botão de comprar
      const showBuyButtonToShow = customization?.showBuyButton ?? true;
      setShowBuyButton(showBuyButtonToShow);
      // Resetar refs quando carregar do banco
      isInitialBuyButtonLoadRef.current = true;
      previousBuyButtonValueRef.current = showBuyButtonToShow;
      
      // Carregar valor de botões de alto contraste
      const highContrastButtonsToShow = customization?.highContrastButtons ?? true;
      setHighContrastButtons(highContrastButtonsToShow);
      // Resetar refs quando carregar do banco
      isInitialHighContrastButtonsLoadRef.current = true;
      previousHighContrastButtonsValueRef.current = highContrastButtonsToShow;

      // Carregar produtos recomendados
      const recommendedIds = customization?.recommendedProductIds || [];
      // Marcar que estamos carregando do banco
      isLoadingRecommendedProductsFromDatabaseRef.current = true;
      // Resetar refs ANTES de setar o valor para evitar salvamento automático na primeira carga
      isInitialRecommendedProductsLoadRef.current = true;
      previousRecommendedProductsRef.current = recommendedIds;
      setRecommendedProductIds(recommendedIds);
      // Marcar que terminamos de carregar (usar setTimeout para garantir que o useEffect de salvamento já executou)
      setTimeout(() => {
        isLoadingRecommendedProductsFromDatabaseRef.current = false;
      }, 100);

      // Carregar valor mínimo do pedido
      const minOrderValue = customization?.minimumOrderValue ?? 0;
      // Marcar que estamos carregando do banco
      isLoadingFromDatabaseRef.current = true;
      // Resetar refs ANTES de setar o valor para evitar salvamento automático na primeira carga
      isInitialMinimumOrderLoadRef.current = true;
      previousMinimumOrderValueRef.current = minOrderValue;
      setMinimumOrderValue(minOrderValue);
      // Converter centavos para reais para exibição
      const minOrderInReais = minOrderValue / 100;
      setMinimumOrderValueDisplay(minOrderInReais.toFixed(2).replace('.', ','));
      // Marcar que terminamos de carregar (usar setTimeout para garantir que o useEffect de salvamento já executou)
      setTimeout(() => {
        isLoadingFromDatabaseRef.current = false;
      }, 100);

      // Carregar valor de exibir botão flutuante
      const showFixedButtonToShow = customization?.showFixedButton ?? true;
      setShowFixedButton(showFixedButtonToShow);
      // Só resetar refs se for realmente a primeira carga (ref ainda não foi inicializado)
      if (previousFixedButtonValueRef.current === null) {
        isInitialFixedButtonLoadRef.current = true;
        previousFixedButtonValueRef.current = showFixedButtonToShow;
      }
    }
  }, [store, store?.customizations]);

  // Carregar produtos disponíveis
  useEffect(() => {
    const loadProducts = async () => {
      if (!store?.id) {
        return;
      }
      
      setProductsLoading(true);
      try {
        const products = await getAllProducts(store.id);
        setAvailableProducts(products);
        console.log('✅ Produtos carregados para recomendados:', products.length);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setMessage('❌ Erro ao carregar produtos. Tente recarregar a página.');
      } finally {
        setProductsLoading(false);
      }
    };

    if (store?.id && !storeLoading && !authLoading) {
      loadProducts();
    }
  }, [store?.id, storeLoading, authLoading]);

  // Centralizar imagem quando o editor abrir
  useEffect(() => {
    if (!isEditing || !imageToEdit || !imageSize.width || !imageSize.height) {
      // Se não há imagem, resetar cropData
      if (!isEditing) {
        setCropData({ x: 0, y: 0, width: 0, height: 0 });
      }
      return;
    }
    
    const container = containerRef.current;
    if (!container) {
      // Tentar novamente se o container não estiver disponível
      const retryTimeout = setTimeout(() => {
        if (containerRef.current) {
          // Forçar re-render
          setCropData(prev => ({ ...prev }));
        }
      }, 50);
      return () => clearTimeout(retryTimeout);
    }
    
    // Função para calcular e centralizar a imagem
    const calculateAndCenterImage = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      if (containerWidth === 0 || containerHeight === 0) {
        // Se o container ainda não tem dimensões, tentar novamente
        requestAnimationFrame(calculateAndCenterImage);
        return;
      }
      
      // Obter o overlay (área de crop 1920x840)
      const overlay = container.querySelector('.overlay') as HTMLElement;
      if (!overlay) {
        // Se o overlay ainda não existe, tentar novamente
        requestAnimationFrame(calculateAndCenterImage);
        return;
      }
      
      const overlayRect = overlay.getBoundingClientRect();
      const overlayWidth = overlayRect.width;
      const overlayHeight = overlayRect.height;
      
      if (overlayWidth === 0 || overlayHeight === 0) {
        requestAnimationFrame(calculateAndCenterImage);
        return;
      }
      
      // Calcular posição do overlay em relação ao container
      const overlayLeft = overlayRect.left - containerRect.left;
      const overlayTop = overlayRect.top - containerRect.top;
      
      // Calcular tamanho inicial para preencher completamente o overlay usando object-fit: cover
      const cropAspect = 1920 / 840; // 2.2857...
      const imgAspect = imageSize.width / imageSize.height;
      
      let initialWidth: number;
      let initialHeight: number;
      
      // Sempre preencher completamente o overlay usando object-fit: cover
      if (imgAspect > cropAspect) {
        // Imagem é mais larga - preencher altura do overlay e deixar largura maior
        initialHeight = overlayHeight;
        initialWidth = initialHeight * imgAspect;
      } else {
        // Imagem é mais alta - preencher largura do overlay e deixar altura maior
        initialWidth = overlayWidth;
        initialHeight = initialWidth / imgAspect;
      }
      
      // Garantir que a imagem preencha completamente o overlay (nunca menor)
      if (initialWidth < overlayWidth) {
        const scale = overlayWidth / initialWidth;
        initialWidth = overlayWidth;
        initialHeight = initialHeight * scale;
      }
      if (initialHeight < overlayHeight) {
        const scale = overlayHeight / initialHeight;
        initialHeight = overlayHeight;
        initialWidth = initialWidth * scale;
      }
      
      // SEMPRE centralizar a imagem dentro do overlay (área de crop)
      const centerX = overlayLeft + (overlayWidth - initialWidth) / 2;
      const centerY = overlayTop + (overlayHeight - initialHeight) / 2;
      
      console.log('Centralizando imagem:', {
        overlayWidth,
        overlayHeight,
        overlayLeft,
        overlayTop,
        initialWidth,
        initialHeight,
        centerX,
        centerY,
        imgAspect: imageSize.width / imageSize.height,
        cropAspect: 1920 / 840
      });
      
      // Atualizar o estado
      setCropData({ 
        x: Math.round(centerX), 
        y: Math.round(centerY), 
        width: Math.round(initialWidth), 
        height: Math.round(initialHeight) 
      });
      setScale(1);
    };
    
    // Aguardar múltiplos frames para garantir que o DOM esteja completamente renderizado
    let timeoutId: ReturnType<typeof setTimeout>;
    let rafId: number;
    
    const scheduleCalculation = () => {
      // Primeiro, tentar calcular imediatamente
      calculateAndCenterImage();
      
      // Depois, agendar recálculo após um pequeno delay para garantir que está correto
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          requestAnimationFrame(calculateAndCenterImage);
        });
      }, 200);
    };
    
    scheduleCalculation();
    
    // Também recalcular quando a janela for redimensionada
    const handleResize = () => {
      requestAnimationFrame(calculateAndCenterImage);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isEditing, imageToEdit, imageSize.width, imageSize.height]);

  // Prevenir scroll do body quando o modal estiver aberto
  useEffect(() => {
    if (isEditing) {
      // Salvar o valor atual do overflow
      const originalOverflow = document.body.style.overflow;
      // Desabilitar scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar o scroll quando o modal fechar
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isEditing]);

  // Limpar mensagem automaticamente após 3 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Ref para rastrear se é o carregamento inicial (não salvar na primeira renderização)
  const isInitialLoadRef = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // Salvar automaticamente quando os valores do banner mudarem
  useEffect(() => {
    // Ignorar na primeira renderização (quando os valores são carregados do banco)
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      // Salvar os valores iniciais para comparação futura
      previousValuesRef.current = {
        promoBannerVisible,
        promoBannerText,
        promoBannerBgColor,
        promoBannerTextColor,
        promoBannerUseGradient,
        promoBannerAnimation,
        promoBannerAnimationSpeed
      };
      return;
    }

    // Não salvar se não houver store ou se estiver carregando
    if (!store?.id || storeLoading || authLoading) {
      return;
    }

    // Não salvar se já estiver salvando
    if (isSavingRef.current) {
      return;
    }

    // Comparar com valores anteriores para verificar se realmente mudou
    const previous = previousValuesRef.current;
    if (previous) {
      const hasChanged = 
        previous.promoBannerVisible !== promoBannerVisible ||
        previous.promoBannerText !== promoBannerText ||
        previous.promoBannerBgColor !== promoBannerBgColor ||
        previous.promoBannerTextColor !== promoBannerTextColor ||
        previous.promoBannerUseGradient !== promoBannerUseGradient ||
        previous.promoBannerAnimation !== promoBannerAnimation ||
        previous.promoBannerAnimationSpeed !== promoBannerAnimationSpeed ||
        previous.promoBannerAnimationSpeed !== promoBannerAnimationSpeed;

      // Se não mudou nada, não salvar
      if (!hasChanged) {
        return;
      }
    }

    // Limpar timeout anterior se existir
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: aguardar 800ms após a última mudança antes de salvar
    setSavingPromoBanner(true);
    saveTimeoutRef.current = setTimeout(async () => {
      isSavingRef.current = true;
      try {
        // Buscar customização existente
        const { data: existingCustomization } = await supabase
          .from('store_customizations')
          .select('id')
          .eq('store_id', store.id)
          .maybeSingle();

        const updateData = {
          promo_banner_visible: promoBannerVisible,
          promo_banner_text: promoBannerText,
          promo_banner_bg_color: promoBannerBgColor,
          promo_banner_text_color: promoBannerTextColor,
          promo_banner_use_gradient: promoBannerUseGradient,
          promo_banner_animation: promoBannerAnimation,
          promo_banner_animation_speed: promoBannerAnimationSpeed,
          updated_at: new Date().toISOString()
        };

        if (existingCustomization) {
          // Atualizar existente - tentar com campos de animação primeiro
          let { error: updateError } = await supabase
            .from('store_customizations')
            .update(updateData)
            .eq('store_id', store.id);

          // Se der erro porque as colunas não existem, tentar sem elas
          if (updateError && updateError.message?.includes('promo_banner_animation')) {
            const updateDataBase = {
              promo_banner_visible: promoBannerVisible,
              promo_banner_text: promoBannerText,
              promo_banner_bg_color: promoBannerBgColor,
              promo_banner_text_color: promoBannerTextColor,
              promo_banner_use_gradient: promoBannerUseGradient,
              updated_at: new Date().toISOString()
            };
            const { error: updateErrorBase } = await supabase
              .from('store_customizations')
              .update(updateDataBase)
              .eq('store_id', store.id);
            if (updateErrorBase) throw updateErrorBase;
          } else if (updateError) {
            throw updateError;
          }
        } else {
          // Criar novo
          const { error: insertError } = await supabase
            .from('store_customizations')
            .insert({
              store_id: store.id,
              ...updateData
            });

          if (insertError) throw insertError;
        }

        // Atualizar valores anteriores para evitar salvamento duplicado
        previousValuesRef.current = {
          promoBannerVisible,
          promoBannerText,
          promoBannerBgColor,
          promoBannerTextColor,
          promoBannerUseGradient,
          promoBannerAnimation,
          promoBannerAnimationSpeed
        };

        // Não recarregar customizações aqui para evitar resetar os valores que o usuário acabou de selecionar
        // Os valores já estão corretos no estado, não precisamos recarregar do banco
        setMessage('✅ Personalização do banner atualizada!');
      } catch (error: any) {
        console.error('Erro ao salvar personalização do banner:', error);
        setMessage(`❌ Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setSavingPromoBanner(false);
        isSavingRef.current = false;
      }
    }, 800);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [promoBannerVisible, promoBannerText, promoBannerBgColor, promoBannerTextColor, promoBannerUseGradient, promoBannerAnimation, promoBannerAnimationSpeed, store?.id, storeLoading, authLoading]);

  // Ref para rastrear se é o carregamento inicial das cores
  const isInitialColorsLoadRef = useRef(true);
  const saveColorsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingColorsRef = useRef(false);

  // Salvar automaticamente quando as cores mudarem
  useEffect(() => {
    // Ignorar na primeira renderização (quando os valores são carregados do banco)
    if (isInitialColorsLoadRef.current) {
      isInitialColorsLoadRef.current = false;
      // Salvar os valores iniciais para comparação futura
      previousColorsRef.current = {
        primaryColor,
        secondaryColor,
        backgroundColor,
        textColor
      };
      return;
    }

    // Não salvar se não houver store ou se estiver carregando
    if (!store?.id || storeLoading || authLoading) {
      return;
    }

    // Não salvar se já estiver salvando
    if (isSavingColorsRef.current) {
      return;
    }

    // Comparar com valores anteriores para verificar se realmente mudou
    const previous = previousColorsRef.current;
    if (previous) {
      const hasChanged = 
        previous.primaryColor !== primaryColor ||
        previous.secondaryColor !== secondaryColor ||
        previous.backgroundColor !== backgroundColor ||
        previous.textColor !== textColor;

      // Se não mudou nada, não salvar
      if (!hasChanged) {
        return;
      }
    }

    // Limpar timeout anterior se existir
    if (saveColorsTimeoutRef.current) {
      clearTimeout(saveColorsTimeoutRef.current);
    }

    // Debounce: aguardar 800ms após a última mudança antes de salvar
    setSavingColors(true);
    saveColorsTimeoutRef.current = setTimeout(async () => {
      isSavingColorsRef.current = true;
      try {
        // Buscar customização existente
        const { data: existingCustomization } = await supabase
          .from('store_customizations')
          .select('id')
          .eq('store_id', store.id)
          .maybeSingle();

        const updateData = {
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          background_color: backgroundColor,
          text_color: textColor,
          updated_at: new Date().toISOString()
        };

        if (existingCustomization) {
          // Atualizar existente
          const { error: updateError } = await supabase
            .from('store_customizations')
            .update(updateData)
            .eq('store_id', store.id);

          if (updateError) throw updateError;
        } else {
          // Criar novo
          const { error: insertError } = await supabase
            .from('store_customizations')
            .insert({
              store_id: store.id,
              ...updateData
            });

          if (insertError) throw insertError;
        }

        // Atualizar valores anteriores para evitar salvamento duplicado
        previousColorsRef.current = {
          primaryColor,
          secondaryColor,
          backgroundColor,
          textColor
        };

        // Recarregar customizações (sem atualizar os estados para evitar loop)
        await reloadCustomizations();
        setMessage('✅ Cores da loja atualizadas!');
      } catch (error: any) {
        console.error('Erro ao salvar cores da loja:', error);
        setMessage(`❌ Erro ao salvar cores: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setSavingColors(false);
        isSavingColorsRef.current = false;
      }
    }, 800);

    // Cleanup
    return () => {
      if (saveColorsTimeoutRef.current) {
        clearTimeout(saveColorsTimeoutRef.current);
      }
    };
  }, [primaryColor, secondaryColor, backgroundColor, textColor, store?.id, storeLoading, authLoading, reloadCustomizations]);

  // Refs para timeout e controle de salvamento do botão de comprar
  const saveBuyButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingBuyButtonRef = useRef(false);

  // Salvar automaticamente quando showBuyButton mudar
  useEffect(() => {
    // Ignorar na primeira renderização
    if (isInitialBuyButtonLoadRef.current) {
      isInitialBuyButtonLoadRef.current = false;
      previousBuyButtonValueRef.current = showBuyButton;
      return;
    }

    // Não salvar se não houver store ou se estiver carregando
    if (!store?.id || storeLoading || authLoading) {
      return;
    }

    // Não salvar se o valor não mudou
    if (previousBuyButtonValueRef.current === showBuyButton) {
      return;
    }

    // Não salvar se já estiver salvando
    if (isSavingBuyButtonRef.current) {
      return;
    }

    // Atualizar valor anterior
    previousBuyButtonValueRef.current = showBuyButton;

    // Limpar timeout anterior se existir
    if (saveBuyButtonTimeoutRef.current) {
      clearTimeout(saveBuyButtonTimeoutRef.current);
    }

    // Debounce: aguardar 500ms após a última mudança antes de salvar
    saveBuyButtonTimeoutRef.current = setTimeout(async () => {
      isSavingBuyButtonRef.current = true;
      setSavingBuyButton(true);
      try {
        // Buscar customização existente
        const { data: existingCustomization } = await supabase
          .from('store_customizations')
          .select('id')
          .eq('store_id', store.id)
          .maybeSingle();

        const updateData = {
          show_buy_button: showBuyButton,
          updated_at: new Date().toISOString()
        };

        if (existingCustomization) {
          // Atualizar existente
          const { error: updateError } = await supabase
            .from('store_customizations')
            .update(updateData)
            .eq('store_id', store.id);

          if (updateError) {
            console.error('Erro ao atualizar show_buy_button:', updateError);
            throw updateError;
          }
        } else {
          // Criar novo
          const { error: insertError } = await supabase
            .from('store_customizations')
            .insert({
              store_id: store.id,
              ...updateData
            });

          if (insertError) {
            console.error('Erro ao inserir show_buy_button:', insertError);
            throw insertError;
          }
        }

        // Recarregar customizações
        await reloadCustomizations();
        setMessage('✅ Configuração do botão de comprar atualizada!');
      } catch (error: any) {
        console.error('Erro ao salvar configuração do botão de comprar:', error);
        setMessage(`❌ Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
        // Reverter o valor em caso de erro
        previousBuyButtonValueRef.current = !showBuyButton;
        setShowBuyButton(!showBuyButton);
      } finally {
        setSavingBuyButton(false);
        isSavingBuyButtonRef.current = false;
      }
    }, 500);

    // Cleanup
    return () => {
      if (saveBuyButtonTimeoutRef.current) {
        clearTimeout(saveBuyButtonTimeoutRef.current);
      }
    };
  }, [showBuyButton, store?.id, storeLoading, authLoading, reloadCustomizations]);

  // Refs para timeout e controle de salvamento dos botões de alto contraste
  const saveHighContrastButtonsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingHighContrastButtonsRef = useRef(false);

  // Salvar automaticamente quando highContrastButtons mudar
  useEffect(() => {
    // Ignorar na primeira renderização
    if (isInitialHighContrastButtonsLoadRef.current) {
      isInitialHighContrastButtonsLoadRef.current = false;
      previousHighContrastButtonsValueRef.current = highContrastButtons;
      return;
    }

    // Não salvar se não houver store ou se estiver carregando
    if (!store?.id || storeLoading || authLoading) {
      return;
    }

    // Não salvar se o valor não mudou
    if (previousHighContrastButtonsValueRef.current === highContrastButtons) {
      return;
    }

    // Não salvar se já estiver salvando
    if (isSavingHighContrastButtonsRef.current) {
      return;
    }

    // Atualizar valor anterior
    previousHighContrastButtonsValueRef.current = highContrastButtons;

    // Limpar timeout anterior se existir
    if (saveHighContrastButtonsTimeoutRef.current) {
      clearTimeout(saveHighContrastButtonsTimeoutRef.current);
    }

    // Aguardar 500ms antes de salvar (debounce)
    saveHighContrastButtonsTimeoutRef.current = setTimeout(async () => {
      isSavingHighContrastButtonsRef.current = true;
      setSavingHighContrastButtons(true);

      try {
        const { data: existingCustomization } = await supabase
          .from('store_customizations')
          .select('id')
          .eq('store_id', store.id)
          .maybeSingle();

        const updateData = {
          high_contrast_buttons: highContrastButtons,
          updated_at: new Date().toISOString()
        };

        if (existingCustomization) {
          // Atualizar existente
          const { error } = await supabase
            .from('store_customizations')
            .update(updateData)
            .eq('store_id', store.id);

          if (error) throw error;
        } else {
          // Criar novo
          const { error } = await supabase
            .from('store_customizations')
            .insert({
              store_id: store.id,
              ...updateData
            });

          if (error) throw error;
        }

        // Recarregar customizações
        await reloadCustomizations();
        setMessage('✅ Configuração de botões de alto contraste atualizada!');
      } catch (error: any) {
        console.error('Erro ao salvar configuração de botões de alto contraste:', error);
        setMessage(`❌ Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
        // Reverter o valor em caso de erro
        previousHighContrastButtonsValueRef.current = !highContrastButtons;
        setHighContrastButtons(!highContrastButtons);
      } finally {
        setSavingHighContrastButtons(false);
        isSavingHighContrastButtonsRef.current = false;
      }
    }, 500);

    return () => {
      if (saveHighContrastButtonsTimeoutRef.current) {
        clearTimeout(saveHighContrastButtonsTimeoutRef.current);
      }
    };
  }, [highContrastButtons, store?.id, storeLoading, authLoading, reloadCustomizations]);

  // Refs para timeout e controle de salvamento do botão flutuante
  const saveFixedButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingFixedButtonRef = useRef(false);

  // Salvar automaticamente quando showFixedButton mudar
  useEffect(() => {
    // Ignorar na primeira renderização
    if (isInitialFixedButtonLoadRef.current) {
      isInitialFixedButtonLoadRef.current = false;
      previousFixedButtonValueRef.current = showFixedButton;
      console.log('🔵 [FixedButton] Primeira carga, ignorando:', showFixedButton);
      return;
    }

    // Não salvar se não houver store ou se estiver carregando
    if (!store?.id || storeLoading || authLoading) {
      console.log('🔵 [FixedButton] Store não disponível ou carregando');
      return;
    }

    // Não salvar se o valor não mudou
    if (previousFixedButtonValueRef.current === showFixedButton) {
      console.log('🔵 [FixedButton] Valor não mudou:', showFixedButton);
      return;
    }

    // Não salvar se já estiver salvando
    if (isSavingFixedButtonRef.current) {
      console.log('🔵 [FixedButton] Já está salvando');
      return;
    }

    // Capturar o valor atual antes de atualizar a referência
    const valueToSave = showFixedButton;
    
    console.log('✅ [FixedButton] Iniciando salvamento:', {
      anterior: previousFixedButtonValueRef.current,
      novo: valueToSave
    });
    
    // Atualizar valor anterior
    previousFixedButtonValueRef.current = valueToSave;

    // Limpar timeout anterior se existir
    if (saveFixedButtonTimeoutRef.current) {
      clearTimeout(saveFixedButtonTimeoutRef.current);
    }

    // Debounce: aguardar 500ms após a última mudança antes de salvar
    setSavingFixedButton(true);
    saveFixedButtonTimeoutRef.current = setTimeout(async () => {
      isSavingFixedButtonRef.current = true;
      try {
        // Buscar customização existente
        const { data: existingCustomization } = await supabase
          .from('store_customizations')
          .select('id')
          .eq('store_id', store.id)
          .maybeSingle();

        const updateData = {
          show_fixed_button: valueToSave,
          updated_at: new Date().toISOString()
        };
        
        console.log('💾 Salvando showFixedButton:', valueToSave);

        if (existingCustomization) {
          // Atualizar existente
          const { error: updateError } = await supabase
            .from('store_customizations')
            .update(updateData)
            .eq('store_id', store.id);

          if (updateError) throw updateError;
        } else {
          // Criar novo
          const { error: insertError } = await supabase
            .from('store_customizations')
            .insert({
              store_id: store.id,
              ...updateData
            });

          if (insertError) throw insertError;
        }

        // Recarregar customizações
        await reloadCustomizations();
        setMessage('✅ Configuração do botão flutuante atualizada!');
      } catch (error: any) {
        console.error('Erro ao salvar configuração do botão flutuante:', error);
        setMessage(`❌ Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setSavingFixedButton(false);
        isSavingFixedButtonRef.current = false;
      }
    }, 500);

    // Cleanup
    return () => {
      if (saveFixedButtonTimeoutRef.current) {
        clearTimeout(saveFixedButtonTimeoutRef.current);
      }
    };
  }, [showFixedButton, store?.id, storeLoading, authLoading]);

  // Refs para timeout e controle de salvamento dos produtos recomendados
  const saveRecommendedProductsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRecommendedProductsRef = useRef(false);
  const isLoadingRecommendedProductsFromDatabaseRef = useRef(false);

  // Função para comparar arrays de IDs
  const arraysEqual = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  };

  // Salvar automaticamente quando recommendedProductIds mudar
  useEffect(() => {
    // Ignorar se estamos carregando do banco
    if (isLoadingRecommendedProductsFromDatabaseRef.current) {
      return;
    }

    // Ignorar na primeira renderização
    if (isInitialRecommendedProductsLoadRef.current) {
      isInitialRecommendedProductsLoadRef.current = false;
      previousRecommendedProductsRef.current = [...recommendedProductIds];
      return;
    }

    // Não salvar se não houver store ou se estiver carregando
    if (!store?.id || storeLoading || authLoading) {
      return;
    }

    // Não salvar se o valor não mudou
    if (previousRecommendedProductsRef.current !== null && 
        arraysEqual(previousRecommendedProductsRef.current, recommendedProductIds)) {
      return;
    }

    // Não salvar se já estiver salvando
    if (isSavingRecommendedProductsRef.current) {
      return;
    }

    // Atualizar valor anterior
    previousRecommendedProductsRef.current = [...recommendedProductIds];

    // Limpar timeout anterior se existir
    if (saveRecommendedProductsTimeoutRef.current) {
      clearTimeout(saveRecommendedProductsTimeoutRef.current);
    }

    // Debounce: aguardar 800ms após a última mudança antes de salvar
    setSavingRecommendedProducts(true);
    saveRecommendedProductsTimeoutRef.current = setTimeout(async () => {
      isSavingRecommendedProductsRef.current = true;
      try {
        // Buscar customização existente
        const { data: existingCustomization } = await supabase
          .from('store_customizations')
          .select('id')
          .eq('store_id', store.id)
          .maybeSingle();

        const updateData = {
          recommended_product_ids: recommendedProductIds,
          updated_at: new Date().toISOString()
        };

        if (existingCustomization) {
          // Atualizar existente
          const { error: updateError } = await supabase
            .from('store_customizations')
            .update(updateData)
            .eq('store_id', store.id);

          if (updateError) throw updateError;
        } else {
          // Criar novo
          const { error: insertError } = await supabase
            .from('store_customizations')
            .insert({
              store_id: store.id,
              ...updateData
            });

          if (insertError) throw insertError;
        }

        // Recarregar customizações
        await reloadCustomizations();
        setMessage('✅ Produtos recomendados atualizados!');
      } catch (error: any) {
        console.error('Erro ao salvar produtos recomendados:', error);
        setMessage(`❌ Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setSavingRecommendedProducts(false);
        isSavingRecommendedProductsRef.current = false;
      }
    }, 800);

    // Cleanup
    return () => {
      if (saveRecommendedProductsTimeoutRef.current) {
        clearTimeout(saveRecommendedProductsTimeoutRef.current);
      }
    };
  }, [recommendedProductIds, store?.id, storeLoading, authLoading]);

  // Funções para gerenciar produtos recomendados
  const handleToggleProduct = (productId: string) => {
    setRecommendedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        // Limitar a 15 produtos
        if (prev.length >= 15) {
          setMessage('⚠️ Máximo de 15 produtos recomendados permitido');
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    setRecommendedProductIds(prev => {
      const newIds = [...prev];
      if (direction === 'up' && index > 0) {
        [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
      } else if (direction === 'down' && index < newIds.length - 1) {
        [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
      }
      return newIds;
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setRecommendedProductIds(prev => prev.filter(id => id !== productId));
  };

  const handleAddProduct = (productId: string) => {
    if (recommendedProductIds.length >= 15) {
      setMessage('⚠️ Máximo de 15 produtos recomendados permitido');
      return;
    }
    if (!recommendedProductIds.includes(productId)) {
      setRecommendedProductIds(prev => [...prev, productId]);
    }
  };

  // Estados para drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
    
    // Criar uma imagem personalizada para o drag sem fade
    const dragElement = e.currentTarget.cloneNode(true) as HTMLElement;
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Configurar o elemento clonado com estilos exatos
    dragElement.style.position = 'fixed';
    dragElement.style.top = '-9999px';
    dragElement.style.left = '-9999px';
    dragElement.style.opacity = '1';
    dragElement.style.width = `${rect.width}px`;
    dragElement.style.height = `${rect.height}px`;
    dragElement.style.margin = '0';
    dragElement.style.padding = '12px';
    dragElement.style.backgroundColor = '#f9f9f9';
    dragElement.style.border = '1px solid #e0e0e0';
    dragElement.style.borderRadius = '8px';
    dragElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.zIndex = '10000';
    
    document.body.appendChild(dragElement);
    
    // Calcular offset do mouse dentro do elemento
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Usar o elemento clonado como imagem de drag
    e.dataTransfer.setDragImage(dragElement, x, y);
    
    // Remover o elemento clonado após um pequeno delay
    setTimeout(() => {
      if (document.body.contains(dragElement)) {
        document.body.removeChild(dragElement);
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setRecommendedProductIds(prev => {
      const newIds = [...prev];
      const [removed] = newIds.splice(draggedIndex, 1);
      newIds.splice(dropIndex, 0, removed);
      return newIds;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja remover todos os produtos recomendados?')) {
      setRecommendedProductIds([]);
    }
  };


  // Refs para controle de salvamento do pedido mínimo
  const isInitialMinimumOrderLoadRef = useRef(true);
  const previousMinimumOrderValueRef = useRef<number | null>(null);
  const saveMinimumOrderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingMinimumOrderRef = useRef(false);
  const isLoadingFromDatabaseRef = useRef(false);

  // Converter valor de exibição (reais) para centavos
  const handleMinimumOrderValueChange = (value: string) => {
    // Remover caracteres não numéricos exceto vírgula e ponto
    const cleaned = value.replace(/[^\d,.]/g, '');
    setMinimumOrderValueDisplay(cleaned);
    
    // Converter para centavos
    const valueInReais = parseFloat(cleaned.replace(',', '.')) || 0;
    const valueInCents = Math.round(valueInReais * 100);
    setMinimumOrderValue(valueInCents);
  };

  // Salvar automaticamente quando minimumOrderValue mudar
  useEffect(() => {
    // Ignorar se estamos carregando do banco
    if (isLoadingFromDatabaseRef.current) {
      return;
    }

    // Ignorar na primeira renderização ou se ainda não carregou do banco
    if (isInitialMinimumOrderLoadRef.current) {
      isInitialMinimumOrderLoadRef.current = false;
      previousMinimumOrderValueRef.current = minimumOrderValue;
      return;
    }

    // Não salvar se não houver store ou se estiver carregando
    if (!store?.id || storeLoading || authLoading) {
      return;
    }

    // Não salvar se o previousMinimumOrderValueRef ainda não foi inicializado (ainda carregando)
    if (previousMinimumOrderValueRef.current === null) {
      previousMinimumOrderValueRef.current = minimumOrderValue;
      return;
    }

    // Não salvar se o valor não mudou
    if (previousMinimumOrderValueRef.current === minimumOrderValue) {
      return;
    }

    // Não salvar se já estiver salvando
    if (isSavingMinimumOrderRef.current) {
      return;
    }

    // Atualizar valor anterior
    previousMinimumOrderValueRef.current = minimumOrderValue;

    // Limpar timeout anterior se existir
    if (saveMinimumOrderTimeoutRef.current) {
      clearTimeout(saveMinimumOrderTimeoutRef.current);
    }

    // Debounce: aguardar 800ms após a última mudança antes de salvar
    setSavingMinimumOrder(true);
    saveMinimumOrderTimeoutRef.current = setTimeout(async () => {
      isSavingMinimumOrderRef.current = true;
      try {
        // Buscar customização existente
        const { data: existingCustomization } = await supabase
          .from('store_customizations')
          .select('id')
          .eq('store_id', store.id)
          .maybeSingle();

        const updateData = {
          minimum_order_value: minimumOrderValue,
          updated_at: new Date().toISOString()
        };

        if (existingCustomization) {
          // Atualizar existente
          const { error: updateError } = await supabase
            .from('store_customizations')
            .update(updateData)
            .eq('store_id', store.id);

          if (updateError) throw updateError;
        } else {
          // Criar novo
          const { error: insertError } = await supabase
            .from('store_customizations')
            .insert({
              store_id: store.id,
              ...updateData
            });

          if (insertError) throw insertError;
        }

        // Recarregar customizações
        await reloadCustomizations();
        setMessage('Salvo!');
      } catch (error: any) {
        console.error('Erro ao salvar valor mínimo do pedido:', error);
        setMessage(`❌ Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setSavingMinimumOrder(false);
        isSavingMinimumOrderRef.current = false;
      }
    }, 800);

    // Cleanup
    return () => {
      if (saveMinimumOrderTimeoutRef.current) {
        clearTimeout(saveMinimumOrderTimeoutRef.current);
      }
    };
  }, [minimumOrderValue, store?.id, storeLoading, authLoading]);

  // Filtrar produtos baseado na busca
  const filteredProducts = availableProducts.filter(product => {
    if (!searchProductTerm) return true;
    const searchLower = searchProductTerm.toLowerCase();
    return product.title.toLowerCase().includes(searchLower) ||
           product.description1?.toLowerCase().includes(searchLower) ||
           product.description2?.toLowerCase().includes(searchLower);
  });

  // Obter produtos selecionados na ordem correta
  const selectedProducts = recommendedProductIds
    .map(id => availableProducts.find(p => p.id === id))
    .filter((p): p is Product => p !== undefined);

  // Produtos disponíveis para adicionar (excluindo os já selecionados)
  const availableToAdd = availableProducts.filter(
    product => !recommendedProductIds.includes(product.id)
  );

  // Filtrar produtos disponíveis para adicionar por termo de busca
  const filteredAvailableToAdd = availableToAdd.filter(product => {
    if (!searchAddProductTerm.trim()) return true;
    const searchLower = searchAddProductTerm.toLowerCase();
    return product.title.toLowerCase().includes(searchLower);
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Função para redimensionar/recortar imagem para 1920x840
  const resizeAndCropImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const targetWidth = 1920;
      const targetHeight = 840;
      
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          // Calcular proporções para preencher o canvas mantendo aspecto
          const imgAspect = img.width / img.height;
          const targetAspect = targetWidth / targetHeight;

          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;

          // Se a imagem é mais larga que o alvo (aspect ratio maior)
          if (imgAspect > targetAspect) {
            // A imagem é mais larga, recortar nas laterais
            sourceHeight = img.height;
            sourceWidth = img.height * targetAspect;
            sourceX = (img.width - sourceWidth) / 2;
          } else {
            // A imagem é mais alta, recortar no topo/baixo
            sourceWidth = img.width;
            sourceHeight = img.width / targetAspect;
            sourceY = (img.height - sourceHeight) / 2;
          }

          // Desenhar imagem recortada e redimensionada no canvas
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, targetWidth, targetHeight
          );

          // Limpar URL do objeto
          URL.revokeObjectURL(objectUrl);

          // Converter canvas para blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Erro ao converter imagem'));
              }
            },
            'image/png',
            0.9 // Qualidade (0.9 = 90%)
          );
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = objectUrl;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setMessage('❌ Por favor, selecione um arquivo de imagem válido');
      return;
    }

    // A compressão será feita automaticamente se passar de 3MB
    // Permitir upload de até 10MB inicialmente (será comprimido se necessário)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('❌ A imagem deve ter no máximo 10MB');
      return;
    }

    // Resetar estados antes de abrir o editor
    setCropData({ x: 0, y: 0, width: 0, height: 0 });
    setScale(1);
    setImageSize({ width: 0, height: 0 });
    
    // Abrir modo de edição
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        setImageToEdit(reader.result as string);
        setIsEditing(true);
        setScale(1);
        // O cropData será calculado pelo useEffect quando o editor abrir
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Calcular distância entre dois pontos de toque
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calcular escala mínima para garantir que a imagem sempre preencha a área de crop
  const getMinScale = (): number => {
    const container = containerRef.current;
    if (!container || cropData.width === 0 || cropData.height === 0) {
      return 1;
    }

    const overlay = container.querySelector('.overlay') as HTMLElement;
    if (!overlay) return 1;

    const containerRect = container.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    
    // Calcular dimensões do overlay em relação ao container
    const overlayWidth = overlayRect.width;
    const overlayHeight = overlayRect.height;

    if (overlayWidth === 0 || overlayHeight === 0) return 1;

    // A escala mínima é quando a imagem (escalada) preenche completamente o overlay
    // Precisamos garantir que tanto a largura quanto a altura escaladas sejam >= ao overlay
    const minScaleX = overlayWidth / cropData.width;
    const minScaleY = overlayHeight / cropData.height;
    
    // Usar o maior para garantir que a imagem sempre preencha completamente
    return Math.max(minScaleX, minScaleY);
  };

  // Função para limitar a posição da imagem para sempre preencher o overlay
  const constrainImagePosition = (x: number, y: number): { x: number; y: number } => {
    const container = containerRef.current;
    if (!container) return { x, y };

    const overlay = container.querySelector('.overlay') as HTMLElement;
    if (!overlay) return { x, y };

    const containerRect = container.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    
    // Calcular posição do overlay em relação ao container
    const overlayLeft = overlayRect.left - containerRect.left;
    const overlayTop = overlayRect.top - containerRect.top;
    const overlayRight = overlayLeft + overlayRect.width;
    const overlayBottom = overlayTop + overlayRect.height;

    // Calcular dimensões da imagem escalada
    const imageWidth = cropData.width * scale;
    const imageHeight = cropData.height * scale;

    // Calcular bordas da imagem na posição atual
    const imageLeft = x;
    const imageTop = y;
    const imageRight = x + imageWidth;
    const imageBottom = y + imageHeight;

    // Limitar posição para garantir que a imagem sempre preencha o overlay
    // A imagem não pode ser movida para uma posição onde deixe fundo branco visível
    
    // Limite horizontal: a imagem deve sempre cobrir o overlay horizontalmente
    // A borda esquerda da imagem não pode estar à direita da borda esquerda do overlay
    // A borda direita da imagem não pode estar à esquerda da borda direita do overlay
    let constrainedX = x;
    if (imageLeft > overlayLeft) {
      // Se a borda esquerda está à direita do overlay, mover para alinhar
      constrainedX = overlayLeft;
    } else if (imageRight < overlayRight) {
      // Se a borda direita está à esquerda do overlay, mover para alinhar
      constrainedX = overlayRight - imageWidth;
    }

    // Limite vertical: a imagem deve sempre cobrir o overlay verticalmente
    // A borda superior da imagem não pode estar abaixo da borda superior do overlay (imageTop <= overlayTop)
    // A borda inferior da imagem não pode estar acima da borda inferior do overlay (imageBottom >= overlayBottom)
    
    // Calcular os limites para Y
    // minY: posição onde a borda superior da imagem está alinhada com a borda superior do overlay
    const minY = overlayTop;
    // maxY: posição onde a borda inferior da imagem está alinhada com a borda inferior do overlay
    const maxY = overlayBottom - imageHeight;
    
    // Como a imagem sempre tem altura suficiente (devido à escala mínima),
    // maxY <= minY, então Y deve estar entre maxY e minY
    let constrainedY = y;
    
    // Aplicar os limites: Y deve estar entre maxY e minY
    if (constrainedY < maxY) {
      constrainedY = maxY;
    } else if (constrainedY > minY) {
      constrainedY = minY;
    }

    // Recalcular bordas da imagem com a posição limitada
    const finalImageLeft = constrainedX;
    const finalImageTop = constrainedY;
    const finalImageRight = constrainedX + imageWidth;
    const finalImageBottom = constrainedY + imageHeight;

    // Snap opcional: alinhar bordas quando próximas (para facilitar o alinhamento perfeito)
    const snapThreshold = 10; // pixels de tolerância para snap
    let snappedX = constrainedX;
    let snappedY = constrainedY;

    // Calcular centro do overlay e centro da imagem
    const overlayCenterX = overlayLeft + overlayRect.width / 2;
    const overlayCenterY = overlayTop + overlayRect.height / 2;
    const imageCenterX = finalImageLeft + imageWidth / 2;
    const imageCenterY = finalImageTop + imageHeight / 2;

    // Snap horizontal: verificar bordas primeiro, depois centro
    if (Math.abs(finalImageLeft - overlayLeft) < snapThreshold) {
      snappedX = overlayLeft;
    } else if (Math.abs(finalImageRight - overlayRight) < snapThreshold) {
      snappedX = overlayRight - imageWidth;
    } else if (Math.abs(imageCenterX - overlayCenterX) < snapThreshold) {
      // Snap ao centro horizontal
      snappedX = overlayCenterX - imageWidth / 2;
    } else {
      snappedX = constrainedX;
    }

    // Snap vertical: verificar bordas primeiro, depois centro
    if (Math.abs(finalImageTop - overlayTop) < snapThreshold) {
      snappedY = overlayTop;
    } else if (Math.abs(finalImageBottom - overlayBottom) < snapThreshold) {
      snappedY = overlayBottom - imageHeight;
    } else if (Math.abs(imageCenterY - overlayCenterY) < snapThreshold) {
      // Snap ao centro vertical
      snappedY = overlayCenterY - imageHeight / 2;
    } else {
      snappedY = constrainedY;
    }

    return { x: snappedX, y: snappedY };
  };

  // Handlers para mover imagem
  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      containerX: cropData.x,
      containerY: cropData.y
    };
    
    document.addEventListener('mousemove', handleImageMouseMove);
    document.addEventListener('mouseup', handleImageMouseUp);
  };

  const handleImageMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    // Calcular nova posição
    const newX = dragStartRef.current.containerX + deltaX;
    const newY = dragStartRef.current.containerY + deltaY;
    
    // Limitar posição para garantir que a imagem sempre preencha o overlay
    const constrained = constrainImagePosition(newX, newY);
    
    setCropData(prev => ({
      ...prev,
      x: constrained.x,
      y: constrained.y
    }));
  };

  const handleImageMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleImageMouseMove);
    document.removeEventListener('mouseup', handleImageMouseUp);
  };

  // Handler para zoom com scroll do mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const minScale = getMinScale();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const oldScale = scale;
    const newScale = Math.max(minScale, Math.min(3, scale + delta));
    
    if (oldScale === newScale) return;
    
    // Calcular o centro atual da imagem
    const currentCenterX = cropData.x + (cropData.width * oldScale) / 2;
    const currentCenterY = cropData.y + (cropData.height * oldScale) / 2;
    
    // Calcular nova posição para manter o centro fixo
    const newWidth = cropData.width * newScale;
    const newHeight = cropData.height * newScale;
    const newX = currentCenterX - newWidth / 2;
    const newY = currentCenterY - newHeight / 2;
    
    setCropData(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
    setScale(newScale);
  };

  // Handlers para gestos de pinça (touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Iniciar gesto de pinça
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      pinchStartRef.current = { distance, scale };
      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1) {
      // Iniciar arrasto
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        containerX: cropData.x,
        containerY: cropData.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      // Gesto de pinça - zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      if (lastTouchDistanceRef.current !== null) {
        const scaleChange = distance / lastTouchDistanceRef.current;
        const oldScale = pinchStartRef.current.scale;
        const minScale = getMinScale();
        const newScale = Math.max(minScale, Math.min(3, oldScale * scaleChange));
        
        if (oldScale !== newScale) {
          // Calcular o centro atual da imagem
          const currentCenterX = cropData.x + (cropData.width * oldScale) / 2;
          const currentCenterY = cropData.y + (cropData.height * oldScale) / 2;
          
          // Calcular nova posição para manter o centro fixo
          const newWidth = cropData.width * newScale;
          const newHeight = cropData.height * newScale;
          const newX = currentCenterX - newWidth / 2;
          const newY = currentCenterY - newHeight / 2;
          
          setCropData(prev => ({
            ...prev,
            x: newX,
            y: newY
          }));
        }
        
        setScale(newScale);
        pinchStartRef.current.scale = newScale;
      }
      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      // Arrasto com um dedo
      e.preventDefault();
      const deltaX = e.touches[0].clientX - dragStartRef.current.x;
      const deltaY = e.touches[0].clientY - dragStartRef.current.y;
      
      // Calcular nova posição
      const newX = dragStartRef.current.containerX + deltaX;
      const newY = dragStartRef.current.containerY + deltaY;
      
      // Limitar posição para garantir que a imagem sempre preencha o overlay
      const constrained = constrainImagePosition(newX, newY);
      
      setCropData(prev => ({
        ...prev,
        x: constrained.x,
        y: constrained.y
      }));
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    pinchStartRef.current = null;
    lastTouchDistanceRef.current = null;
  };

  // Função para aplicar crop
  const applyCrop = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const targetWidth = 1920;
      const targetHeight = 840;
      
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          // Obter container e overlay para calcular posição do overlay
          const container = containerRef.current;
          if (!container) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Container não encontrado'));
            return;
          }

          const overlay = container.querySelector('.overlay') as HTMLElement;
          if (!overlay) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Overlay não encontrado'));
            return;
          }

          const containerRect = container.getBoundingClientRect();
          const overlayRect = overlay.getBoundingClientRect();
          
          // Calcular posição do overlay em relação ao container
          const overlayLeft = overlayRect.left - containerRect.left;
          const overlayTop = overlayRect.top - containerRect.top;
          const overlayWidth = overlayRect.width;
          const overlayHeight = overlayRect.height;
          
          // Calcular posição da imagem em relação ao container
          // cropData.x e cropData.y já estão em relação ao container
          const imageLeft = cropData.x;
          const imageTop = cropData.y;
          const displayedWidth = cropData.width * scale;
          const displayedHeight = cropData.height * scale;
          
          // Calcular offset do overlay em relação à imagem
          const left = overlayLeft - imageLeft;
          const top = overlayTop - imageTop;
          
          // Calcular escala da imagem exibida vs original
          const scaleX = img.width / displayedWidth;
          const scaleY = img.height / displayedHeight;
          
          // Converter coordenadas para imagem original
          // Se left/top são negativos, significa que o overlay está fora da imagem
          const sourceX = Math.max(0, left) * scaleX;
          const sourceY = Math.max(0, top) * scaleY;
          const sourceWidth = Math.min(overlayWidth * scaleX, img.width - sourceX);
          const sourceHeight = Math.min(overlayHeight * scaleY, img.height - sourceY);

          // Desenhar imagem recortada e redimensionada no canvas
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, targetWidth, targetHeight
          );

          // Limpar URL do objeto
          URL.revokeObjectURL(objectUrl);

          // Converter canvas para blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Erro ao converter imagem'));
              }
            },
            'image/png',
            0.9 // Qualidade (0.9 = 90%)
          );
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = objectUrl;
    });
  };

  const handleConfirmCrop = async () => {
    if (!selectedImageFile || !store?.id) return;

    setUploadingLogo(true);
    setMessage('⏳ Processando imagem...');

    try {
      // Comprimir imagem original se necessário (antes do crop)
      const compressedFile = await compressImageIfNeeded(selectedImageFile, 3);
      
      // Aplicar crop ANTES de fechar o modal (para ter acesso aos elementos DOM)
      const processedBlob = await applyCrop(compressedFile);
      
      // Comprimir o blob processado se necessário (pode ter ficado grande após o crop)
      const finalBlob = await compressBlobIfNeeded(processedBlob, 3);
      
      // Fechar o modal após processar
      setIsEditing(false);
      
      // Criar nome único para o arquivo
      const fileExt = 'png'; // Sempre salvar como PNG após processamento
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${store.id}/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(filePath, finalBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(filePath);

      // Atualizar customizações no banco
      const { data: existingCustomization } = await supabase
        .from('store_customizations')
        .select('id, logo_url')
        .eq('store_id', store.id)
        .maybeSingle();

      // Se existe um logo antigo, deletar do Storage antes de atualizar
      if (existingCustomization?.logo_url && existingCustomization.logo_url !== publicUrl) {
        await deleteImageFromStorage(existingCustomization.logo_url);
      }

      if (existingCustomization) {
        // Atualizar existente
        const { error: updateError } = await supabase
          .from('store_customizations')
          .update({
            logo_url: publicUrl,
            logo_alt_text: store.name || 'Logo',
            updated_at: new Date().toISOString()
          })
          .eq('store_id', store.id);

        if (updateError) throw updateError;
      } else {
        // Criar novo
        const { error: insertError } = await supabase
          .from('store_customizations')
          .insert({
            store_id: store.id,
            logo_url: publicUrl,
            logo_alt_text: store.name || 'Logo'
          });

        if (insertError) throw insertError;
      }

      setLogoPreview(publicUrl);
      setMessage('✅ Banner atualizado!');
      
      // Recarregar customizações
      await reloadCustomizations();
    } catch (error: any) {
      console.error('Erro ao fazer upload do logo:', error);
      setMessage(`❌ Erro ao fazer upload: ${error.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };


  const handleCancelEdit = () => {
    // Limpar event listeners
    document.removeEventListener('mousemove', handleImageMouseMove);
    document.removeEventListener('mouseup', handleImageMouseUp);
    
    setIsEditing(false);
    setSelectedImageFile(null);
    setImageToEdit(null);
    setCropData({ x: 0, y: 0, width: 450, height: 450 });
    setScale(1);
    isDraggingRef.current = false;
    pinchStartRef.current = null;
    lastTouchDistanceRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!store?.id) return;

    if (!confirm('Tem certeza que deseja remover o logo? Isso fará com que o logo padrão seja exibido.')) {
      return;
    }

    try {
      // Buscar customização atual para obter o logo_url
      const { data: existingCustomization, error: fetchError } = await supabase
        .from('store_customizations')
        .select('id, logo_url')
        .eq('store_id', store.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Se existe customização e tem logo_url, deletar o arquivo do Storage
      if (existingCustomization?.logo_url) {
        await deleteImageFromStorage(existingCustomization.logo_url);
      }

      // Atualizar banco de dados para remover a referência
      if (existingCustomization) {
        const { error: updateError } = await supabase
          .from('store_customizations')
          .update({
            logo_url: null,
            updated_at: new Date().toISOString()
          })
          .eq('store_id', store.id);

        if (updateError) throw updateError;
      }

      // Limpar preview imediatamente
      setLogoPreview(null);
      setMessage('✅ Logo removido com sucesso!');
      
      // Recarregar customizações
      await reloadCustomizations();
    } catch (error: any) {
      console.error('Erro ao remover logo:', error);
      setMessage(`❌ Erro ao remover logo: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // ========== FUNÇÕES PARA EDIÇÃO DA FOTO DE PERFIL (1000x1000) ==========
  
  // Calcular distância entre dois pontos de toque (para foto de perfil)
  const getTouchDistanceProfile = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calcular escala mínima para garantir que a imagem sempre preencha a área de crop (1000x1000)
  const getMinScaleProfile = (): number => {
    const container = profileContainerRef.current;
    if (!container || cropDataProfile.width === 0 || cropDataProfile.height === 0) {
      return 1;
    }

    const overlay = container.querySelector('.overlay') as HTMLElement;
    if (!overlay) return 1;

    const containerRect = container.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    
    const overlayWidth = overlayRect.width;
    const overlayHeight = overlayRect.height;

    if (overlayWidth === 0 || overlayHeight === 0) return 1;

    const minScaleX = overlayWidth / cropDataProfile.width;
    const minScaleY = overlayHeight / cropDataProfile.height;
    
    return Math.max(minScaleX, minScaleY);
  };

  // Função para limitar a posição da imagem para sempre preencher o overlay (1000x1000)
  const constrainImagePositionProfile = (x: number, y: number): { x: number; y: number } => {
    const container = profileContainerRef.current;
    if (!container) return { x, y };

    const overlay = container.querySelector('.overlay') as HTMLElement;
    if (!overlay) return { x, y };

    const containerRect = container.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    
    const overlayLeft = overlayRect.left - containerRect.left;
    const overlayTop = overlayRect.top - containerRect.top;
    const overlayRight = overlayLeft + overlayRect.width;
    const overlayBottom = overlayTop + overlayRect.height;

    const imageWidth = cropDataProfile.width * scaleProfile;
    const imageHeight = cropDataProfile.height * scaleProfile;

    const imageLeft = x;
    const imageTop = y;
    const imageRight = x + imageWidth;
    const imageBottom = y + imageHeight;

    let constrainedX = x;
    if (imageLeft > overlayLeft) {
      constrainedX = overlayLeft;
    } else if (imageRight < overlayRight) {
      constrainedX = overlayRight - imageWidth;
    }

    const minY = overlayTop;
    const maxY = overlayBottom - imageHeight;
    
    let constrainedY = y;
    if (constrainedY < maxY) {
      constrainedY = maxY;
    } else if (constrainedY > minY) {
      constrainedY = minY;
    }

    const snapThreshold = 10;
    let snappedX = constrainedX;
    let snappedY = constrainedY;

    const overlayCenterX = overlayLeft + overlayRect.width / 2;
    const overlayCenterY = overlayTop + overlayRect.height / 2;
    const imageCenterX = constrainedX + imageWidth / 2;
    const imageCenterY = constrainedY + imageHeight / 2;

    if (Math.abs(constrainedX - overlayLeft) < snapThreshold) {
      snappedX = overlayLeft;
    } else if (Math.abs(constrainedX + imageWidth - overlayRight) < snapThreshold) {
      snappedX = overlayRight - imageWidth;
    } else if (Math.abs(imageCenterX - overlayCenterX) < snapThreshold) {
      snappedX = overlayCenterX - imageWidth / 2;
    }

    if (Math.abs(constrainedY - overlayTop) < snapThreshold) {
      snappedY = overlayTop;
    } else if (Math.abs(constrainedY + imageHeight - overlayBottom) < snapThreshold) {
      snappedY = overlayBottom - imageHeight;
    } else if (Math.abs(imageCenterY - overlayCenterY) < snapThreshold) {
      snappedY = overlayCenterY - imageHeight / 2;
    }

    return { x: snappedX, y: snappedY };
  };

  // Handlers para mover imagem (foto de perfil)
  const handleProfileImageMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profileContainerRef.current) return;
    
    isDraggingProfileRef.current = true;
    dragStartProfileRef.current = {
      x: e.clientX,
      y: e.clientY,
      containerX: cropDataProfile.x,
      containerY: cropDataProfile.y
    };
    
    document.addEventListener('mousemove', handleProfileImageMouseMove);
    document.addEventListener('mouseup', handleProfileImageMouseUp);
  };

  const handleProfileImageMouseMove = (e: MouseEvent) => {
    if (!isDraggingProfileRef.current) return;
    
    const deltaX = e.clientX - dragStartProfileRef.current.x;
    const deltaY = e.clientY - dragStartProfileRef.current.y;
    
    const newX = dragStartProfileRef.current.containerX + deltaX;
    const newY = dragStartProfileRef.current.containerY + deltaY;
    
    const constrained = constrainImagePositionProfile(newX, newY);
    
    setCropDataProfile(prev => ({
      ...prev,
      x: constrained.x,
      y: constrained.y
    }));
  };

  const handleProfileImageMouseUp = () => {
    isDraggingProfileRef.current = false;
    document.removeEventListener('mousemove', handleProfileImageMouseMove);
    document.removeEventListener('mouseup', handleProfileImageMouseUp);
  };

  // Handler para zoom com scroll do mouse (foto de perfil)
  const handleProfileWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!profileContainerRef.current) return;

    const minScale = getMinScaleProfile();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const oldScale = scaleProfile;
    const newScale = Math.max(minScale, Math.min(3, scaleProfile + delta));
    
    if (oldScale === newScale) return;
    
    const currentCenterX = cropDataProfile.x + (cropDataProfile.width * oldScale) / 2;
    const currentCenterY = cropDataProfile.y + (cropDataProfile.height * oldScale) / 2;
    
    const newWidth = cropDataProfile.width * newScale;
    const newHeight = cropDataProfile.height * newScale;
    const newX = currentCenterX - newWidth / 2;
    const newY = currentCenterY - newHeight / 2;
    
    setCropDataProfile(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
    setScaleProfile(newScale);
  };

  // Handlers para gestos de pinça (touch) - foto de perfil
  const handleProfileTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistanceProfile(e.touches[0], e.touches[1]);
      pinchStartProfileRef.current = { distance, scale: scaleProfile };
      lastTouchDistanceProfileRef.current = distance;
    } else if (e.touches.length === 1) {
      isDraggingProfileRef.current = true;
      dragStartProfileRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        containerX: cropDataProfile.x,
        containerY: cropDataProfile.y
      };
    }
  };

  const handleProfileTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartProfileRef.current) {
      e.preventDefault();
      const distance = getTouchDistanceProfile(e.touches[0], e.touches[1]);
      if (lastTouchDistanceProfileRef.current !== null) {
        const scaleChange = distance / lastTouchDistanceProfileRef.current;
        const oldScale = pinchStartProfileRef.current.scale;
        const minScale = getMinScaleProfile();
        const newScale = Math.max(minScale, Math.min(3, oldScale * scaleChange));
        
        if (oldScale !== newScale) {
          const currentCenterX = cropDataProfile.x + (cropDataProfile.width * oldScale) / 2;
          const currentCenterY = cropDataProfile.y + (cropDataProfile.height * oldScale) / 2;
          
          const newWidth = cropDataProfile.width * newScale;
          const newHeight = cropDataProfile.height * newScale;
          const newX = currentCenterX - newWidth / 2;
          const newY = currentCenterY - newHeight / 2;
          
          setCropDataProfile(prev => ({
            ...prev,
            x: newX,
            y: newY
          }));
        }
        
        setScaleProfile(newScale);
        pinchStartProfileRef.current.scale = newScale;
      }
      lastTouchDistanceProfileRef.current = distance;
    } else if (e.touches.length === 1 && isDraggingProfileRef.current) {
      e.preventDefault();
      const deltaX = e.touches[0].clientX - dragStartProfileRef.current.x;
      const deltaY = e.touches[0].clientY - dragStartProfileRef.current.y;
      
      const newX = dragStartProfileRef.current.containerX + deltaX;
      const newY = dragStartProfileRef.current.containerY + deltaY;
      
      const constrained = constrainImagePositionProfile(newX, newY);
      
      setCropDataProfile(prev => ({
        ...prev,
        x: constrained.x,
        y: constrained.y
      }));
    }
  };

  const handleProfileTouchEnd = () => {
    isDraggingProfileRef.current = false;
    pinchStartProfileRef.current = null;
    lastTouchDistanceProfileRef.current = null;
  };

  // Função para aplicar crop na foto de perfil (1000x1000)
  const applyProfileCrop = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const targetWidth = 1000;
      const targetHeight = 1000;
      
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          const container = profileContainerRef.current;
          if (!container) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Container não encontrado'));
            return;
          }

          const overlay = container.querySelector('.overlay') as HTMLElement;
          if (!overlay) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Overlay não encontrado'));
            return;
          }

          const containerRect = container.getBoundingClientRect();
          const overlayRect = overlay.getBoundingClientRect();
          
          const overlayLeft = overlayRect.left - containerRect.left;
          const overlayTop = overlayRect.top - containerRect.top;
          const overlayWidth = overlayRect.width;
          const overlayHeight = overlayRect.height;
          
          const imageLeft = cropDataProfile.x;
          const imageTop = cropDataProfile.y;
          const displayedWidth = cropDataProfile.width * scaleProfile;
          const displayedHeight = cropDataProfile.height * scaleProfile;
          
          const left = overlayLeft - imageLeft;
          const top = overlayTop - imageTop;
          
          const scaleX = img.width / displayedWidth;
          const scaleY = img.height / displayedHeight;
          
          const sourceX = Math.max(0, left) * scaleX;
          const sourceY = Math.max(0, top) * scaleY;
          const sourceWidth = Math.min(overlayWidth * scaleX, img.width - sourceX);
          const sourceHeight = Math.min(overlayHeight * scaleY, img.height - sourceY);

          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, targetWidth, targetHeight
          );

          URL.revokeObjectURL(objectUrl);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Erro ao converter imagem'));
              }
            },
            'image/webp',
            0.9
          );
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = objectUrl;
    });
  };

  const handleConfirmProfileCrop = async () => {
    if (!selectedProfileImageFile || !store?.id) return;

    setUploadingProfileImage(true);
    setMessage('⏳ Processando foto de perfil...');

    try {
      const compressedFile = await compressImageIfNeeded(selectedProfileImageFile, 3);
      const processedBlob = await applyProfileCrop(compressedFile);
      const finalBlob = await compressBlobIfNeeded(processedBlob, 3);
      
      setIsEditingProfile(false);
      
      const fileExt = 'webp';
      const fileName = `profile-${store.id}-${Date.now()}.${fileExt}`;
      const filePath = `stores/${store.id}/profile/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(filePath, finalBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/webp'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(filePath);

      const { data: existingCustomization } = await supabase
        .from('store_customizations')
        .select('id, profile_image_url')
        .eq('store_id', store.id)
        .maybeSingle();

      if (existingCustomization?.profile_image_url) {
        await deleteImageFromStorage(existingCustomization.profile_image_url);
      }

      if (existingCustomization) {
        const { error: updateError } = await supabase
          .from('store_customizations')
          .update({
            profile_image_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('store_id', store.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('store_customizations')
          .insert({
            store_id: store.id,
            profile_image_url: publicUrl
          });

        if (insertError) throw insertError;
      }

      setProfileImagePreview(publicUrl);
      setMessage('✅ Foto de perfil atualizada!');
      await reloadCustomizations();
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto de perfil:', error);
      setMessage(`❌ Erro ao fazer upload: ${error.message}`);
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleCancelProfileEdit = () => {
    document.removeEventListener('mousemove', handleProfileImageMouseMove);
    document.removeEventListener('mouseup', handleProfileImageMouseUp);
    
    setIsEditingProfile(false);
    setSelectedProfileImageFile(null);
    setImageToEditProfile(null);
    setCropDataProfile({ x: 0, y: 0, width: 500, height: 500 });
    setScaleProfile(1);
    isDraggingProfileRef.current = false;
    pinchStartProfileRef.current = null;
    lastTouchDistanceProfileRef.current = null;
  };

  const handleProfileImageChange = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('❌ Por favor, selecione um arquivo de imagem válido');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage('❌ A imagem deve ter no máximo 10MB');
      return;
    }

    setCropDataProfile({ x: 0, y: 0, width: 0, height: 0 });
    setScaleProfile(1);
    setImageSizeProfile({ width: 0, height: 0 });
    
    setSelectedProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        setImageSizeProfile({ width: img.width, height: img.height });
        setImageToEditProfile(reader.result as string);
        setIsEditingProfile(true);
        setScaleProfile(1);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Centralizar imagem quando o editor de perfil abrir
  useEffect(() => {
    if (!isEditingProfile || !imageToEditProfile || !imageSizeProfile.width || !imageSizeProfile.height) {
      if (!isEditingProfile) {
        setCropDataProfile({ x: 0, y: 0, width: 0, height: 0 });
      }
      return;
    }
    
    const container = profileContainerRef.current;
    if (!container) {
      const retryTimeout = setTimeout(() => {
        if (profileContainerRef.current) {
          setCropDataProfile(prev => ({ ...prev }));
        }
      }, 50);
      return () => clearTimeout(retryTimeout);
    }
    
    const calculateAndCenterImage = () => {
      const container = profileContainerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      if (containerWidth === 0 || containerHeight === 0) {
        requestAnimationFrame(calculateAndCenterImage);
        return;
      }
      
      const overlay = container.querySelector('.overlay') as HTMLElement;
      if (!overlay) {
        requestAnimationFrame(calculateAndCenterImage);
        return;
      }
      
      const overlayRect = overlay.getBoundingClientRect();
      const overlayWidth = overlayRect.width;
      const overlayHeight = overlayRect.height;
      
      if (overlayWidth === 0 || overlayHeight === 0) {
        requestAnimationFrame(calculateAndCenterImage);
        return;
      }
      
      const overlayLeft = overlayRect.left - containerRect.left;
      const overlayTop = overlayRect.top - containerRect.top;
      
      const cropAspect = 1; // 1000x1000 = quadrado
      const imgAspect = imageSizeProfile.width / imageSizeProfile.height;
      
      let initialWidth: number;
      let initialHeight: number;
      
      if (imgAspect > cropAspect) {
        initialHeight = overlayHeight;
        initialWidth = initialHeight * imgAspect;
      } else {
        initialWidth = overlayWidth;
        initialHeight = initialWidth / imgAspect;
      }
      
      if (initialWidth < overlayWidth) {
        const scale = overlayWidth / initialWidth;
        initialWidth = overlayWidth;
        initialHeight = initialHeight * scale;
      }
      if (initialHeight < overlayHeight) {
        const scale = overlayHeight / initialHeight;
        initialHeight = overlayHeight;
        initialWidth = initialWidth * scale;
      }
      
      const centerX = overlayLeft + (overlayWidth - initialWidth) / 2;
      const centerY = overlayTop + (overlayHeight - initialHeight) / 2;
      
      setCropDataProfile({ 
        x: Math.round(centerX), 
        y: Math.round(centerY), 
        width: Math.round(initialWidth), 
        height: Math.round(initialHeight) 
      });
      setScaleProfile(1);
    };
    
    let timeoutId: ReturnType<typeof setTimeout>;
    let rafId: number;
    
    const scheduleCalculation = () => {
      calculateAndCenterImage();
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          requestAnimationFrame(calculateAndCenterImage);
        });
      }, 200);
    };
    
    scheduleCalculation();
    
    const handleResize = () => {
      requestAnimationFrame(calculateAndCenterImage);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isEditingProfile, imageToEditProfile, imageSizeProfile.width, imageSizeProfile.height]);

  // Prevenir scroll do body quando o modal de perfil estiver aberto
  useEffect(() => {
    if (isEditingProfile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isEditingProfile]);

  // Funções para edição inline do texto do banner
  const handlePromoTextDoubleClick = () => {
    setIsEditingPromoText(true);
    setEditingPromoText(promoBannerText);
  };

  const handlePromoTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingPromoText(e.target.value);
  };

  const handlePromoTextSave = async () => {
    if (!editingPromoText.trim()) {
      setIsEditingPromoText(false);
      return;
    }

    const newText = editingPromoText.trim();
    
    // Se o texto não mudou, apenas cancelar a edição
    if (newText === promoBannerText) {
      setIsEditingPromoText(false);
      setEditingPromoText('');
      return;
    }

    // Atualizar o estado local
    setPromoBannerText(newText);
    setIsEditingPromoText(false);
    setEditingPromoText('');

    // Salvar automaticamente no banco
    if (!store?.id) return;

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
            promo_banner_visible: promoBannerVisible,
            promo_banner_bg_color: promoBannerBgColor,
            promo_banner_text_color: promoBannerTextColor,
            promo_banner_use_gradient: promoBannerUseGradient,
            promo_banner_animation: promoBannerAnimation,
            ...updateData
          });

        if (insertError) throw insertError;
      }

      // Recarregar customizações
      await reloadCustomizations();
      setMessage('✅ Texto do banner atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar texto do banner:', error);
      setMessage(`❌ Erro ao salvar texto: ${error.message || 'Erro desconhecido'}`);
      // Reverter o estado em caso de erro
      setPromoBannerText(promoBannerText);
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

  if (authLoading || storeLoading) {
    return (
      <AdminLayout>
        <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
          Carregando...
        </div>
      </AdminLayout>
    );
  }

  if (!store) {
    return (
      <AdminLayout>
        <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
          Não foi possível carregar a loja.
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
      <style>{promoBannerAnimationStyles}</style>
      {/* Modal de Edição de Imagem do Logo */}
      {isEditing && imageToEdit && (
        <div className="editor-modal-overlay" onClick={handleCancelEdit} style={{ zIndex: 10000 }}>
          <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
            <button className="editor-close-btn" onClick={handleCancelEdit} aria-label="Fechar">
              ×
            </button>
            
            <div className="editor-content">
              <h2>Editar Imagem</h2>
              <p className="editor-subtitle">Ajuste a posição e o tamanho da imagem para o formato 1920x840</p>
              
               <div className="editor-wrapper">
                 <div 
                   className="resize-container" 
                   ref={containerRef}
                   onWheel={handleWheel}
                   onTouchStart={handleTouchStart}
                   onTouchMove={handleTouchMove}
                   onTouchEnd={handleTouchEnd}
                 >
                   {cropData.width > 0 && cropData.height > 0 && (
                     <img
                       ref={imageRef}
                       src={imageToEdit}
                       alt="Imagem para editar"
                       className="resize-image"
                       style={{
                         position: 'absolute',
                         left: `${cropData.x}px`,
                         top: `${cropData.y}px`,
                         width: `${cropData.width * scale}px`,
                         height: `${cropData.height * scale}px`,
                         cursor: isDraggingRef.current ? 'grabbing' : 'move',
                         userSelect: 'none',
                         objectFit: 'cover',
                         touchAction: 'none'
                       }}
                       onMouseDown={handleImageMouseDown}
                       draggable={false}
                     />
                   )}
                   <div className="overlay"></div>
                 </div>
               </div>

              <div className="editor-actions">
                <button className="editor-btn editor-btn-cancel" onClick={handleCancelEdit}>
                  Cancelar
                </button>
                <button 
                  className="editor-btn editor-btn-crop js-crop" 
                  onClick={handleConfirmCrop}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Processando...' : 'Aplicar Crop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Foto de Perfil */}
      {isEditingProfile && imageToEditProfile && (
        <div className="editor-modal-overlay" onClick={handleCancelProfileEdit} style={{ zIndex: 10000 }}>
          <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
            <button className="editor-close-btn" onClick={handleCancelProfileEdit} aria-label="Fechar">
              ×
            </button>
            
            <div className="editor-content">
              <h2>Editar Foto de Perfil</h2>
              <p className="editor-subtitle">Ajuste a posição e o tamanho da imagem para o formato 1000x1000</p>
              
               <div className="editor-wrapper" style={{ aspectRatio: '1/1' }}>
                 <div 
                   className="resize-container" 
                   ref={profileContainerRef}
                   onWheel={handleProfileWheel}
                   onTouchStart={handleProfileTouchStart}
                   onTouchMove={handleProfileTouchMove}
                   onTouchEnd={handleProfileTouchEnd}
                   style={{ aspectRatio: '1/1' }}
                 >
                   {cropDataProfile.width > 0 && cropDataProfile.height > 0 && (
                     <img
                       ref={profileImageRef}
                       src={imageToEditProfile}
                       alt="Foto de perfil para editar"
                       className="resize-image"
                       style={{
                         position: 'absolute',
                         left: `${cropDataProfile.x}px`,
                         top: `${cropDataProfile.y}px`,
                         width: `${cropDataProfile.width * scaleProfile}px`,
                         height: `${cropDataProfile.height * scaleProfile}px`,
                         cursor: isDraggingProfileRef.current ? 'grabbing' : 'move',
                         userSelect: 'none',
                         objectFit: 'cover',
                         touchAction: 'none'
                       }}
                       onMouseDown={handleProfileImageMouseDown}
                       draggable={false}
                     />
                   )}
                   <div className="overlay" style={{ aspectRatio: '1/1' }}></div>
                 </div>
               </div>

              <div className="editor-actions">
                <button className="editor-btn editor-btn-cancel" onClick={handleCancelProfileEdit}>
                  Cancelar
                </button>
                <button 
                  className="editor-btn editor-btn-crop js-crop" 
                  onClick={handleConfirmProfileCrop}
                  disabled={uploadingProfileImage}
                >
                  {uploadingProfileImage ? 'Processando...' : 'Aplicar Crop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="personalization-page">
        <h1>Personalização</h1>
        <p className="subtitle">Personalize a aparência da sua loja</p>

        {message && (
          <div className={`message floating ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="form-container">
          <h2>Imagem do Banner</h2>
          <p className="form-description">
            Escolha a imagem que aparecerá no topo do seu cardápio.
          </p>

          <div className="form-group">
            <div
              className="image-upload-area"
              onClick={handleImageClick}
              style={{
                width: '100%',
                aspectRatio: '1920/840',
                border: '2px dashed #ddd',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                disabled={uploadingLogo}
              />
              
              {uploadingLogo ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                  <p>Enviando imagem...</p>
                </div>
              ) : logoPreview ? (
                <>
                  <img
                    src={logoPreview}
                    alt="Preview do logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLogo();
                    }}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      zIndex: 10
                    }}
                    title="Remover logo"
                  >
                    <img
                      src={trashIcon}
                      alt="Remover"
                      style={{
                        width: '20px',
                        height: '20px',
                        filter: 'brightness(0) invert(1)'
                      }}
                    />
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={addImageIcon}
                    alt="Adicionar imagem"
                    style={{ width: '64px', height: '64px', marginBottom: '16px', opacity: 0.5 }}
                  />
                  <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
                    Clique para adicionar imagem do logo
                  </p>
                  <p style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>
                    PNG, JPG ou SVG (máx. 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seção de Foto de Perfil */}
        <div className="form-container">
          <h2>Foto de Perfil da Loja</h2>
          <p className="form-description">
            Escolha a foto de perfil que aparecerá no checkout/identificação. Esta imagem será exibida em formato circular.
          </p>

          <div className="form-group">
            <div
              className="image-upload-area"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  handleProfileImageChange(file);
                };
                input.click();
              }}
              style={{
                width: '200px',
                height: '200px',
                border: '2px dashed #ddd',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9',
                position: 'relative',
                overflow: 'hidden',
                margin: '0 auto'
              }}
            >
              {profileImagePreview ? (
                <>
                  <img
                    src={profileImagePreview}
                    alt="Foto de perfil"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                  {uploadingProfileImage && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '14px',
                      borderRadius: '50%'
                    }}>
                      Carregando...
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <img
                    src={addImageIcon}
                    alt="Adicionar foto"
                    style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }}
                  />
                  <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                    Clique para adicionar foto de perfil
                  </p>
                  <p style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                    PNG, JPG (máx. 5MB)
                  </p>
                </div>
              )}
            </div>
            {profileImagePreview && (
              <button
                onClick={async () => {
                  if (!store?.id) return;
                  if (!confirm('Tem certeza que deseja remover a foto de perfil?')) return;

                  try {
                    const { data: existingCustomization } = await supabase
                      .from('store_customizations')
                      .select('profile_image_url')
                      .eq('store_id', store.id)
                      .maybeSingle();

                    if (existingCustomization?.profile_image_url) {
                      await deleteImageFromStorage(existingCustomization.profile_image_url);
                    }

                    const { error: updateError } = await supabase
                      .from('store_customizations')
                      .update({
                        profile_image_url: null,
                        updated_at: new Date().toISOString()
                      })
                      .eq('store_id', store.id);

                    if (updateError) throw updateError;

                    setProfileImagePreview(null);
                    setMessage('✅ Foto de perfil removida com sucesso!');
                    
                    await reloadCustomizations();
                  } catch (error: any) {
                    console.error('Erro ao remover foto de perfil:', error);
                    setMessage(`❌ Erro ao remover: ${error.message || 'Erro desconhecido'}`);
                  }
                }}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#dc3545',
                  background: 'transparent',
                  border: '1px solid #dc3545',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Remover foto de perfil
              </button>
            )}
          </div>
        </div>

        {/* Seção de Personalização da Barra Promocional */}
        <div className="form-container">
          <h2>Barra Promocional</h2>
          <p className="form-description">
            Personalize a barra promocional que aparece no topo do cardápio.
          </p>

          {promoBannerVisible && (
            <>
              {/* Banner Editável - substitui o campo de input */}
              <div className="form-group">
                {/* Campos de cor lado a lado */}
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                  {/* Seletor de cor para o fundo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: 0, padding: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                      Cor da Barra Promocional:
                    </span>
                    <span style={{ display: 'inline-block', verticalAlign: 'middle', margin: 0, padding: 0 }}>
                      <ColorPicker
                        value={promoBannerBgColor}
                        onChange={setPromoBannerBgColor}
                        label="Cor de fundo"
                      />
                    </span>
                  </div>
                  {/* Seletor de cor para o texto */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: 0, padding: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                      Cor do Texto:
                    </span>
                    <span style={{ display: 'inline-block', verticalAlign: 'middle', margin: 0, padding: 0 }}>
                      <ColorPicker
                        value={promoBannerTextColor}
                        onChange={setPromoBannerTextColor}
                        label="Cor do texto"
                      />
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#fff'
                  }}
                >
                  <section
                    className="promo-banner"
                    style={{
                      backgroundColor: promoBannerBgColor,
                      padding: '15px 16px',
                      textAlign: 'center',
                      width: '100%',
                      minWidth: '400px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      minHeight: 'calc(16px * 1.4 + 30px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box'
                    }}
                  >
                    {isEditingPromoText ? (
                      <input
                        type="text"
                        value={editingPromoText}
                        onChange={handlePromoTextChange}
                        onBlur={handlePromoTextSave}
                        onKeyDown={handlePromoTextKeyDown}
                        autoFocus
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
                          fontFamily: 'inherit'
                        }}
                      />
                    ) : (
                      <p
                        className={`promo-text ${promoBannerUseGradient ? `animation-${promoBannerAnimation}` : ''}`}
                        onDoubleClick={handlePromoTextDoubleClick}
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          margin: 0,
                          cursor: 'pointer',
                          // Aplicar cor sempre, exceto para animações que usam gradiente (rotate) ou shimmer
                          color: promoBannerAnimation !== 'rotate' && promoBannerAnimation !== 'shimmer' ? promoBannerTextColor : undefined,
                          ...(promoBannerAnimation === 'shimmer' ? {
                            '--text-color': promoBannerTextColor,
                            '--spread': '50px'
                          } : {}),
                          ...(promoBannerUseGradient ? {
                            '--animation-speed': (() => {
                              // Durações base para cada animação (mais lentas)
                              const baseDuration = promoBannerAnimation === 'blink' ? 2 : promoBannerAnimation === 'slide' ? 4 : promoBannerAnimation === 'shimmer' ? 2 : 3;
                              // Calcular duração: quanto maior a velocidade, menor a duração
                              const calculatedDuration = baseDuration / promoBannerAnimationSpeed;
                              return `${calculatedDuration}s`;
                            })()
                          } : {})
                        } as React.CSSProperties}
                        title="Clique duas vezes para editar"
                      >
                        {promoBannerText || ''}
                      </p>
                    )}
                  </section>
                </div>
                
                {/* Toggle de efeito de texto */}
                <div className="toggle-container">
                  <span style={{ display: 'inline-block', verticalAlign: 'middle', margin: 0, padding: 0, flexShrink: 0 }}>Efeito de texto:</span>
                  <input
                    type="checkbox"
                    id="promoBannerUseGradientToggle"
                    checked={promoBannerUseGradient}
                    onChange={(e) => setPromoBannerUseGradient(e.target.checked)}
                  />
                  <label htmlFor="promoBannerUseGradientToggle" style={{ display: 'block', margin: 'auto 0' }}>Toggle</label>
                  <CustomDropdown
                    value={promoBannerAnimation}
                    onChange={setPromoBannerAnimation}
                    disabled={!promoBannerUseGradient}
                    options={[
                      { value: 'blink', label: 'Piscar' },
                      { value: 'slide', label: 'Deslizar' },
                      { value: 'pulse', label: 'Pulsar' },
                      { value: 'shimmer', label: 'Shimmer' }
                    ]}
                  />
                  <span
                    onClick={() => {
                      if (!promoBannerUseGradient) return;
                      setPromoBannerAnimationSpeed(prev => {
                        if (prev === 1) return 1.5;
                        if (prev === 1.5) return 2;
                        if (prev === 2) return 2.5;
                        if (prev === 2.5) return 3;
                        return 1;
                      });
                    }}
                    style={{
                      marginLeft: '8px',
                      padding: '4px 8px',
                      fontSize: '14px',
                      color: promoBannerUseGradient ? '#333' : '#666',
                      cursor: promoBannerUseGradient ? 'pointer' : 'not-allowed',
                      opacity: promoBannerUseGradient ? 1 : 0.6,
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1',
                      minWidth: '50px',
                      textAlign: 'center'
                    }}
                  >
                    {promoBannerAnimationSpeed}x
                  </span>
                </div>
              </div>


            </>
          )}
        </div>

        {/* Seção de Cores da Loja */}
        <div className="form-container" style={{ marginTop: '30px', display: 'block' }}>
          <h2>Cores da Loja</h2>
          <p className="form-description">
            Personalize as cores principais da sua loja. Essas cores serão aplicadas em botões, links e outros elementos do site.
          </p>

          <div className="form-group">
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
              {/* Cor Primária */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexBasis: 'calc(50% - 8px)', minWidth: '200px', maxWidth: 'calc(50% - 8px)' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: 0, padding: 0, whiteSpace: 'nowrap', width: '120px', flexShrink: 0 }}>
                  Cor do botão 1:
                </span>
                <ColorPicker
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  label="Cor primária"
                />
              </div>

              {/* Cor Secundária */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexBasis: 'calc(50% - 8px)', minWidth: '200px', maxWidth: 'calc(50% - 8px)' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: 0, padding: 0, whiteSpace: 'nowrap', width: '120px', flexShrink: 0 }}>
                  Cor do botão 2:
                </span>
                <ColorPicker
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                  label="Cor secundária"
                />
              </div>

              {/* Cor de Fundo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexBasis: 'calc(50% - 8px)', minWidth: '200px', maxWidth: 'calc(50% - 8px)' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: 0, padding: 0, whiteSpace: 'nowrap', width: '120px', flexShrink: 0 }}>
                  Cor de Fundo:
                </span>
                <ColorPicker
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                  label="Cor de fundo"
                />
              </div>

              {/* Cor do Texto */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexBasis: 'calc(50% - 8px)', minWidth: '200px', maxWidth: 'calc(50% - 8px)' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#333', margin: 0, padding: 0, whiteSpace: 'nowrap', width: '120px', flexShrink: 0 }}>
                  Cor do Texto:
                </span>
                <ColorPicker
                  value={textColor}
                  onChange={setTextColor}
                  label="Cor do texto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Configurações de Exibição */}
        <div className="form-container" style={{ marginTop: '30px', display: 'block' }}>
          <h2>Configurações de Exibição</h2>
          <p className="form-description">
            Configure quais elementos devem ser exibidos na loja.
          </p>

          <div className="form-group" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              {/* Toggle para exibir botão de comprar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>
                    Exibir botão de comprar nos cards
                  </label>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                    Quando ativado, os botões "COMPRAR" e "ADICIONAR" aparecem nos cards dos produtos
                  </p>
                </div>
                <div className="toggle-container" style={{ margin: 0, flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    id="showBuyButtonToggle"
                    checked={showBuyButton}
                    onChange={(e) => setShowBuyButton(e.target.checked)}
                  />
                  <label htmlFor="showBuyButtonToggle">Toggle</label>
                </div>
              </div>

              {/* Toggle para botões de alto contraste */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>
                    Botões de alto contraste
                  </label>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                    Quando ativado, o texto dos botões usará cores preto/branco para máximo contraste com a cor de fundo
                  </p>
                </div>
                <div className="toggle-container" style={{ margin: 0, flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    id="highContrastButtonsToggle"
                    checked={highContrastButtons}
                    onChange={(e) => setHighContrastButtons(e.target.checked)}
                  />
                  <label htmlFor="highContrastButtonsToggle">Toggle</label>
                </div>
              </div>

              {/* Toggle para exibir botão flutuante */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>
                    Exibir botão flutuante na página do produto
                  </label>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                    Quando ativado, um botão flutuante aparece na parte inferior da tela ao rolar a página de detalhes do produto
                  </p>
                </div>
                <div className="toggle-container" style={{ margin: 0, flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    id="showFixedButtonToggle"
                    checked={showFixedButton}
                    onChange={(e) => setShowFixedButton(e.target.checked)}
                  />
                  <label htmlFor="showFixedButtonToggle">Toggle</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}



