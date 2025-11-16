import React from 'react';
import { productImages } from '../data/products';
import './ProductCard.css';

interface ProductCardProps {
  image: string;
  title: string;
  description1: string;
  description2: string;
  oldPrice: string;
  newPrice: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  title,
  description1,
  description2,
  oldPrice,
  newPrice,
}) => {
  const productImage = productImages[image] || productImages.product1;

  const handleReadMoreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    const link = e.currentTarget;
    const productCard = link.closest('.product-card') as HTMLElement;
    
    if (!productCard) return;
    
    const readmoreElement = productCard.querySelector('.readmore') as HTMLElement;
    if (!readmoreElement) return;
    
    // Toggle the expand state
    const isExpanded = readmoreElement.classList.contains('expand');
    
    if (isExpanded) {
      readmoreElement.classList.remove('expand');
    } else {
      readmoreElement.classList.add('expand');
    }
  };

  return (
    <div className="product-card">
      <img src={productImage} alt={title} className="product-image" />
      <div className="product-content">
        <div className="TeD">
          <div className="product-text-wrapper">
            <div className="product-text-content readmore">
              <h3 className="product-title">{title}</h3>
              {description1 && <p className="product-description">{description1}</p>}
              {description2 && <p className="product-description">{description2}</p>}
            </div>
          </div>
        </div>
        <a href="#" className="readmore-link" onClick={handleReadMoreClick}>
          <svg className="readmore-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 13L12 16M12 16L15 13M12 16V8M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
        <div className="price-container">
          <span className="price-old">{oldPrice}</span>
          <span className="price-separator">|</span>
          <span className="price-new">{newPrice}</span>
        </div>
      </div>
      <button className="buy-btn">COMPRAR</button>
    </div>
  );
};

export default ProductCard;

