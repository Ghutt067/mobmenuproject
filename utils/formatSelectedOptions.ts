import type { SelectedOptions } from '../types/productOptions';
import type { Product } from '../services/productService';

/**
 * Formata as opções selecionadas de um produto para exibição
 * @param product - Produto com seus grupos de opções
 * @param selectedOptions - Opções selecionadas
 * @returns String formatada com as opções selecionadas
 */
export function formatSelectedOptions(
  product: Product,
  selectedOptions?: SelectedOptions
): string {
  if (!selectedOptions || !product.optionGroups || product.optionGroups.length === 0) {
    return '';
  }

  const formattedOptions: string[] = [];

  for (const group of product.optionGroups) {
    const selectedIds = selectedOptions[group.id] || [];
    if (selectedIds.length === 0) continue;

    const selectedNames = selectedIds
      .map((optionId) => {
        const option = group.options.find((opt) => opt.id === optionId);
        return option ? option.name : null;
      })
      .filter((name): name is string => name !== null);

    if (selectedNames.length > 0) {
      formattedOptions.push(`${group.title}: ${selectedNames.join(', ')}`);
    }
  }

  return formattedOptions.join(' | ');
}


