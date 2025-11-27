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

  // Verificar se o produto tem preço base (não é 0 ou vazio)
  const productBasePrice = normalizePrice(product.newPrice);
  const hasBasePrice = productBasePrice > 0;

  // Se o produto não tem preço base, começar com 0
  // Caso contrário, usar o preço base do produto
  let totalPrice = hasBasePrice ? productBasePrice : 0;

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

/**
 * Verifica se o produto tem preço base (não é 0 ou vazio)
 * @param product - Produto
 * @returns true se o produto tem preço base, false caso contrário
 */
export function hasProductBasePrice(product: Product): boolean {
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

  const productBasePrice = normalizePrice(product.newPrice);
  return productBasePrice > 0;
}

/**
 * Calcula o preço mínimo das opções de um produto
 * @param product - Produto
 * @returns Preço mínimo em centavos, ou 0 se não houver opções
 */
export function calculateMinimumOptionPrice(product: Product): number {
  if (!product.optionGroups || product.optionGroups.length === 0) {
    return 0;
  }

  let minimumPrice = 0;

  // Para cada grupo de opções obrigatório, encontrar o preço mínimo
  for (const group of product.optionGroups) {
    if (!group.options || group.options.length === 0) {
      continue;
    }

    // Se o grupo é obrigatório, adicionar o preço mínimo deste grupo
    if (group.required) {
      // Encontrar o preço mínimo entre as opções deste grupo
      const groupMinPrice = Math.min(
        ...group.options.map(option => option.additionalPrice || 0)
      );
      minimumPrice += groupMinPrice;
    }
  }

  // Se não há grupos obrigatórios, encontrar o preço mínimo entre todos os grupos
  if (minimumPrice === 0) {
    let globalMinPrice = Infinity;
    for (const group of product.optionGroups) {
      if (!group.options || group.options.length === 0) {
        continue;
      }
      const groupMinPrice = Math.min(
        ...group.options.map(option => option.additionalPrice || 0)
      );
      if (groupMinPrice > 0 && groupMinPrice < globalMinPrice) {
        globalMinPrice = groupMinPrice;
      }
    }
    minimumPrice = globalMinPrice === Infinity ? 0 : globalMinPrice;
  }

  return minimumPrice;
}


