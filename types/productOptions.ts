// Tipos para opções de produtos

export type OptionType = 'multiple' | 'single'; // Múltipla escolha ou escolha única

export interface ProductOption {
  id: string;
  name: string;
  additionalPrice?: number; // Preço adicional em centavos (ex: 50 = R$ 0,50)
}

export interface ProductOptionGroup {
  id: string;
  title: string; // Ex: "Selecione os Sabores dos Bastõezinhos"
  instruction: string; // Ex: "Escolha 3 opções"
  type: OptionType;
  required: boolean; // Se é obrigatório
  minSelections?: number; // Mínimo de seleções (para múltipla escolha)
  maxSelections?: number; // Máximo de seleções (para múltipla escolha)
  options: ProductOption[];
}

export interface SelectedOptions {
  [groupId: string]: string[]; // Para cada grupo, array de IDs de opções selecionadas
}

export interface ProductWithOptions {
  optionGroups?: ProductOptionGroup[];
}


