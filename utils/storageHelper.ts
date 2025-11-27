import { supabase } from '../lib/supabase';

/**
 * Extrai o caminho do arquivo de uma URL pública do Supabase Storage
 * @param publicUrl - URL pública do Supabase Storage
 * @returns Caminho do arquivo (ex: "store-id/filename.png") ou null se não conseguir extrair
 */
export function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    const filePathIndex = pathParts.indexOf('store-assets');
    
    if (filePathIndex !== -1 && filePathIndex < pathParts.length - 1) {
      // Reconstruir o caminho do arquivo (store_id/filename)
      return pathParts.slice(filePathIndex + 1).join('/');
    }
    
    return null;
  } catch (error) {
    console.warn('Erro ao processar URL:', error);
    return null;
  }
}

/**
 * Deleta uma imagem do Supabase Storage
 * @param imageUrl - URL pública da imagem no Supabase Storage
 * @returns true se deletado com sucesso, false caso contrário
 */
export async function deleteImageFromStorage(imageUrl: string | null | undefined): Promise<boolean> {
  if (!imageUrl) return false;

  try {
    const filePath = extractFilePathFromUrl(imageUrl);
    
    if (!filePath) {
      console.warn('Não foi possível extrair o caminho do arquivo da URL:', imageUrl);
      return false;
    }

    const { error } = await supabase.storage
      .from('store-assets')
      .remove([filePath]);

    if (error) {
      console.warn('Erro ao deletar imagem do Storage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Erro ao deletar imagem do Storage:', error);
    return false;
  }
}

/**
 * Deleta múltiplas imagens do Supabase Storage
 * @param imageUrls - Array de URLs públicas das imagens
 * @returns Número de imagens deletadas com sucesso
 */
export async function deleteMultipleImagesFromStorage(imageUrls: (string | null | undefined)[]): Promise<number> {
  const filePaths: string[] = [];
  
  for (const imageUrl of imageUrls) {
    if (!imageUrl) continue;
    
    const filePath = extractFilePathFromUrl(imageUrl);
    if (filePath) {
      filePaths.push(filePath);
    }
  }

  if (filePaths.length === 0) return 0;

  try {
    const { error } = await supabase.storage
      .from('store-assets')
      .remove(filePaths);

    if (error) {
      console.warn('Erro ao deletar imagens do Storage:', error);
      return 0;
    }

    return filePaths.length;
  } catch (error) {
    console.warn('Erro ao deletar imagens do Storage:', error);
    return 0;
  }
}

