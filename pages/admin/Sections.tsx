import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../contexts/StoreContext';
import { clearProductsCache, getAllProducts } from '../../services/productService';
import AdminLayout from '../../components/admin/AdminLayout';
import trashIcon from '../../icons/trash-svgrepo-com.svg';
import './Sections.css';

interface Set {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  store_id: string;
}

export default function AdminSections() {
  const location = useLocation();
  const { store } = useStore();
  const [sets, setSets] = useState<Set[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [setProductsCounts, setSetProductsCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSet, setEditingSet] = useState<Set | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_order: 0,
    is_active: true,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (store?.id) {
      loadSets();
    }
  }, [store?.id]);

  const loadSets = async (): Promise<Set[]> => {
    if (!store?.id) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sets')
        .select('*')
        .eq('store_id', store.id)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Verificar se existe a seção padrão "OS MAIS PEDIDOS"
      const defaultSet = data?.find(set => set.name === 'OS MAIS PEDIDOS');
      
      let finalSets: Set[] = [];
      
      if (!defaultSet) {
        // Criar seção padrão "OS MAIS PEDIDOS" se não existir
        const { data: newSet, error: createError } = await supabase
          .from('sets')
          .insert({
            name: 'OS MAIS PEDIDOS',
            display_order: 1,
            is_active: true,
            store_id: store.id,
          })
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar seção padrão:', createError);
          finalSets = data || [];
        } else if (newSet) {
          // Atribuir produtos sem set_id à seção padrão
          await supabase
            .from('products')
            .update({ set_id: newSet.id })
            .eq('store_id', store.id)
            .is('set_id', null)
            .eq('is_active', true);
          
          // Recarregar sets após criar a seção padrão
          const { data: updatedData, error: reloadError } = await supabase
            .from('sets')
            .select('*')
            .eq('store_id', store.id)
            .order('display_order', { ascending: true });
          
          if (reloadError) throw reloadError;
          finalSets = updatedData || [];
        } else {
          finalSets = data || [];
        }
      } else {
        // Seção padrão já existe - garantir que produtos sem set_id sejam atribuídos a ela
        await supabase
          .from('products')
          .update({ set_id: defaultSet.id })
          .eq('store_id', store.id)
          .is('set_id', null)
          .eq('is_active', true);
        
        finalSets = data || [];
      }
      
      setSets(finalSets);
      await loadProductsCount(finalSets);
      return finalSets;
    } catch (error: any) {
      console.error('Erro ao carregar seções:', error);
      setMessage(`❌ Erro ao carregar seções: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadProductsCount = async (setsToCount?: Set[]) => {
    if (!store?.id) return;

    try {
      const products = await getAllProducts(store.id);
      setProductsCount(products.length);
      
      // Usar sets passados como parâmetro ou o estado atual
      const setsToUse = setsToCount || sets;
      
      // Contar produtos de cada seção
      const counts: Record<string, number> = {};
      for (const set of setsToUse) {
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .eq('set_id', set.id)
          .eq('is_active', true);
        
        if (error) {
          console.error(`Erro ao contar produtos da seção ${set.id}:`, error);
          counts[set.id] = 0;
        } else {
          counts[set.id] = count || 0;
        }
      }
      setSetProductsCounts(counts);
    } catch (error: any) {
      console.error('Erro ao contar produtos:', error);
    }
  };

  const handleAdd = () => {
    setEditingSet(null);
    // Se não há seções, começar com 0. Se há, pegar o maior + 1
    const maxOrder = sets.length > 0 ? Math.max(...sets.map(s => s.display_order)) : -1;
    setFormData({
      name: '',
      display_order: maxOrder + 1,
      is_active: true,
    });
    setShowAddForm(true);
    setMessage('');
  };

  // Abrir formulário se vier da página de produtos
  useEffect(() => {
    if (location.state?.openForm && store?.id && !loading) {
      handleAdd();
    }
  }, [location.state, store?.id, loading]);

  const handleEdit = (set: Set) => {
    setEditingSet(set);
    setFormData({
      name: set.name,
      display_order: set.display_order,
      is_active: set.is_active,
    });
    setShowAddForm(true);
    setMessage('');
  };

  const handleDeleteWithProducts = async (setId: string, setName: string) => {
    if (!store?.id) return;

    // Buscar todos os produtos da seção
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, title')
      .eq('store_id', store.id)
      .eq('set_id', setId)
      .eq('is_active', true);

    if (fetchError) {
      console.error('Erro ao buscar produtos:', fetchError);
      setMessage(`❌ Erro ao buscar produtos: ${fetchError.message}`);
      return;
    }

    const productsCount = products?.length || 0;

    const confirmMessage = `Tem certeza que deseja excluir a seção "${setName}"?\n\nIsso irá excluir ${productsCount} produto${productsCount !== 1 ? 's' : ''} que ${productsCount !== 1 ? 'estão' : 'está'} nesta seção.\n\nEsta ação não pode ser desfeita!`;
    
    if (!confirm(confirmMessage)) return;

    try {
      // Marcar todos os produtos da seção como inativos
      const { error: updateError } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('store_id', store.id)
        .eq('set_id', setId)
        .eq('is_active', true);

      if (updateError) throw updateError;

      // Excluir a seção
      const { error: deleteError } = await supabase
        .from('sets')
        .delete()
        .eq('id', setId)
        .eq('store_id', store.id);

      if (deleteError) throw deleteError;

      setMessage(`✅ Seção excluída com sucesso! ${productsCount} produto${productsCount !== 1 ? 's' : ''} ${productsCount !== 1 ? 'foram' : 'foi'} excluído${productsCount !== 1 ? 's' : ''}.`);
      
      // Limpar cache de produtos para forçar recarregamento
      clearProductsCache();
      
      const updatedSets = await loadSets();
      // loadProductsCount já é chamado dentro de loadSets
    } catch (error: any) {
      console.error('Erro ao excluir seção:', error);
      setMessage(`❌ Erro ao excluir seção: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    setMessage('');

    try {
      if (editingSet) {
        // Atualizar seção existente
        const { error } = await supabase
          .from('sets')
          .update({
            name: formData.name,
            display_order: formData.display_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSet.id)
          .eq('store_id', store.id);

        if (error) throw error;

        setMessage('✅ Seção atualizada com sucesso!');
      } else {
        // Criar nova seção
        const { error } = await supabase
          .from('sets')
          .insert({
            name: formData.name,
            display_order: formData.display_order,
            is_active: formData.is_active,
            store_id: store.id,
          });

        if (error) throw error;

        setMessage('✅ Seção criada com sucesso!');
      }

      // Limpar cache de produtos para forçar recarregamento
      clearProductsCache();
      
      setShowAddForm(false);
      setEditingSet(null);
      await loadSets();
      // Aguardar um pouco para garantir que sets foram carregados
      setTimeout(() => loadProductsCount(), 100);
    } catch (error: any) {
      console.error('Erro ao salvar seção:', error);
      setMessage(`❌ Erro ao salvar seção: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingSet(null);
    setFormData({
      name: '',
      display_order: 0,
      is_active: true,
    });
    setMessage('');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Carregando seções...</div>
      </AdminLayout>
    );
  }

  // Se não há seções e não está mostrando o formulário, mostrar empty state
  if (sets.length === 0 && !showAddForm) {
    return (
      <AdminLayout>
        <div className="sections-admin-page">
          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          <div className="empty-state">
            <div className="empty-icon">📑</div>
            <h3>Nenhuma seção criada</h3>
            <p>Comece criando sua primeira seção para organizar seus produtos</p>
            <button className="add-button" onClick={handleAdd}>
              ➕ Criar Primeira Seção
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="sections-admin-page">
        <div className="page-header">
          <div>
            <h1>Gerenciamento de Seções</h1>
            <p className="subtitle">Organize seus produtos em categorias e seções personalizadas</p>
          </div>
          {!showAddForm && (
            <button className="add-button" onClick={handleAdd}>
              ➕ Criar Nova Seção
            </button>
          )}
        </div>

        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {showAddForm && (
          <div className="form-card">
            <h2>{editingSet ? 'Editar Seção' : 'Nova Seção'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome da Seção *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Queijos Artesanais"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button">
                  {editingSet ? '💾 Salvar Alterações' : '➕ Criar Seção'}
                </button>
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {sets.length > 0 && !showAddForm && (
          <div className="sets-list">
            <div className="sets-grid">
              {sets.map((set) => (
                <div key={set.id} className="set-card">
                  <div className="set-header">
                    <h3>{set.name}</h3>
                    <div className="set-badge">
                      {set.is_active ? (
                        <span className="badge active">Ativa</span>
                      ) : (
                        <span className="badge inactive">Inativa</span>
                      )}
                    </div>
                  </div>
                  <div className="set-info">
                    <p><strong>Ordem:</strong> {set.display_order}</p>
                    <p><strong>Produtos:</strong> {setProductsCounts[set.id] ?? 0}</p>
                  </div>
                  <div className="set-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(set)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteWithProducts(set.id, set.name)}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
