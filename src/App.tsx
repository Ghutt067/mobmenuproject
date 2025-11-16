import React, { useEffect, useRef } from 'react';
import Header from './components/Header';
import PromoBanner from './components/PromoBanner';
import ProductCard from './components/ProductCard';
import { products } from './data/products';
import './App.css';

function App() {
  const headerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updatePadding = () => {
      if (headerRef.current && mainContentRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        mainContentRef.current.style.paddingTop = `${headerHeight + 30}px`;
      }
    };

    updatePadding();
    window.addEventListener('resize', updatePadding);
    
    // Aguardar o carregamento da imagem da logo
    const logoImage = document.querySelector('.logo-image') as HTMLImageElement;
    if (logoImage) {
      if (logoImage.complete) {
        updatePadding();
      } else {
        logoImage.addEventListener('load', updatePadding);
      }
    }

    return () => {
      window.removeEventListener('resize', updatePadding);
      if (logoImage) {
        logoImage.removeEventListener('load', updatePadding);
      }
    };
  }, []);

  return (
    <div className="app">
      {/* RÓTULO: Header com ícones e logo + Banner promocional */}
      <div className="fixed-header" ref={headerRef}>
        <Header />
        <PromoBanner />
      </div>
      
      {/* PRODUTOS: Seção de produtos */}
      <main className="main-content" ref={mainContentRef}>
        <h2 className="section-title">OS MAIS PEDIDOS:</h2>
        
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              image={product.image}
              title={product.title}
              description1={product.description1}
              description2={product.description2}
              oldPrice={product.oldPrice}
              newPrice={product.newPrice}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
