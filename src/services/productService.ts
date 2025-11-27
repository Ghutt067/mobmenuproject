import { supabase } from '../lib/supabase';
import { deleteImageFromStorage } from '../utils/storageHelper';
import type { ProductOptionGroup } from '../types/productOptions';

// Cache simples para produtos (evita múltiplas queries)
let productsCache: Product[] | null = null;
let productsCacheTime: number = 0;
let setsCache: Set[] | null = null;
let setsCacheTime: number = 0;
const CACHE_DURATION = 60000; // 1 minuto de cache

export interface Product {
  id: string;
  image: string;
  title: string;
  description1: string;
  description2: string;
  oldPrice: string;
  newPrice: string;
  hasDiscount: boolean;
  setId?: string;
  subsetId?: string;
  fullDescription?: string;
  forceBuyButton?: boolean; // Se true, sempre mostra botão COMPRAR mesmo no modo adicionar
  optionGroups?: ProductOptionGroup[]; // Grupos de opções do produto
}

/**
 * Calcula automaticamente se um produto tem desconto baseado nos preços
 * @param oldPrice - Preço anterior (pode ser vazio, null ou string vazia)
 * @param newPrice - Preço atual
 * @returns true se houver desconto válido, false caso contrário
 */
export function calculateHasDiscount(oldPrice: string | null | undefined, newPrice: string): boolean {
  // Se não houver preço anterior ou estiver vazio, não há desconto
  if (!oldPrice || oldPrice.trim() === '') {
    return false;
  }
  
  // Se os preços forem iguais, não há desconto
  if (oldPrice === newPrice) {
    return false;
  }
  
  // Remove formatação para comparar valores numéricos
  const normalizePrice = (price: string): number => {
    return parseFloat(
      price
        .replace(/R\$\s*/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim()
    ) || 0;
  };
  
  const oldPriceNum = normalizePrice(oldPrice);
  const newPriceNum = normalizePrice(newPrice);
  
  // Há desconto se o preço anterior for maior que o preço atual
  return oldPriceNum > newPriceNum && oldPriceNum > 0 && newPriceNum > 0;
}

export interface Set {
  id: string;
  name: string;
  displayOrder: number;
  subsets?: Subset[];
  products?: Product[];
}

export interface Subset {
  id: string;
  setId: string;
  name: string;
  displayOrder: number;
  products?: Product[];
}

// Buscar todos os produtos (mantendo compatibilidade com estrutura atual)
export async function getAllProducts(storeId?: string): Promise<Product[]> {
  console.log('🔍 [getAllProducts] Iniciando busca de produtos', { storeId });
  
  // Verificar cache (se tiver storeId, incluir no cache)
  const now = Date.now();
  if (productsCache && (now - productsCacheTime) < CACHE_DURATION) {
    console.log('✅ [getAllProducts] Retornando do cache', { count: productsCache.length });
    return productsCache;
  }

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true);
  
  // Filtrar por loja se storeId for fornecido
  if (storeId) {
    console.log('🏪 [getAllProducts] Filtrando por loja:', storeId);
    query = query.eq('store_id', storeId);
  } else {
    console.log('⚠️ [getAllProducts] Nenhum storeId fornecido - buscando todos os produtos ativos');
  }
  
  const { data, error } = await query.order('display_order', { ascending: true });

  if (error) {
    console.error('❌ [getAllProducts] Erro ao buscar produtos:', error);
    console.error('❌ [getAllProducts] Detalhes do erro:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return [];
  }

  console.log('✅ [getAllProducts] Produtos encontrados:', { count: data?.length || 0 });

  // Buscar opções para todos os produtos de uma vez (mais eficiente)
  const productIds = (data || []).map((p) => p.id);
  let optionGroupsMap = new Map<string, ProductOptionGroup[]>();
  
  console.log('🔍 [getAllProducts] Buscando opções para produtos:', { count: productIds.length });
  
  if (productIds.length > 0) {
    // Buscar todos os grupos de opções
    const { data: allGroups, error: groupsError } = await supabase
      .from('product_option_groups')
      .select('*')
      .in('product_id', productIds)
      .order('display_order', { ascending: true });

    if (groupsError) {
      console.error('❌ [getAllProducts] Erro ao buscar grupos de opções:', groupsError);
    } else {
      console.log('✅ [getAllProducts] Grupos de opções encontrados:', { count: allGroups?.length || 0 });
    }

    if (allGroups && allGroups.length > 0) {
      const groupIds = allGroups.map((g) => g.id);
      
      // Buscar todas as opções
      const { data: allOptions, error: optionsError } = await supabase
        .from('product_options')
        .select('*')
        .in('group_id', groupIds)
        .order('display_order', { ascending: true });

      if (optionsError) {
        console.error('❌ [getAllProducts] Erro ao buscar opções:', optionsError);
      } else {
        console.log('✅ [getAllProducts] Opções encontradas:', { count: allOptions?.length || 0 });
      }

      // Organizar opções por grupo
      const optionsByGroup = new Map<string, any[]>();
      (allOptions || []).forEach((opt) => {
        if (!optionsByGroup.has(opt.group_id)) {
          optionsByGroup.set(opt.group_id, []);
        }
        optionsByGroup.get(opt.group_id)!.push(opt);
      });

      // Organizar grupos por produto (apenas grupos com opções)
      allGroups.forEach((group) => {
        const groupOptions = (optionsByGroup.get(group.id) || []).map((opt) => ({
          id: opt.id,
          name: opt.name,
          additionalPrice: opt.additional_price || 0,
        }));

        // Apenas adicionar grupos que tenham pelo menos uma opção
        if (groupOptions.length > 0) {
          if (!optionGroupsMap.has(group.product_id)) {
            optionGroupsMap.set(group.product_id, []);
          }

          optionGroupsMap.get(group.product_id)!.push({
            id: group.id,
            title: group.title,
            instruction: group.instruction || 'Escolha 1 opção',
            type: group.type as 'single' | 'multiple',
            required: group.required || false,
            minSelections: group.min_selections || (group.type === 'single' ? 1 : 1),
            maxSelections: group.max_selections || (group.type === 'single' ? 1 : 3),
            options: groupOptions,
          });
        } else {
          console.warn(`⚠️ [getAllProducts] Grupo "${group.title}" (${group.id}) não tem opções, será ignorado`);
        }
      });

      console.log('📊 [getAllProducts] Opções organizadas por produto:', {
        produtosComOpcoes: Array.from(optionGroupsMap.keys()).length,
        totalGrupos: allGroups.length,
        gruposComOpcoes: Array.from(optionGroupsMap.values()).flat().length,
      });
    }
  }

  const mappedProducts = (data || []).map((product) => {
    const oldPrice = product.old_price || '';
    const newPrice = product.new_price;
    // Calcula automaticamente o desconto baseado nos preços
    const hasDiscount = calculateHasDiscount(oldPrice, newPrice);
    
    const productOptionGroups = optionGroupsMap.get(product.id) || [];
    
    if (productOptionGroups.length > 0) {
      console.log(`📦 [getAllProducts] Produto "${product.title}" tem ${productOptionGroups.length} grupo(s) de opções`);
    }
    
    return {
      id: product.id,
      image: product.image,
      title: product.title,
      description1: product.description1 || '',
      description2: product.description2 || '',
      oldPrice,
      newPrice,
      hasDiscount, // Usa o cálculo automático ao invés do valor do banco
      setId: product.set_id,
      subsetId: product.subset_id,
      fullDescription: product.full_description || '',
      forceBuyButton: product.force_buy_button || false,
      optionGroups: productOptionGroups,
    };
  });

  // Atualizar cache
  productsCache = mappedProducts;
  productsCacheTime = now;

  return mappedProducts;
}

// Buscar produtos agrupados por conjuntos e subconjuntos
export async function getProductsGrouped(storeId?: string, forceRefresh: boolean = false): Promise<Set[]> {
  console.log('🔍 [getProductsGrouped] Iniciando busca de produtos agrupados', { storeId, forceRefresh });
  
  // Verificar cache (a menos que forceRefresh seja true)
  const now = Date.now();
  if (!forceRefresh && setsCache && (now - setsCacheTime) < CACHE_DURATION) {
    console.log('✅ [getProductsGrouped] Retornando do cache', { count: setsCache.length });
    return setsCache;
  }

  // Criar queries base
  let setsQuery = supabase
    .from('sets')
    .select('*')
    .eq('is_active', true);
  
  let subsetsQuery = supabase
    .from('subsets')
    .select('*')
    .eq('is_active', true);
  
  let productsQuery = supabase
    .from('products')
    .select('*')
    .eq('is_active', true);
  
  // Filtrar por loja se storeId for fornecido
  if (storeId) {
    console.log('🏪 [getProductsGrouped] Filtrando por loja:', storeId);
    setsQuery = setsQuery.eq('store_id', storeId);
    subsetsQuery = subsetsQuery.eq('store_id', storeId);
    productsQuery = productsQuery.eq('store_id', storeId);
  } else {
    console.log('⚠️ [getProductsGrouped] Nenhum storeId fornecido - buscando todos os dados ativos');
  }

  // Buscar conjuntos, subconjuntos e produtos em paralelo para melhor performance
  const [setsResult, subsetsResult, productsResult] = await Promise.all([
    setsQuery.order('display_order', { ascending: true }),
    subsetsQuery.order('display_order', { ascending: true }),
    productsQuery.order('display_order', { ascending: true })
  ]);

  const { data: sets, error: setsError } = setsResult;
  const { data: subsets, error: subsetsError } = subsetsResult;
  const { data: products, error: productsError } = productsResult;

  if (setsError) {
    console.error('❌ [getProductsGrouped] Erro ao buscar sets:', setsError);
    console.error('❌ [getProductsGrouped] Detalhes do erro sets:', {
      message: setsError.message,
      code: setsError.code,
      details: setsError.details,
      hint: setsError.hint
    });
    return [];
  }

  if (subsetsError) {
    console.error('⚠️ [getProductsGrouped] Erro ao buscar subsets:', subsetsError);
  }

  if (productsError) {
    console.error('❌ [getProductsGrouped] Erro ao buscar products:', productsError);
    console.error('❌ [getProductsGrouped] Detalhes do erro products:', {
      message: productsError.message,
      code: productsError.code,
      details: productsError.details,
      hint: productsError.hint
    });
    return [];
  }

  console.log('✅ [getProductsGrouped] Dados encontrados:', {
    sets: sets?.length || 0,
    subsets: subsets?.length || 0,
    products: products?.length || 0
  });

  // Buscar opções para todos os produtos de uma vez (mais eficiente)
  const productIds = (products || []).map((p) => p.id);
  let optionGroupsMap = new Map<string, ProductOptionGroup[]>();
  
  if (productIds.length > 0) {
    // Buscar todos os grupos de opções
    const { data: allGroups } = await supabase
      .from('product_option_groups')
      .select('*')
      .in('product_id', productIds)
      .order('display_order', { ascending: true });

    if (allGroups && allGroups.length > 0) {
      const groupIds = allGroups.map((g) => g.id);
      
      // Buscar todas as opções
      const { data: allOptions } = await supabase
        .from('product_options')
        .select('*')
        .in('group_id', groupIds)
        .order('display_order', { ascending: true });

      // Organizar opções por grupo
      const optionsByGroup = new Map<string, any[]>();
      (allOptions || []).forEach((opt) => {
        if (!optionsByGroup.has(opt.group_id)) {
          optionsByGroup.set(opt.group_id, []);
        }
        optionsByGroup.get(opt.group_id)!.push(opt);
      });

      // Organizar grupos por produto (apenas grupos com opções)
      allGroups.forEach((group) => {
        const groupOptions = (optionsByGroup.get(group.id) || []).map((opt) => ({
          id: opt.id,
          name: opt.name,
          additionalPrice: opt.additional_price || 0,
        }));

        // Apenas adicionar grupos que tenham pelo menos uma opção
        if (groupOptions.length > 0) {
          if (!optionGroupsMap.has(group.product_id)) {
            optionGroupsMap.set(group.product_id, []);
          }

          optionGroupsMap.get(group.product_id)!.push({
            id: group.id,
            title: group.title,
            instruction: group.instruction || 'Escolha 1 opção',
            type: group.type as 'single' | 'multiple',
            required: group.required || false,
            minSelections: group.min_selections || (group.type === 'single' ? 1 : 1),
            maxSelections: group.max_selections || (group.type === 'single' ? 1 : 3),
            options: groupOptions,
          });
        } else {
          console.warn(`⚠️ [getProductsGrouped] Grupo "${group.title}" (${group.id}) não tem opções, será ignorado`);
        }
      });
    }
  }

  // Mapear produtos
  const mappedProducts: Product[] = (products || []).map((product) => {
    const oldPrice = product.old_price || '';
    const newPrice = product.new_price;
    // Calcula automaticamente o desconto baseado nos preços
    const hasDiscount = calculateHasDiscount(oldPrice, newPrice);
    
    return {
      id: product.id,
      image: product.image,
      title: product.title,
      description1: product.description1 || '',
      description2: product.description2 || '',
      oldPrice,
      newPrice,
      hasDiscount, // Usa o cálculo automático ao invés do valor do banco
      setId: product.set_id,
      subsetId: product.subset_id,
      fullDescription: product.full_description || '',
      optionGroups: optionGroupsMap.get(product.id) || [],
    };
  });

  // Organizar em estrutura hierárquica
  const setsMap = new Map<string, Set>();
  
  (sets || []).forEach((set) => {
    setsMap.set(set.id, {
      id: set.id,
      name: set.name,
      displayOrder: set.display_order,
      subsets: [],
      products: [],
    });
  });

  // Adicionar subconjuntos aos conjuntos
  (subsets || []).forEach((subset) => {
    const set = setsMap.get(subset.set_id);
    if (set) {
      set.subsets = set.subsets || [];
      set.subsets.push({
        id: subset.id,
        setId: subset.set_id,
        name: subset.name,
        displayOrder: subset.display_order,
        products: [],
      });
    }
  });

  // Adicionar produtos aos conjuntos ou subconjuntos
  mappedProducts.forEach((product) => {
    if (product.subsetId) {
      // Produto pertence a um subconjunto
      const set = setsMap.get(product.setId!);
      if (set && set.subsets) {
        const subset = set.subsets.find((s) => s.id === product.subsetId);
        if (subset) {
          subset.products = subset.products || [];
          subset.products.push(product);
        }
      }
    } else if (product.setId) {
      // Produto pertence diretamente a um conjunto
      const set = setsMap.get(product.setId);
      if (set) {
        set.products = set.products || [];
        set.products.push(product);
      }
    }
  });

  const result = Array.from(setsMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  
  // Atualizar cache
  setsCache = result;
  setsCacheTime = now;

  return result;
}

/**
 * Limpar cache (útil quando produtos são atualizados)
 */
export function clearProductsCache(): void {
  productsCache = null;
  productsCacheTime = 0;
  setsCache = null;
  setsCacheTime = 0;
}

/**
 * Interface para criar ou atualizar um produto
 */
export interface CreateProductData {
  image: string;
  title: string;
  description1?: string;
  description2?: string;
  oldPrice?: string; // Opcional - se não informado, não há desconto
  newPrice: string;
  fullDescription?: string;
  setId?: string;
  subsetId?: string;
  displayOrder?: number;
  isActive?: boolean;
  storeId: string; // OBRIGATÓRIO - ID da loja
}

/**
 * Interface para atualizar um produto
 */
export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

/**
 * Cria um novo produto no banco de dados
 * O has_discount é calculado automaticamente pela trigger do banco
 */
export async function createProduct(productData: CreateProductData): Promise<Product | null> {
  const { oldPrice = '', newPrice, storeId } = productData;
  
  if (!storeId) {
    console.error('❌ [createProduct] storeId é obrigatório!');
    return null;
  }
  
  console.log('🔍 [createProduct] Criando produto:', { title: productData.title, storeId });
  console.log('🔍 [createProduct] Dados completos:', {
    title: productData.title,
    image: productData.image,
    description1: productData.description1,
    description2: productData.description2,
    oldPrice,
    newPrice,
    storeId,
    displayOrder: productData.displayOrder,
    isActive: productData.isActive,
    setId: productData.setId,
    subsetId: productData.subsetId,
  });
  
  try {
    // Verificar se temos sessão ativa
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('❌ [createProduct] Sessão não encontrada:', sessionError);
      throw new Error('Você precisa estar autenticado para criar produtos');
    }
    
    console.log('✅ [createProduct] Sessão ativa confirmada');
    
    // Preparar dados para inserção
    const insertData: any = {
      store_id: storeId,
      title: productData.title,
      image: productData.image || null,
      description1: productData.description1 || '',
      description2: productData.description2 || '',
      old_price: oldPrice || '',
      new_price: newPrice,
      full_description: productData.fullDescription || null,
      display_order: productData.displayOrder ?? 0,
      is_active: productData.isActive ?? true,
      force_buy_button: (productData as any).forceBuyButton ?? false,
    };
    
    // Adicionar set_id e subset_id
    if (productData.setId) {
      insertData.set_id = productData.setId;
    } else {
      // Se não foi fornecido set_id, atribuir à seção padrão "OS MAIS PEDIDOS"
      const { data: defaultSet } = await supabase
        .from('sets')
        .select('id')
        .eq('store_id', storeId)
        .eq('name', 'OS MAIS PEDIDOS')
        .single();
      
      if (defaultSet) {
        insertData.set_id = defaultSet.id;
      }
    }
    if (productData.subsetId) {
      insertData.subset_id = productData.subsetId;
    }
    
    console.log('📤 [createProduct] Dados para inserção:', insertData);
    console.log('🖼️ [createProduct] URL da imagem:', insertData.image);
    
    // O has_discount será calculado automaticamente pela trigger
    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [createProduct] Erro ao criar produto:', error);
      console.error('❌ [createProduct] Código:', error.code);
      console.error('❌ [createProduct] Mensagem:', error.message);
      console.error('❌ [createProduct] Detalhes:', error.details);
      console.error('❌ [createProduct] Hint:', error.hint);
      
      // Verificar se é erro de RLS
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
        console.error('⚠️ [createProduct] Erro de RLS detectado - política pode estar bloqueando a inserção');
        throw new Error('Erro de permissão. Verifique as políticas RLS da tabela products no Supabase.');
      }
      
      // Verificar se é erro de tabela não encontrada
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error('⚠️ [createProduct] Tabela products não encontrada');
        throw new Error('Tabela de produtos não encontrada. Execute o script SQL para criar a tabela products.');
      }
      
      throw new Error(error.message || 'Erro ao criar produto');
    }
    
    if (!data) {
      console.error('❌ [createProduct] Nenhum dado retornado após inserção');
      throw new Error('Produto não foi criado. Nenhum dado retornado.');
    }
    
    console.log('✅ [createProduct] Produto criado com sucesso:', data.id);
    console.log('✅ [createProduct] Dados retornados:', data);
    console.log('🖼️ [createProduct] URL da imagem salva:', data.image);

    // Retorna o produto com hasDiscount calculado
    const oldPriceStr = data.old_price || '';
    const hasDiscount = calculateHasDiscount(oldPriceStr, data.new_price);

    return {
      id: data.id,
      image: data.image,
      title: data.title,
      description1: data.description1 || '',
      description2: data.description2 || '',
      oldPrice: oldPriceStr,
      newPrice: data.new_price,
      hasDiscount,
      setId: data.set_id,
      subsetId: data.subset_id,
      fullDescription: data.full_description || '',
      forceBuyButton: data.force_buy_button || false,
    };
  } catch (error: any) {
    console.error('❌ [createProduct] Exceção ao criar produto:', error);
    console.error('❌ [createProduct] Tipo:', error?.constructor?.name);
    console.error('❌ [createProduct] Mensagem:', error?.message);
    throw error; // Re-lançar para que o componente possa tratar
  }
}

