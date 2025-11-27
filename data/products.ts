import product1Image from '../assets/product1.png';
import product2Image from '../assets/product2.jpg';
import product3Image from '../assets/product3.png';
import product4Image from '../assets/product4.jpeg';
import product5Image from '../assets/product5.jpeg';
import product6Image from '../assets/product6.png';
import product7Image from '../assets/product7.jpeg';
import product8Image from '../assets/product8.jpeg';
import product9Image from '../assets/product9.png';
import product10Image from '../assets/product10.jpeg';
import product11Image from '../assets/product11.png';
import product12Image from '../assets/product12.png';
import product13Image from '../assets/product13.png';
import product14Image from '../assets/product14.jpeg';
import product15Image from '../assets/product15.png';
import product16Image from '../assets/product16.png';
import product17Image from '../assets/product17.jpeg';
import product1s2Image from '../assets/product1s2.jpeg';
import product2s2Image from '../assets/product2s2.jpeg';
import product3s2Image from '../assets/product3s2.jpeg';
import product4s2Image from '../assets/product4s2.jpeg';
import product5s2Image from '../assets/product5s2.jpeg';
import product6s2Image from '../assets/product6s2.jpeg';

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
  product3: product3Image,
  product4: product4Image,
  product5: product5Image,
  product6: product6Image,
  product7: product7Image,
  product8: product8Image,
  product9: product9Image,
  product10: product10Image,
  product11: product11Image,
  product12: product12Image,
  product13: product13Image,
  product14: product14Image,
  product15: product15Image,
  product16: product16Image,
  product17: product17Image,
  product1s2: product1s2Image,
  product2s2: product2s2Image,
  product3s2: product3s2Image,
  product4s2: product4s2Image,
  product5s2: product5s2Image,
  product6s2: product6s2Image,
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

