import { useStore } from '../contexts/StoreContext';
import './PromoBanner.css';

const PromoBanner = () => {
  const { store } = useStore();
  
  const customization = store?.customizations;
  
  // Se o banner não deve aparecer, não renderizar
  if (customization && !customization.promoBannerVisible) {
    return null;
  }
  
  const text = customization?.promoBannerText || 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF';
  const bgColor = customization?.promoBannerBgColor || '#FDD8A7';
  const textColor = customization?.promoBannerTextColor || '#000000';
  const useGradient = customization?.promoBannerUseGradient ?? true;
  
  return (
    <section 
      className="promo-banner"
      style={{ backgroundColor: bgColor }}
    >
      <p 
        className={`promo-text ${useGradient ? 'with-gradient' : ''}`}
        style={!useGradient ? { color: textColor } : undefined}
      >
        {text}
      </p>
    </section>
  );
};

export default PromoBanner;