/**
 * Atualiza um produto existente no banco de dados
 * O has_discount é calculado automaticamente pela trigger do banco
 */
export async function updateProduct(productData: UpdateProductData): Promise<Product | null> {
  const { id, oldPrice, newPrice, ...rest } = productData;
  
  console.log('🔄 [updateProduct] Iniciando atualização do produto:', id);
  console.log('🔄 [updateProduct] Dados recebidos:', productData);
  
  // Construir objeto de atualização apenas com campos válidos em snake_case
  const updateData: any = {};
  
  // Campos básicos
  if (productData.image !== undefined) {
    updateData.image = productData.image;
  }
  
  if (productData.title !== undefined) {
    updateData.title = productData.title;
  }
  
  if (oldPrice !== undefined) {
    updateData.old_price = oldPrice || '';
  }
  
  if (newPrice !== undefined) {
    updateData.new_price = newPrice;
  }
  
  if (productData.description1 !== undefined) {
    updateData.description1 = productData.description1 || '';
  }
  
  if (productData.description2 !== undefined) {
    updateData.description2 = productData.description2 || '';
  }
  
  if (productData.fullDescription !== undefined) {
    updateData.full_description = productData.fullDescription || null;
  }
  
  // Converter campos camelCase para snake_case
  if (productData.displayOrder !== undefined) {
    updateData.display_order = productData.displayOrder;
  }
  
  if (productData.isActive !== undefined) {
    updateData.is_active = productData.isActive;
  }

  // Converter setId e subsetId para snake_case
  if (productData.setId !== undefined) {
    updateData.set_id = productData.setId || null;
  }
  
  if (productData.subsetId !== undefined) {
    updateData.subset_id = productData.subsetId || null;
  }

  console.log('📤 [updateProduct] Dados para atualização:', updateData);

  // O has_discount será calculado automaticamente pela trigger
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ [updateProduct] Erro ao atualizar produto:', error);
    console.error('❌ [updateProduct] Código:', error.code);
    console.error('❌ [updateProduct] Mensagem:', error.message);
    console.error('❌ [updateProduct] Detalhes:', error.details);
    console.error('❌ [updateProduct] Hint:', error.hint);
    
    // Verificar se é erro de RLS
    if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
      throw new Error('Erro de permissão. Verifique as políticas RLS da tabela products no Supabase.');
    }
    
    // Verificar se é erro de tabela não encontrada
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      throw new Error('Tabela de produtos não encontrada. Execute o script SQL para criar a tabela products.');
    }
    
    throw new Error(error.message || 'Erro ao atualizar produto');
  }

  if (!data) {
    console.error('❌ [updateProduct] Nenhum dado retornado após atualização');
    throw new Error('Produto não foi atualizado. Nenhum dado retornado.');
  }

  console.log('✅ [updateProduct] Produto atualizado com sucesso:', data.id);

  // Retorna o produto com hasDiscount calculado
  const oldPriceStr = data.old_price || '';
  const hasDiscount = calculateHasDiscount(oldPriceStr, data.new_price);

  return {
    id: data.id,
    image: data.image,
    title: data.title,
    description1: data.description1 || '',
    description2: data.description2 || '',
    oldPrice: oldPriceStr,
    newPrice: data.new_price,
    hasDiscount,
    setId: data.set_id,
    subsetId: data.subset_id,
    fullDescription: data.full_description || '',
    forceBuyButton: data.force_buy_button || false,
  };
}

