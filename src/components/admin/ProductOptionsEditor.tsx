import React, { useState } from 'react';
import type { ProductOptionGroup, ProductOption, OptionType } from '../../types/productOptions';
import trashIcon from '../../icons/trash-svgrepo-com.svg';
import './ProductOptionsEditor.css';

interface ProductOptionsEditorProps {
  optionGroups: ProductOptionGroup[];
  onChange: (optionGroups: ProductOptionGroup[]) => void;
}

const ProductOptionsEditor: React.FC<ProductOptionsEditorProps> = ({
  optionGroups,
  onChange,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const generateId = () => {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const addGroup = () => {
    const newGroup: ProductOptionGroup = {
      id: generateId(),
      title: '',
      instruction: 'Escolha 1 opção',
      type: 'single',
      required: true,
      minSelections: 1,
      maxSelections: 1,
      options: [],
    };
    onChange([...optionGroups, newGroup]);
    setExpandedGroups((prev) => new Set(prev).add(newGroup.id));
  };

  const removeGroup = (groupId: string) => {
    onChange(optionGroups.filter((g) => g.id !== groupId));
  };

  const updateGroup = (groupId: string, updates: Partial<ProductOptionGroup>) => {
    onChange(
      optionGroups.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  };

  const addOption = (groupId: string) => {
    const newOption: ProductOption = {
      id: generateId(),
      name: '',
      additionalPrice: 0,
    };
    updateGroup(groupId, {
      options: [...(optionGroups.find((g) => g.id === groupId)?.options || []), newOption],
    });
  };

  const removeOption = (groupId: string, optionId: string) => {
    const group = optionGroups.find((g) => g.id === groupId);
    if (group) {
      updateGroup(groupId, {
        options: group.options.filter((o) => o.id !== optionId),
      });
    }
  };

  const updateOption = (groupId: string, optionId: string, updates: Partial<ProductOption>) => {
    const group = optionGroups.find((g) => g.id === groupId);
    if (group) {
      updateGroup(groupId, {
        options: group.options.map((o) => (o.id === optionId ? { ...o, ...updates } : o)),
      });
    }
  };

  const handleTypeChange = (groupId: string, type: OptionType) => {
    const group = optionGroups.find((g) => g.id === groupId);
    if (group) {
      if (type === 'single') {
        updateGroup(groupId, {
          type: 'single',
          instruction: 'Escolha 1 opção',
          minSelections: 1,
          maxSelections: 1,
        });
      } else {
        updateGroup(groupId, {
          type: 'multiple',
          instruction: 'Escolha 3 opções',
          minSelections: 1,
          maxSelections: 3,
        });
      }
    }
  };

  const formatPrice = (cents: number): string => {
    const reais = cents / 100;
    return reais.toFixed(2).replace('.', ',');
  };

  const parsePrice = (value: string): number => {
    const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
    const reais = parseFloat(cleaned) || 0;
    return Math.round(reais * 100);
  };

  return (
    <div className="product-options-editor">
      <div className="options-editor-header">
        <h3>Opções do Produto</h3>
        <button type="button" onClick={addGroup} className="add-group-btn">
          + Adicionar Grupo de Opções
        </button>
      </div>

      {optionGroups.length === 0 && (
        <div className="no-options-message">
          <p>Nenhum grupo de opções adicionado.</p>
          <p className="hint">Adicione grupos para permitir que clientes personalizem o produto.</p>
        </div>
      )}

      {optionGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.id);

        return (
          <div key={group.id} className="option-group-editor">
            <div className="option-group-header" onClick={() => toggleGroup(group.id)}>
              <div className="group-header-left">
                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                <span className="group-title-preview">
                  {group.title || 'Grupo sem título'}
                </span>
                {group.required && <span className="required-badge">OBRIGATÓRIO</span>}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeGroup(group.id);
                }}
                className="remove-group-btn"
                title="Remover grupo"
              >
                <img src={trashIcon} alt="Remover" />
              </button>
            </div>

            {isExpanded && (
              <div className="option-group-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>Título do Grupo *</label>
                    <input
                      type="text"
                      value={group.title}
                      onChange={(e) => updateGroup(group.id, { title: e.target.value })}
                      placeholder="Ex: Selecione os Sabores dos Bastõezinhos"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Seleção *</label>
                    <select
                      value={group.type}
                      onChange={(e) => handleTypeChange(group.id, e.target.value as OptionType)}
                    >
                      <option value="single">Escolha Única (Radio)</option>
                      <option value="multiple">Múltipla Escolha</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Instrução</label>
                    <input
                      type="text"
                      value={group.instruction}
                      onChange={(e) => updateGroup(group.id, { instruction: e.target.value })}
                      placeholder="Ex: Escolha 3 opções"
                    />
                  </div>
                </div>

                {group.type === 'multiple' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mínimo de Seleções</label>
                      <input
                        type="number"
                        min="1"
                        value={group.minSelections || 1}
                        onChange={(e) =>
                          updateGroup(group.id, {
                            minSelections: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Máximo de Seleções</label>
                      <input
                        type="number"
                        min="1"
                        value={group.maxSelections || 3}
                        onChange={(e) =>
                          updateGroup(group.id, {
                            maxSelections: parseInt(e.target.value) || 3,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={group.required}
                        onChange={(e) => updateGroup(group.id, { required: e.target.checked })}
                      />
                      <span>Obrigatório</span>
                    </label>
                  </div>
                </div>

                <div className="options-list">
                  <div className="options-list-header">
                    <h4>Opções</h4>
                    <button
                      type="button"
                      onClick={() => addOption(group.id)}
                      className="add-option-btn"
                    >
                      + Adicionar Opção
                    </button>
                  </div>

                  {group.options.length === 0 && (
                    <div className="no-options-message-small">
                      Nenhuma opção adicionada. Clique em "Adicionar Opção" para começar.
                    </div>
                  )}

                  {group.options.map((option) => (
                    <div key={option.id} className="option-item-editor">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nome da Opção *</label>
                          <input
                            type="text"
                            value={option.name}
                            onChange={(e) => updateOption(group.id, option.id, { name: e.target.value })}
                            placeholder="Ex: Frango Cremoso"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Preço Adicional (R$)</label>
                          <input
                            type="text"
                            value={formatPrice(option.additionalPrice || 0)}
                            onChange={(e) =>
                              updateOption(group.id, option.id, {
                                additionalPrice: parsePrice(e.target.value),
                              })
                            }
                            placeholder="0,00"
                          />
                        </div>

                        <div className="form-group">
                          <button
                            type="button"
                            onClick={() => removeOption(group.id, option.id)}
                            className="remove-option-btn"
                            title="Remover opção"
                          >
                            <img src={trashIcon} alt="Remover" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProductOptionsEditor;


