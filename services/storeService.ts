import { supabase } from '../lib/supabase';

export interface UpdateStoreData {
  address?: string;
  openingHours?: string;
  closingTime?: string;
  description?: string;
  paymentMethods?: string[];
}

/**
 * Atualiza informações da loja no banco de dados
 */
export async function updateStoreInfo(
  storeId: string,
  data: UpdateStoreData
): Promise<boolean> {
  try {
    console.log('🔄 [updateStoreInfo] Atualizando informações da loja:', {
      storeId,
      data,
    });

    // Verificar se temos sessão ativa
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('❌ [updateStoreInfo] Sessão não encontrada:', sessionError);
      throw new Error('Você precisa estar autenticado para atualizar informações da loja');
    }

    console.log('✅ [updateStoreInfo] Sessão ativa confirmada');

    // Preparar dados para atualização em snake_case
    const updateData: any = {};

    if (data.address !== undefined) {
      updateData.address = data.address || null;
    }

    if (data.openingHours !== undefined) {
      updateData.opening_hours = data.openingHours || null;
    }

    if (data.closingTime !== undefined) {
      updateData.closing_time = data.closingTime || null;
    }

    if (data.description !== undefined) {
      updateData.description = data.description || null;
    }

    if (data.paymentMethods !== undefined) {
      // Converter array para JSONB
      updateData.payment_methods = data.paymentMethods && data.paymentMethods.length > 0
        ? JSON.stringify(data.paymentMethods)
        : null;
    }

    console.log('📤 [updateStoreInfo] Dados para atualização:', updateData);

    // Atualizar no banco de dados
    const { error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', storeId);

    if (error) {
      console.error('❌ [updateStoreInfo] Erro ao atualizar loja:', error);
      console.error('❌ [updateStoreInfo] Código:', error.code);
      console.error('❌ [updateStoreInfo] Mensagem:', error.message);
      console.error('❌ [updateStoreInfo] Detalhes:', error.details);
      console.error('❌ [updateStoreInfo] Hint:', error.hint);

      // Verificar se é erro de RLS
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
        throw new Error('Erro de permissão. Verifique as políticas RLS da tabela stores no Supabase.');
      }

      throw new Error(error.message || 'Erro ao atualizar informações da loja');
    }

    console.log('✅ [updateStoreInfo] Informações da loja atualizadas com sucesso');
    return true;
  } catch (error: any) {
    console.error('❌ [updateStoreInfo] Exceção ao atualizar loja:', error);
    console.error('❌ [updateStoreInfo] Tipo:', error?.constructor?.name);
    console.error('❌ [updateStoreInfo] Mensagem:', error?.message);
    throw error;
  }
}

