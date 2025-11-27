import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../contexts/StoreContext';
import { useAuth } from '../../contexts/AuthContext';
import { createProduct, updateProduct, deleteProduct, clearProductsCache } from '../../services/productService';
import { deleteImageFromStorage } from '../../utils/storageHelper';
import AdminLayout from '../../components/admin/AdminLayout';
import addImageIcon from '../../icons/addimage.svg';
import trashIcon from '../../icons/trash-svgrepo-com.svg';
import './Products.css';

interface Set {
  id: string;
  name: string;
  display_order?: number;
}

interface Subset {
  id: string;
  name: string;
  set_id: string;
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const { store, loading: storeLoading, loadStoreByAdminUser } = useStore();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [subsets, setSubsets] = useState<Subset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingSetName, setEditingSetName] = useState<string>('');
  const [formData, setFormData] = useState({
    image: '',
    title: '',
    description1: '',
    description2: '',
    oldPrice: '',
    newPrice: '',
    fullDescription: '',
    setId: '',
    subsetId: '',
    displayOrder: 0,
    isActive: true,
  });
  const [message, setMessage] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showOldPrice, setShowOldPrice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs para drag to scroll
  const productsListRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isMouseDownRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const currentListIdRef = useRef<string | null>(null);

  // Aguardar AuthContext terminar de carregar
  useEffect(() => {
    if (authLoading) {
      console.log('⏳ [Products] Aguardando AuthContext terminar de carregar...');
      return;
    }

    // Se não há store mas há usuário autenticado, tentar carregar a loja
    if (!store && !storeLoading && user) {
      console.log('🔍 [Products] Store não carregado, mas usuário autenticado. Tentando carregar loja...');
      loadStoreByAdminUser(user.id);
      return;
    }

    // Se há store, carregar produtos
    if (store?.id) {
      console.log('✅ [Products] Store carregado, iniciando carregamento de produtos');
      loadProducts();
      loadSets();
    } else if (!storeLoading) {
      console.warn('⚠️ [Products] Store não disponível e não está carregando');
      setLoading(false);
    }
  }, [store?.id, storeLoading, user, authLoading, loadStoreByAdminUser]);

  useEffect(() => {
    if (formData.setId) {
      loadSubsets(formData.setId);
    } else {
      setSubsets([]);
    }
    
    // Atualizar displayOrder quando a seção mudar (apenas se não estiver editando)
    if (!editingProduct) {
      getNextDisplayOrder(formData.setId || undefined).then(nextOrder => {
        setFormData(prev => ({ ...prev, displayOrder: nextOrder }));
      });
    }
  }, [formData.setId, editingProduct]);

  // Auto-remover mensagem após 3 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadProducts = async () => {
    if (!store?.id) {
      console.warn('⚠️ [Products] Store ID não disponível ainda');
      setLoading(false);
      return;
    }

    console.log('🔍 [Products] Carregando produtos para loja:', store.id);
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ [Products] Erro na query:', error);
        console.error('❌ [Products] Código:', error.code);
        console.error('❌ [Products] Mensagem:', error.message);
        console.error('❌ [Products] Detalhes:', error.details);
        console.error('❌ [Products] Hint:', error.hint);
        
        // Verificar se é erro de tabela não encontrada
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setMessage('❌ Tabela de produtos não encontrada. Execute o script SQL para criar a tabela products no Supabase.');
        } else if (error.code === '42501' || error.message?.includes('permission denied')) {
          setMessage('❌ Erro de permissão. Verifique as políticas RLS da tabela products.');
        } else {
          setMessage(`❌ Erro ao carregar produtos: ${error.message}`);
        }
        setProducts([]);
        return;
      }

      console.log('✅ [Products] Produtos carregados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('🖼️ [Products] Primeiro produto - URL da imagem:', data[0].image);
      }
      setProducts(data || []);
      
      if (!data || data.length === 0) {
        console.log('ℹ️ [Products] Nenhum produto encontrado para esta loja');
      }
    } catch (error: any) {
      console.error('❌ [Products] Erro ao carregar produtos:', error);
      console.error('❌ [Products] Tipo:', error?.constructor?.name);
      setMessage(`❌ Erro ao carregar produtos: ${error.message || 'Erro desconhecido'}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSets = async () => {
    if (!store?.id) return;

    try {
      const { data, error } = await supabase
        .from('sets')
        .select('id, name, display_order')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setSets(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar seções:', error);
    }
  };

  const loadSubsets = async (setId: string) => {
    if (!store?.id) return;

    try {
      const { data, error } = await supabase
        .from('subsets')
        .select('id, name, set_id')
        .eq('store_id', store.id)
        .eq('set_id', setId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setSubsets(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar subseções:', error);
    }
  };

  // Função para formatar valor como moeda brasileira
  const formatPrice = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers, 10) / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Função para remover formatação e obter apenas números
  const unformatPrice = (value: string): string => {
    return value.replace(/\D/g, '');
  };

  // Handler para mudança de preço com formatação automática
  const handlePriceChange = (field: 'oldPrice' | 'newPrice', value: string) => {
    // Remove formatação anterior
    const unformatted = unformatPrice(value);
    
    // Formata o novo valor
    const formatted = formatPrice(unformatted);
    
    setFormData({ ...formData, [field]: formatted });
  };

  const getNextDisplayOrder = async (setId?: string): Promise<number> => {
    if (!store?.id) return 0;

    try {
      let query = supabase
        .from('products')
        .select('display_order')
        .eq('store_id', store.id)
        .eq('is_active', true);

      if (setId) {
        query = query.eq('set_id', setId);
      } else {
        query = query.is('set_id', null);
      }

      const { data, error } = await query.order('display_order', { ascending: false }).limit(1);

      if (error) {
        console.error('Erro ao buscar ordem de exibição:', error);
        return 0;
      }

      if (data && data.length > 0) {
        return (data[0].display_order || 0) + 1;
      }

      return 0;
    } catch (error) {
      console.error('Erro ao calcular ordem de exibição:', error);
      return 0;
    }
  };

  const handleAdd = async () => {
    setEditingProduct(null);
    setSelectedImageFile(null);
    setImagePreview(null);
    const nextOrder = await getNextDisplayOrder();
    setFormData({
      image: '',
      title: '',
      description1: '',
      description2: '',
      oldPrice: '',
      newPrice: '',
      fullDescription: '',
      setId: '',
      subsetId: '',
      displayOrder: nextOrder,
      isActive: true,
    });
    setShowAddForm(true);
    setMessage('');
  };

  const handleAddToSection = async (setId: string) => {
    setEditingProduct(null);
    setSelectedImageFile(null);
    setImagePreview(null);
    const nextOrder = await getNextDisplayOrder(setId);
    setFormData({
      image: '',
      title: '',
      description1: '',
      description2: '',
      oldPrice: '',
      newPrice: '',
      fullDescription: '',
      setId: setId,
      subsetId: '',
      displayOrder: nextOrder,
      isActive: true,
    });
    // Carregar subsets da seção selecionada
    await loadSubsets(setId);
    setShowAddForm(true);
    setMessage('');
  };

  const handleEdit = async (product: any) => {
    setEditingProduct(product);
    setSelectedImageFile(null);
    setImagePreview(product.image || null);
    
    // Usar fullDescription se existir, senão combinar description1 e description2
    let description = product.full_description || '';
    if (!description) {
      const combinedDescription = [
        product.description1 || '',
        product.description2 || ''
      ].filter(d => d.trim() !== '').join('\n');
      description = combinedDescription;
    }
    
    // Formatar preços ao carregar produto
    const formattedOldPrice = product.old_price ? formatPrice(unformatPrice(product.old_price)) : '';
    const formattedNewPrice = product.new_price ? formatPrice(unformatPrice(product.new_price)) : '';
    
    setFormData({
      image: product.image || '',
      title: product.title || '',
      description1: '', // Não usado mais, mas mantido para compatibilidade
      description2: '', // Não usado mais, mas mantido para compatibilidade
      oldPrice: formattedOldPrice,
      newPrice: formattedNewPrice,
      fullDescription: description,
      setId: product.set_id || '',
      subsetId: product.subset_id || '',
      displayOrder: product.display_order || 0,
      isActive: product.is_active ?? true,
    });


    setShowAddForm(true);
    setMessage('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const success = await deleteProduct(id);
      if (!success) throw new Error('Erro ao excluir produto');

      setMessage('✅ Produto excluído com sucesso!');
      clearProductsCache();
      loadProducts();
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      setMessage(`❌ Erro ao excluir produto: ${error.message}`);
    }
  };

  const handleSetNameDoubleClick = (set: Set) => {
    setEditingSetId(set.id);
    setEditingSetName(set.name);
  };

  const handleSetNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingSetName(e.target.value);
  };

  const handleSetNameSave = async (setId: string) => {
    if (!store?.id || !editingSetName.trim()) {
      setEditingSetId(null);
      return;
    }

    // Buscar o nome original da seção
    const originalSet = sets.find(set => set.id === setId);
    const newName = editingSetName.trim();
    
    // Se o nome não mudou, apenas cancelar a edição sem mostrar mensagem
    if (originalSet && originalSet.name === newName) {
      setEditingSetId(null);
      setEditingSetName('');
      return;
    }

    try {
      const { error } = await supabase
        .from('sets')
        .update({ name: newName })
        .eq('id', setId)
        .eq('store_id', store.id);

      if (error) throw error;

      // Atualizar localmente
      setSets(prev => prev.map(set => 
        set.id === setId ? { ...set, name: newName } : set
      ));

      setEditingSetId(null);
      setEditingSetName('');
      setMessage('✅ Nome da seção atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar nome da seção:', error);
      setMessage(`❌ Erro ao atualizar nome da seção: ${error.message}`);
      setEditingSetId(null);
    }
  };

  const handleSetNameCancel = () => {
    setEditingSetId(null);
    setEditingSetName('');
  };

  const handleSetNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, setId: string) => {
    if (e.key === 'Enter') {
      handleSetNameSave(setId);
    } else if (e.key === 'Escape') {
      handleSetNameCancel();
    }
  };

  const handleDeleteSection = async (setId: string, setName: string) => {
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
      
      // Limpar cache e recarregar
      clearProductsCache();
      await loadProducts();
      await loadSets();
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
      let imageUrl = formData.image;

      // Se uma nova imagem foi selecionada, fazer upload
      if (selectedImageFile) {
        setMessage('📤 Enviando imagem...');
        
        // Se estiver editando e havia uma imagem antiga, deletar do Storage
        if (editingProduct?.image && editingProduct.image !== imageUrl) {
          await deleteImageFromStorage(editingProduct.image);
        }
        
        imageUrl = await uploadImage(selectedImageFile);
        if (!imageUrl) {
          throw new Error('Erro ao fazer upload da imagem');
        }
      }

      // Validar se há imagem (nova ou existente)
      if (!imageUrl) {
        setMessage('❌ Por favor, selecione uma imagem para o produto');
        return;
      }

      let productId: string;

      if (editingProduct) {
        // Atualizar produto existente
        // Preparar dados para atualização
        const updateData: any = {
          id: editingProduct.id,
          image: imageUrl,
          title: formData.title,
          description1: '', // Limpar campos antigos
          description2: '', // Limpar campos antigos
          oldPrice: formData.oldPrice,
          newPrice: formData.newPrice,
          fullDescription: formData.fullDescription,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };

        // Só adicionar setId e subsetId se tiverem valores
        if (formData.setId && formData.setId.trim() !== '') {
          updateData.setId = formData.setId;
        } else {
          updateData.setId = undefined; // Permitir remover o setId
        }

        if (formData.subsetId && formData.subsetId.trim() !== '') {
          updateData.subsetId = formData.subsetId;
        } else {
          updateData.subsetId = undefined; // Permitir remover o subsetId
        }

        console.log('📝 [Products] Dados para atualização:', updateData);

        const updated = await updateProduct(updateData);

        if (!updated) {
          throw new Error('Erro ao atualizar produto: Nenhum dado retornado');
        }

        productId = updated.id;
        setMessage('✅ Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        console.log('📝 [Products] Tentando criar produto...');
        console.log('📝 [Products] Dados do formulário:', formData);
        console.log('📝 [Products] Store ID:', store.id);
        
        const created = await createProduct({
          image: imageUrl,
          title: formData.title,
          description1: '', // Não usado mais
          description2: '', // Não usado mais
          oldPrice: formData.oldPrice,
          newPrice: formData.newPrice,
          fullDescription: formData.fullDescription,
          setId: formData.setId || undefined,
          subsetId: formData.subsetId || undefined,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
          storeId: store.id, // Incluir storeId
        });

        if (!created) {
          console.error('❌ [Products] createProduct retornou null');
          throw new Error('Erro ao criar produto. Verifique o console para mais detalhes.');
        }

        productId = created.id;
        console.log('✅ [Products] Produto criado com sucesso:', created.id);
        setMessage('✅ Produto criado com sucesso!');
      }

      clearProductsCache();
      setShowAddForm(false);
      setEditingProduct(null);
      setSelectedImageFile(null);
      setImagePreview(null);
      await loadProducts();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      setMessage(`❌ Erro ao salvar produto: ${error.message}`);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!store?.id) {
      throw new Error('Store não disponível');
    }

    try {
      setUploadingImage(true);
      
      // Comprimir imagem se necessário (acima de 3MB)
      const { compressImageIfNeeded } = await import('../../utils/imageHelper');
      const compressedFile = await compressImageIfNeeded(file, 3);
      
      // Gerar nome único para o arquivo
      const fileExt = compressedFile.name.split('.').pop() || file.name.split('.').pop();
      const fileName = `${store.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Fazer upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('store-assets')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Erro ao fazer upload da imagem:', error);
        throw new Error(`Erro ao fazer upload: ${error.message}`);
      }

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      console.log('✅ Imagem enviada com sucesso:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setMessage('❌ Por favor, selecione um arquivo de imagem válido');
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('❌ A imagem deve ter no máximo 5MB');
        return;
      }

      setSelectedImageFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o clique abra o seletor de arquivo
    setSelectedImageFile(null);
    setImagePreview(null);
    // Se estiver editando e havia uma imagem, limpar também do formData
    if (editingProduct) {
      setFormData({ ...formData, image: '' });
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingProduct(null);
    setSelectedImageFile(null);
    setImagePreview(null);
    setFormData({
      image: '',
      title: '',
      description1: '',
      description2: '',
      oldPrice: '',
      newPrice: '',
      fullDescription: '',
      setId: '',
      subsetId: '',
      displayOrder: 0,
      isActive: true,
    });
    setMessage('');
  };

  if (loading || authLoading || storeLoading || !store) {
    return (
      <AdminLayout>
        <div className="loading">
          {authLoading ? (
            <>
              <div>Carregando informações do usuário...</div>
              <div style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                Aguardando autenticação
              </div>
            </>
          ) : !store ? (
            <>
              <div>Carregando informações da loja...</div>
              <div style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                {user ? 'Buscando loja do administrador...' : 'Aguardando dados da loja'}
              </div>
            </>
          ) : (
            <>
              <div>Carregando produtos...</div>
              <div style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                Buscando produtos da loja: {store.name}
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    );
  }

  // Só mostrar empty state se não houver seções E não houver produtos
  if (products.length === 0 && sets.length === 0 && !showAddForm) {
    return (
      <AdminLayout>
        <div className="products-admin-page">
          {message && (
            <div className={`message floating ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          <div className="empty-state">
            <h3>Nenhuma seção criada</h3>
            <p>Comece adicionando sua primeira seção ao cardápio</p>
            <button 
              className="add-button" 
              onClick={async () => {
                if (!store?.id) return;
                
                // Criar nova seção "Nova Seção"
                const nextOrder = sets.length > 0 
                  ? Math.max(...sets.map(s => s.display_order || 0)) + 1 
                  : 1;
                
                try {
                  const { data, error } = await supabase
                    .from('sets')
                    .insert({
                      name: 'Nova Seção',
                      display_order: nextOrder,
                      is_active: true,
                      store_id: store.id,
                    })
                    .select()
                    .single();

                  if (error) throw error;

                  setMessage('✅ Seção criada com sucesso!');
                  clearProductsCache();
                  await loadSets();
                  
                  // Entrar automaticamente no modo de edição após um pequeno delay
                  if (data && data.id) {
                    setTimeout(() => {
                      setEditingSetId(data.id);
                      setEditingSetName('Nova Seção');
                    }, 100);
                  }
                } catch (error: any) {
                  console.error('Erro ao criar seção:', error);
                  setMessage(`❌ Erro ao criar seção: ${error.message}`);
                }
              }}
            >
              Nova Seção
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="products-admin-page">
        <h1>Gerenciamento de Produtos</h1>
        <p className="subtitle">Adicione, edite e organize os produtos da sua loja</p>

        {message && (
          <div className={`message floating ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}


        {showAddForm && (
          <div className="form-container">
            <h2>{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</h2>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: '150px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <div 
                    className="image-upload-area"
                    onClick={handleImageClick}
                    style={{
                      width: '150px',
                      height: '150px',
                      border: imagePreview ? '2px solid #007bff' : '2px dashed #ddd',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: imagePreview ? 'transparent' : '#f9f9f9',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 53, 69, 0.9)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'}
                          title="Remover imagem"
                        >
                          <img
                            src={trashIcon}
                            alt="Excluir"
                            style={{
                              width: '20px',
                              height: '20px',
                              filter: 'brightness(0) invert(1)'
                            }}
                          />
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '10px', pointerEvents: 'none' }}>
                        <img
                          src={addImageIcon}
                          alt="Adicionar imagem"
                          style={{
                            width: '50px',
                            height: '50px',
                            opacity: 0.6,
                            marginBottom: '8px'
                          }}
                        />
                        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
                          Clique para adicionar imagem
                        </p>
                      </div>
                    )}
                  </div>
                  {uploadingImage && (
                    <div style={{ marginTop: '8px', color: '#666', fontSize: '12px', textAlign: 'center' }}>
                      ⏳ Enviando...
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nome do produto"
                      required
                    />
                  </div>

                  <div className="form-row" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, gap: '4px' }}>
                      <label>Preço</label>
                      <input
                        type="text"
                        value={formData.newPrice}
                        onChange={(e) => handlePriceChange('newPrice', e.target.value)}
                        placeholder="R$ 0,00"
                        required
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1, gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', height: '20px' }}>
                        <label style={{ margin: 0, flexShrink: 0, lineHeight: '20px' }}>Preço anterior</label>
                        <div className="toggle-container" style={{ margin: 0, justifyContent: 'flex-start', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            id="oldPriceToggle"
                            checked={showOldPrice}
                            onChange={(e) => setShowOldPrice(e.target.checked)}
                          />
                          <label htmlFor="oldPriceToggle" style={{ margin: 0, width: '24px', height: '14px', borderRadius: '14px' }}>
                            <span style={{ display: 'none' }}>Toggle</span>
                          </label>
                          <style>{`
                            #oldPriceToggle + label::after {
                              width: 10px !important;
                              height: 10px !important;
                              top: 2px !important;
                              left: 2px !important;
                              border-radius: 10px !important;
                            }
                            #oldPriceToggle:checked + label::after {
                              left: calc(100% - 12px) !important;
                              transform: translateX(0) !important;
                            }
                          `}</style>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={formData.oldPrice}
                        onChange={(e) => handlePriceChange('oldPrice', e.target.value)}
                        placeholder="R$ 0,00"
                        disabled={!showOldPrice}
                        style={{
                          backgroundColor: showOldPrice ? '#fff' : '#f5f5f5',
                          cursor: showOldPrice ? 'text' : 'not-allowed',
                          opacity: showOldPrice ? 1 : 0.6
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Descrição do Produto</label>
                <textarea
                  value={formData.fullDescription}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  placeholder="Digite a descrição completa do produto. Você pode usar parágrafos e quebras de linha."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '160px'
                  }}
                />
              </div>


              <div className="form-actions">
                <button type="submit" className="submit-button">
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {!showAddForm && (products.length > 0 || sets.length > 0) && (() => {
          // Agrupar produtos por seção
          const productsBySet = new Map<string, any[]>();
          const productsWithoutSet: any[] = [];
          
          products.forEach(product => {
            if (product.set_id) {
              if (!productsBySet.has(product.set_id)) {
                productsBySet.set(product.set_id, []);
              }
              productsBySet.get(product.set_id)!.push(product);
            } else {
              productsWithoutSet.push(product);
            }
          });

          // Criar array de seções ordenadas (mostrar todas as seções, mesmo sem produtos)
          const sectionsWithProducts = sets
            .map(set => ({
              set,
              products: productsBySet.get(set.id) || []
            }))
            .sort((a, b) => {
              // Ordenar por display_order da seção
              return (a.set.display_order || 0) - (b.set.display_order || 0);
            });

          return (
            <div className="products-by-section">
              {sectionsWithProducts.map(({ set, products: sectionProducts }) => (
                <div key={set.id} className="product-section-group">
                  <div className="section-header">
                    <div className="section-title-wrapper">
                      {editingSetId === set.id ? (
                        <input
                          type="text"
                          value={editingSetName}
                          onChange={handleSetNameChange}
                          onBlur={() => handleSetNameSave(set.id)}
                          onKeyDown={(e) => handleSetNameKeyDown(e, set.id)}
                          autoFocus
                          style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            border: '2px solid #007bff',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            width: '100%',
                            maxWidth: '400px'
                          }}
                        />
                      ) : (
                        <h2 
                          className="section-title"
                          onDoubleClick={() => handleSetNameDoubleClick(set)}
                          style={{ cursor: 'pointer' }}
                          title="Clique duas vezes para editar"
                        >
                          {set.name}
                        </h2>
                      )}
                      <p className="section-info">
                        Ordem: {set.display_order || 0} • Produtos: {sectionProducts.length}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="add-to-section-button"
                        onClick={() => handleAddToSection(set.id)}
                        title={`Adicionar produto à seção ${set.name}`}
                      >
                        ➕ Adicionar Produto
                      </button>
                      <button 
                        className="delete-section-button"
                        onClick={() => handleDeleteSection(set.id, set.name)}
                        title={`Excluir seção ${set.name}`}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px'
                        }}
                      >
                        <img
                          src={trashIcon}
                          alt="Excluir"
                          style={{
                            width: '20px',
                            height: '20px',
                            filter: 'brightness(0) invert(1)'
                          }}
                        />
                      </button>
                    </div>
                  </div>
                  <div 
                    className="products-list"
                    ref={(el) => {
                      if (el) {
                        productsListRefs.current.set(set.id, el);
                      } else {
                        productsListRefs.current.delete(set.id);
                      }
                    }}
                    onMouseDown={(e) => {
                      // Não iniciar drag se clicar diretamente em botão
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        return;
                      }
                      
                      const listEl = productsListRefs.current.get(set.id);
                      if (!listEl) return;
                      
                      isMouseDownRef.current = true;
                      dragStartXRef.current = e.clientX;
                      isDraggingRef.current = false;
                      startXRef.current = e.pageX - listEl.offsetLeft;
                      scrollLeftRef.current = listEl.scrollLeft;
                      currentListIdRef.current = set.id;
                    }}
                    onMouseLeave={() => {
                      const listEl = productsListRefs.current.get(currentListIdRef.current || '');
                      if (!listEl) return;
                      
                      isMouseDownRef.current = false;
                      isDraggingRef.current = false;
                      listEl.style.cursor = 'grab';
                      listEl.style.userSelect = 'auto';
                      currentListIdRef.current = null;
                    }}
                    onMouseUp={() => {
                      const listEl = productsListRefs.current.get(currentListIdRef.current || '');
                      if (!listEl) return;
                      
                      isMouseDownRef.current = false;
                      isDraggingRef.current = false;
                      listEl.style.cursor = 'grab';
                      listEl.style.userSelect = 'auto';
                      currentListIdRef.current = null;
                    }}
                    onMouseMove={(e) => {
                      const listEl = productsListRefs.current.get(currentListIdRef.current || '');
                      if (!listEl || !isMouseDownRef.current) return;
                      
                      // Só ativa drag se o mouse estiver pressionado E houver movimento significativo
                      if (!isDraggingRef.current) {
                        const moveDistance = Math.abs(e.clientX - dragStartXRef.current);
                        // Só ativa drag se moveu mais de 10px (threshold maior para evitar ativação acidental)
                        if (moveDistance > 10) {
                          isDraggingRef.current = true;
                          listEl.style.cursor = 'grabbing';
                          listEl.style.userSelect = 'none';
                        }
                      }
                      
                      // Só faz scroll se realmente estiver em modo drag
                      if (isDraggingRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        const x = e.pageX - listEl.offsetLeft;
                        const walk = (x - startXRef.current) * 2; // Velocidade do scroll
                        listEl.scrollLeft = scrollLeftRef.current - walk;
                      }
                    }}
                  >
                    {sectionProducts.length > 0 ? (
                      sectionProducts.map((product, index) => (
                        <div key={product.id} className="product-card">
                          <div className="product-number">{index + 1}</div>
                          <div className="product-image">
                            {product.image ? (
                              <img src={product.image} alt={product.title} />
                            ) : (
                              <div className="no-image">📷</div>
                            )}
                          </div>
                          <div className="product-info">
                            <h3>{product.title}</h3>
                            <div className="product-price">
                              {product.old_price && (
                                <span className="old-price">{product.old_price}</span>
                              )}
                              <span className="new-price">{product.new_price}</span>
                            </div>
                            <div className="product-meta">
                              <span className={`status ${product.is_active ? 'active' : 'inactive'}`}>
                                {product.is_active ? '✅ Ativo' : '❌ Inativo'}
                              </span>
                            </div>
                          </div>
                          <div className="product-actions">
                            <button onClick={() => handleEdit(product)} className="edit-button">
                              ✏️ Editar
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="delete-button">
                              🗑️ Excluir
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                        Nenhum produto nesta seção ainda
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Botão para criar nova seção */}
              <div className="product-section-group" style={{ marginTop: '30px', padding: '20px', textAlign: 'center', border: '2px dashed #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <button 
                  className="add-button"
                  onClick={async () => {
                    if (!store?.id) return;
                    
                    // Criar nova seção "Nova Seção"
                    const nextOrder = sets.length > 0 
                      ? Math.max(...sets.map(s => s.display_order || 0)) + 1 
                      : 1;
                    
                    try {
                      const { data, error } = await supabase
                        .from('sets')
                        .insert({
                          name: 'Nova Seção',
                          display_order: nextOrder,
                          is_active: true,
                          store_id: store.id,
                        })
                        .select()
                        .single();

                      if (error) throw error;

                      setMessage('✅ Seção criada com sucesso!');
                      clearProductsCache();
                      await loadSets();
                      
                      // Entrar automaticamente no modo de edição após um pequeno delay
                      if (data && data.id) {
                        setTimeout(() => {
                          setEditingSetId(data.id);
                          setEditingSetName('Nova Seção');
                        }, 100);
                      }
                    } catch (error: any) {
                      console.error('Erro ao criar seção:', error);
                      setMessage(`❌ Erro ao criar seção: ${error.message}`);
                    }
                  }}
                  style={{ 
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  ➕ Criar Nova Seção
                </button>
              </div>
              
              {/* Produtos sem seção */}
              {productsWithoutSet.length > 0 && (
                <div className="product-section-group">
                  <div className="section-header">
                    <div className="section-title-wrapper">
                      <h2 className="section-title">Sem Seção</h2>
                      <p className="section-info">
                        Produtos: {productsWithoutSet.length}
                      </p>
                    </div>
                    <button 
                      className="add-to-section-button"
                      onClick={handleAdd}
                      title="Adicionar produto sem seção"
                    >
                      ➕ Adicionar Produto
                    </button>
                  </div>
                  <div className="products-list">
                    {productsWithoutSet.map((product, index) => (
                      <div key={product.id} className="product-card">
                        <div className="product-number">{index + 1}</div>
                        <div className="product-image">
                          {product.image ? (
                            <img src={product.image} alt={product.title} />
                          ) : (
                            <div className="no-image">📷</div>
                          )}
                        </div>
                        <div className="product-info">
                          <h3>{product.title}</h3>
                          <div className="product-price">
                            {product.old_price && (
                              <span className="old-price">{product.old_price}</span>
                            )}
                            <span className="new-price">{product.new_price}</span>
                          </div>
                          <div className="product-meta">
                            <span className={`status ${product.is_active ? 'active' : 'inactive'}`}>
                              {product.is_active ? '✅ Ativo' : '❌ Inativo'}
                            </span>
                          </div>
                        </div>
                        <div className="product-actions">
                          <button onClick={() => handleEdit(product)} className="edit-button">
                            ✏️ Editar
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="delete-button">
                            🗑️ Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </AdminLayout>
  );
}
