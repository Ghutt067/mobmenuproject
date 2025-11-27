import type { Product } from '../services/productService';
import type { SelectedOptions, ProductOptionGroup } from '../types/productOptions';

/**
 * Calcula o preço total de um produto incluindo preços adicionais das opções selecionadas
 * @param product - Produto
 * @param selectedOptions - Opções selecionadas
 * @returns Preço total em centavos
 */
export function calculateProductTotalPrice(
  product: Product,
  selectedOptions?: SelectedOptions
): number {
  // Converter preço do produto de string para centavos
  const normalizePrice = (price: string): number => {
    return Math.round(
      parseFloat(
        price
          .replace(/R\$\s*/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
          .trim()
      ) * 100
    ) || 0;
  };

  let totalPrice = normalizePrice(product.newPrice);

  // Adicionar preços das opções selecionadas
  if (selectedOptions && product.optionGroups) {
    for (const group of product.optionGroups) {
      const selectedIds = selectedOptions[group.id] || [];
      
      for (const optionId of selectedIds) {
        const option = group.options.find((opt) => opt.id === optionId);
        if (option && option.additionalPrice) {
          totalPrice += option.additionalPrice;
        }
      }
    }
  }

  return totalPrice;
}

/**
 * Formata o preço total incluindo opções selecionadas
 * @param product - Produto
 * @param selectedOptions - Opções selecionadas
 * @returns String formatada do preço (ex: "R$ 25,50")
 */
export function formatProductTotalPrice(
  product: Product,
  selectedOptions?: SelectedOptions
): string {
  const totalInCents = calculateProductTotalPrice(product, selectedOptions);
  const totalInReais = totalInCents / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalInReais);
}

/**
 * Calcula apenas o preço adicional das opções selecionadas
 * @param product - Produto
 * @param selectedOptions - Opções selecionadas
 * @returns Preço adicional em centavos
 */
export function calculateAdditionalPrice(
  product: Product,
  selectedOptions?: SelectedOptions
): number {
  if (!selectedOptions || !product.optionGroups) {
    return 0;
  }

  let additionalPrice = 0;

  for (const group of product.optionGroups) {
    const selectedIds = selectedOptions[group.id] || [];
    
    for (const optionId of selectedIds) {
      const option = group.options.find((opt) => opt.id === optionId);
      if (option && option.additionalPrice) {
        additionalPrice += option.additionalPrice;
      }
    }
  }

  return additionalPrice;
}


