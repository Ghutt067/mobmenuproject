/**
 * Formata o preço garantindo que sempre tenha "R$" antes do valor
 * @param price - Preço a ser formatado (pode ser vazio, null ou string vazia)
 * @returns Preço formatado com "R$" ou string vazia se o preço for inválido
 */
export function formatPrice(price: string | null | undefined): string {
  if (!price || price.trim() === '') return '';
  const trimmedPrice = price.trim();
  // Se já começa com "R$", retorna como está
  if (trimmedPrice.startsWith('R$')) {
    return trimmedPrice;
  }
  // Caso contrário, adiciona "R$" antes
  return `R$${trimmedPrice}`;
}

