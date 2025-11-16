import product1Image from '../assets/product1.png';
import product2Image from '../assets/product2.jpg';

export interface Product {
  id: number;
  image: string;
  title: string;
  description1: string;
  description2: string;
  oldPrice: string;
  newPrice: string;
}

// Mapeamento de nomes de imagens para imports reais
export const productImages: Record<string, string> = {
  product1: product1Image,
  product2: product2Image,
};

export const products: Product[] = [
  {
    id: 1,
    image: 'product1',
    title: 'Kit Best Seller',
    description1: '11 Tipos de Queijos',
    description2: '+ Vinho Malbec Brinde',
    oldPrice: 'R$249,90',
    newPrice: 'R$79,90',
  },
  {
    id: 2,
    image: 'product2',
    title: 'Caixa de Presente com os 8 Melhores Queijos Artesanais Brasileiros de 2025 + Geléia + Grissini',
    description1: '',
    description2: '',
    oldPrice: 'R$149,90',
    newPrice: 'R$85,90',
  },
  {
    id: 3,
    image: 'product1',
    title: 'Kit Best Seller',
    description1: '11 Tipos de Queijos',
    description2: '+ Vinho Malbec Brinde',
    oldPrice: 'R$249,90',
    newPrice: 'R$79,90',
  },
  {
    id: 4,
    image: 'product2',
    title: 'Caixa de Presente com os 8 Melhores Queijos Artesanais Brasileiros de 2025 + Geléia + Grissini',
    description1: '',
    description2: '',
    oldPrice: 'R$149,90',
    newPrice: 'R$85,90',
  },
];