/**
 * Salva grupos de opções de um produto
 */
export async function saveProductOptionGroups(
  productId: string,
  optionGroups: ProductOptionGroup[]
): Promise<boolean> {
  try {
    console.log('💾 [saveProductOptionGroups] Iniciando salvamento de opções', {
      productId,
      groupsCount: optionGroups?.length || 0,
    });

    // Validar grupos antes de salvar
    if (optionGroups && optionGroups.length > 0) {
      for (let i = 0; i < optionGroups.length; i++) {
        const group = optionGroups[i];
        
        if (!group.title || group.title.trim() === '') {
          throw new Error(`Grupo ${i + 1}: Título é obrigatório`);
        }

        if (!group.type || (group.type !== 'single' && group.type !== 'multiple')) {
          throw new Error(`Grupo "${group.title}": Tipo inválido. Deve ser 'single' ou 'multiple'`);
        }

        if (group.options && group.options.length > 0) {
          for (let j = 0; j < group.options.length; j++) {
            const option = group.options[j];
            if (!option.name || option.name.trim() === '') {
              throw new Error(`Grupo "${group.title}", Opção ${j + 1}: Nome é obrigatório`);
            }
          }
        }
      }
    }

    // Primeiro, deletar grupos existentes e suas opções (cascade)
    const { error: deleteError } = await supabase
      .from('product_option_groups')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      console.error('❌ [saveProductOptionGroups] Erro ao deletar grupos existentes:', deleteError);
      throw new Error(`Erro ao limpar opções antigas: ${deleteError.message}`);
    }

    // Se não há grupos para salvar, retornar sucesso
    if (!optionGroups || optionGroups.length === 0) {
      console.log('✅ [saveProductOptionGroups] Nenhum grupo para salvar, retornando sucesso');
      return true;
    }

    // Inserir novos grupos e opções
    for (let i = 0; i < optionGroups.length; i++) {
      const group = optionGroups[i];
      
      console.log(`📝 [saveProductOptionGroups] Salvando grupo ${i + 1}: "${group.title}"`);
      
      // Inserir grupo
      const { data: groupData, error: groupError } = await supabase
        .from('product_option_groups')
        .insert({
          product_id: productId,
          title: group.title.trim(),
          instruction: group.instruction || (group.type === 'single' ? 'Escolha 1 opção' : 'Escolha 3 opções'),
          type: group.type,
          required: group.required !== undefined ? group.required : true,
          min_selections: group.minSelections || (group.type === 'single' ? 1 : 1),
          max_selections: group.maxSelections || (group.type === 'single' ? 1 : 3),
          display_order: i,
        })
        .select()
        .single();

      if (groupError) {
        console.error('❌ [saveProductOptionGroups] Erro ao salvar grupo:', groupError);
        console.error('❌ [saveProductOptionGroups] Detalhes:', {
          code: groupError.code,
          message: groupError.message,
          details: groupError.details,
          hint: groupError.hint,
        });
        throw new Error(`Erro ao salvar grupo "${group.title}": ${groupError.message}`);
      }

      if (!groupData) {
        throw new Error(`Erro ao criar grupo "${group.title}": Nenhum dado retornado`);
      }

      // Inserir opções do grupo
      if (group.options && group.options.length > 0) {
        const optionsToInsert = group.options
          .filter(opt => opt.name && opt.name.trim() !== '') // Filtrar opções vazias
          .map((option, optIndex) => ({
            group_id: groupData.id,
            name: option.name.trim(),
            additional_price: option.additionalPrice || 0,
            display_order: optIndex,
          }));

        if (optionsToInsert.length > 0) {
          const { error: optionsError } = await supabase
            .from('product_options')
            .insert(optionsToInsert);

          if (optionsError) {
            console.error('❌ [saveProductOptionGroups] Erro ao salvar opções:', optionsError);
            console.error('❌ [saveProductOptionGroups] Detalhes:', {
              code: optionsError.code,
              message: optionsError.message,
              details: optionsError.details,
              hint: optionsError.hint,
            });
            throw new Error(`Erro ao salvar opções do grupo "${group.title}": ${optionsError.message}`);
          }
        }
      }
    }

    console.log('✅ [saveProductOptionGroups] Opções salvas com sucesso');
    return true;
  } catch (error: any) {
    console.error('❌ [saveProductOptionGroups] Erro ao salvar grupos de opções:', error);
    // Re-lançar o erro para que o componente possa tratá-lo
    throw error;
  }
}

