import { supabase } from '../lib/supabase';

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
  // Verificar cache (se tiver storeId, incluir no cache)
  const cacheKey = storeId || 'default';
  const now = Date.now();
  if (productsCache && (now - productsCacheTime) < CACHE_DURATION) {
    return productsCache;
  }

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true);
  
  // Filtrar por loja se storeId for fornecido
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query.order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  const mappedProducts = (data || []).map((product) => {
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
      forceBuyButton: product.force_buy_button || false,
    };
  });

  // Atualizar cache
  productsCache = mappedProducts;
  productsCacheTime = now;

  return mappedProducts;
}

// Buscar produtos agrupados por conjuntos e subconjuntos
export async function getProductsGrouped(storeId?: string): Promise<Set[]> {
  // Verificar cache
  const now = Date.now();
  if (setsCache && (now - setsCacheTime) < CACHE_DURATION) {
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
    setsQuery = setsQuery.eq('store_id', storeId);
    subsetsQuery = subsetsQuery.eq('store_id', storeId);
    productsQuery = productsQuery.eq('store_id', storeId);
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
    console.error('Error fetching sets:', setsError);
    return [];
  }

  if (subsetsError) {
    console.error('Error fetching subsets:', subsetsError);
  }

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return [];
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
  const { oldPrice = '', newPrice, ...rest } = productData;
  
  // O has_discount será calculado automaticamente pela trigger
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...rest,
      old_price: oldPrice || '',
      new_price: newPrice,
      description1: productData.description1 || '',
      description2: productData.description2 || '',
      display_order: productData.displayOrder ?? 0,
      is_active: productData.isActive ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }

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
 * Atualiza um produto existente no banco de dados
 * O has_discount é calculado automaticamente pela trigger do banco
 */
export async function updateProduct(productData: UpdateProductData): Promise<Product | null> {
  const { id, oldPrice, newPrice, ...rest } = productData;
  
  const updateData: any = { ...rest };
  
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
  
  if (productData.displayOrder !== undefined) {
    updateData.display_order = productData.displayOrder;
  }
  
  if (productData.isActive !== undefined) {
    updateData.is_active = productData.isActive;
  }

  // O has_discount será calculado automaticamente pela trigger
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return null;
  }

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
 * Deleta um produto (soft delete - marca como inativo)
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }

  return true;
}

