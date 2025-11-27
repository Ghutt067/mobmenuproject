import { productImages } from '../data/products';

/**
 * Obtém a URL da imagem do produto
 * Se a imagem for uma URL (começa com http:// ou https://), usa diretamente
 * Caso contrário, tenta buscar no mapeamento local de imagens
 * 
 * @param image - URL da imagem ou chave do mapeamento local
 * @returns URL da imagem a ser usada
 */
export function getProductImage(image: string | undefined | null): string {
  if (!image) {
    return productImages.product1; // Fallback padrão
  }
  
  // Se for uma URL válida (http:// ou https://), usar diretamente
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
    return image;
  }
  
  // Caso contrário, tentar buscar no mapeamento local
  return productImages[image] || productImages.product1;
}

/**
 * Comprime uma imagem se ela tiver mais de 3MB
 * @param file - Arquivo de imagem a ser comprimido
 * @param maxSizeMB - Tamanho máximo em MB (padrão: 3MB)
 * @returns Promise com o arquivo comprimido (ou original se já estiver abaixo do limite)
 */
export async function compressImageIfNeeded(file: File, maxSizeMB: number = 3): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Converter MB para bytes
  
  // Se o arquivo já está abaixo do limite, retornar sem comprimir
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Erro ao ler arquivo'));
        return;
      }

      img.onload = () => {
        try {
          // Calcular dimensões mantendo proporção
          let width = img.width;
          let height = img.height;
          const maxDimension = 2048; // Limitar dimensão máxima para ajudar na compressão

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          // Tentar diferentes níveis de qualidade até chegar ao tamanho desejado
          let quality = 0.9;
          let compressedBlob: Blob | null = null;
          let attempts = 0;
          const maxAttempts = 10;

          const tryCompress = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Não foi possível criar contexto do canvas'));
              return;
            }

            // Desenhar imagem redimensionada
            ctx.drawImage(img, 0, 0, width, height);

            // Converter para blob com qualidade
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Erro ao comprimir imagem'));
                  return;
                }

                // Se o tamanho está OK ou já tentamos muitas vezes, usar este resultado
                if (blob.size <= maxSizeBytes || attempts >= maxAttempts) {
                  // Criar novo File com o blob comprimido
                  const compressedFile = new File(
                    [blob],
                    file.name,
                    {
                      type: file.type || 'image/jpeg',
                      lastModified: Date.now()
                    }
                  );
                  resolve(compressedFile);
                  return;
                }

                // Reduzir qualidade e tentar novamente
                attempts++;
                quality = Math.max(0.1, quality - 0.1);
                tryCompress();
              },
              file.type || 'image/jpeg',
              quality
            );
          };

          tryCompress();
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = e.target.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Comprime um Blob de imagem se ele tiver mais de 3MB
 * @param blob - Blob de imagem a ser comprimido
 * @param maxSizeMB - Tamanho máximo em MB (padrão: 3MB)
 * @returns Promise com o blob comprimido (ou original se já estiver abaixo do limite)
 */
export async function compressBlobIfNeeded(blob: Blob, maxSizeMB: number = 3): Promise<Blob> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Se o blob já está abaixo do limite, retornar sem comprimir
  if (blob.size <= maxSizeBytes) {
    return blob;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        // Calcular dimensões mantendo proporção
        let width = img.width;
        let height = img.height;
        const maxDimension = 2048;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        // Tentar diferentes níveis de qualidade
        let quality = 0.9;
        let attempts = 0;
        const maxAttempts = 10;

        const tryCompress = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (compressedBlob) => {
              if (!compressedBlob) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Erro ao comprimir imagem'));
                return;
              }

              if (compressedBlob.size <= maxSizeBytes || attempts >= maxAttempts) {
                URL.revokeObjectURL(objectUrl);
                resolve(compressedBlob);
                return;
              }

              attempts++;
              quality = Math.max(0.1, quality - 0.1);
              tryCompress();
            },
            blob.type || 'image/jpeg',
            quality
          );
        };

        tryCompress();
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = objectUrl;
  });
}