/**
 * Busca grupos de opções de um produto
 */
export async function getProductOptionGroups(productId: string): Promise<ProductOptionGroup[]> {
  try {
    // Buscar grupos
    const { data: groups, error: groupsError } = await supabase
      .from('product_option_groups')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (groupsError) {
      console.error('Erro ao buscar grupos de opções:', groupsError);
      return [];
    }

    if (!groups || groups.length === 0) {
      return [];
    }

    // Buscar opções de cada grupo
    const groupIds = groups.map((g) => g.id);
    const { data: options, error: optionsError } = await supabase
      .from('product_options')
      .select('*')
      .in('group_id', groupIds)
      .order('display_order', { ascending: true });

    if (optionsError) {
      console.error('Erro ao buscar opções:', optionsError);
      return [];
    }

    // Mapear para o formato ProductOptionGroup
    return groups.map((group) => {
      const groupOptions = (options || [])
        .filter((opt) => opt.group_id === group.id)
        .map((opt) => ({
          id: opt.id,
          name: opt.name,
          additionalPrice: opt.additional_price || 0,
        }));

      return {
        id: group.id,
        title: group.title,
        instruction: group.instruction || 'Escolha 1 opção',
        type: group.type as 'single' | 'multiple',
        required: group.required || false,
        minSelections: group.min_selections || (group.type === 'single' ? 1 : 1),
        maxSelections: group.max_selections || (group.type === 'single' ? 1 : 3),
        options: groupOptions,
      };
    });
  } catch (error) {
    console.error('Erro ao buscar grupos de opções:', error);
    return [];
  }
}

/**
 * Deleta um produto permanentemente do banco de dados
 * Também deleta a imagem do produto do Storage se existir
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  // Primeiro, buscar o produto para obter a URL da imagem
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('image')
    .eq('id', productId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching product:', fetchError);
    return false;
  }

  // Deletar a imagem do Storage se existir
  if (product?.image) {
    await deleteImageFromStorage(product.image);
  }

  // Deletar o produto do banco de dados
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }

  return true;
}

