import React, { useState, useEffect } from 'react';
import type { ProductOptionGroup, SelectedOptions } from '../types/productOptions';
import './ProductOptions.css';

interface ProductOptionsProps {
  optionGroups: ProductOptionGroup[];
  onSelectionChange: (selectedOptions: SelectedOptions) => void;
  initialSelections?: SelectedOptions;
}

const ProductOptions: React.FC<ProductOptionsProps> = ({
  optionGroups,
  onSelectionChange,
  initialSelections = {},
}) => {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(initialSelections);

  // Log para diagnóstico
  useEffect(() => {
    console.log('🎯 [ProductOptions] Componente renderizado:', {
      optionGroupsCount: optionGroups?.length || 0,
      optionGroups: optionGroups?.map(g => ({
        id: g.id,
        title: g.title,
        type: g.type,
        optionsCount: g.options?.length || 0,
        options: g.options?.map(o => ({ id: o.id, name: o.name }))
      }))
    });
  }, [optionGroups]);

  useEffect(() => {
    onSelectionChange(selectedOptions);
  }, [selectedOptions, onSelectionChange]);

  const handleOptionToggle = (groupId: string, optionId: string, group: ProductOptionGroup) => {
    setSelectedOptions((prev) => {
      const currentSelections = prev[groupId] || [];
      const isSelected = currentSelections.includes(optionId);

      if (group.type === 'single') {
        // Escolha única: substitui a seleção anterior
        return {
          ...prev,
          [groupId]: isSelected ? [] : [optionId],
        };
      } else {
        // Múltipla escolha
        let newSelections: string[];
        
        if (isSelected) {
          // Remove a opção
          newSelections = currentSelections.filter((id) => id !== optionId);
        } else {
          // Adiciona a opção, respeitando o limite máximo
          const maxSelections = group.maxSelections || Infinity;
          if (currentSelections.length >= maxSelections) {
            // Não permite adicionar mais se já atingiu o máximo
            return prev;
          }
          newSelections = [...currentSelections, optionId];
        }

        return {
          ...prev,
          [groupId]: newSelections,
        };
      }
    });
  };

  const formatAdditionalPrice = (price?: number): string => {
    if (!price || price === 0) return '';
    const reais = price / 100;
    return ` + R$ ${reais.toFixed(2).replace('.', ',')}`;
  };

  const getSelectionCount = (groupId: string): number => {
    return selectedOptions[groupId]?.length || 0;
  };

  const isOptionSelected = (groupId: string, optionId: string): boolean => {
    return selectedOptions[groupId]?.includes(optionId) || false;
  };

  const isSelectionComplete = (group: ProductOptionGroup): boolean => {
    const count = getSelectionCount(group.id);
    const minSelections = group.minSelections || (group.type === 'single' ? 1 : 0);
    return count >= minSelections;
  };

  const canSelectMore = (group: ProductOptionGroup): boolean => {
    if (group.type === 'single') return false;
    const count = getSelectionCount(group.id);
    const maxSelections = group.maxSelections || Infinity;
    return count < maxSelections;
  };

  // Verificar se há grupos válidos com opções
  const validGroups = optionGroups?.filter(group => 
    group && group.options && group.options.length > 0
  ) || [];

  console.log('🔍 [ProductOptions] Grupos válidos:', {
    totalGroups: optionGroups?.length || 0,
    validGroups: validGroups.length,
    groups: validGroups.map(g => ({
      id: g.id,
      title: g.title,
      optionsCount: g.options?.length || 0
    }))
  });

  if (validGroups.length === 0) {
    console.warn('⚠️ [ProductOptions] Nenhum grupo válido com opções encontrado');
    return null;
  }

  return (
    <div className="product-options-container">
      {validGroups.map((group) => {
        const selectionCount = getSelectionCount(group.id);
        const minSelections = group.minSelections || (group.type === 'single' ? 1 : 0);
        const maxSelections = group.maxSelections;
        const isComplete = isSelectionComplete(group);
        const canSelect = canSelectMore(group);

        return (
          <div key={group.id} className="product-option-group">
            <div className="product-option-group-header">
              <h3 className="product-option-group-title">{group.title}</h3>
              <div className="product-option-group-info">
                <span className="product-option-group-instruction">{group.instruction}</span>
                <div className="product-option-group-status">
                  <span className={`product-option-count ${isComplete ? 'complete' : ''}`}>
                    {selectionCount}/{minSelections}
                  </span>
                  {group.required && (
                    <span className="product-option-required">OBRIGATÓRIO</span>
                  )}
                </div>
              </div>
            </div>

            <div className="product-option-list">
              {group.options.map((option) => {
                const isSelected = isOptionSelected(group.id, option.id);
                const canAdd = group.type === 'multiple' && !isSelected && canSelect;

                return (
                  <div
                    key={option.id}
                    className={`product-option-item ${isSelected ? 'selected' : ''}`}
                  >
                    <span className="product-option-name">
                      {option.name}
                      {formatAdditionalPrice(option.additionalPrice)}
                    </span>
                    {group.type === 'single' ? (
                      <button
                        type="button"
                        className={`product-option-radio ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleOptionToggle(group.id, option.id, group)}
                        aria-label={`Selecionar ${option.name}`}
                      >
                        {isSelected && <span className="product-option-radio-dot"></span>}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`product-option-add ${canAdd ? 'enabled' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleOptionToggle(group.id, option.id, group)}
                        disabled={!canAdd && !isSelected}
                        aria-label={isSelected ? `Remover ${option.name}` : `Adicionar ${option.name}`}
                      >
                        {isSelected ? (
                          <span className="product-option-remove">−</span>
                        ) : (
                          <span className="product-option-add-icon">+</span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductOptions;

