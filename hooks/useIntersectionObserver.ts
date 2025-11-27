import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook para detectar quando um elemento entra na viewport
 * Otimizado para performance com cleanup adequado
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<T | null>, boolean] {
  const { threshold = 0.01, rootMargin = '100px', triggerOnce = true } = options;
  const elementRef = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Se já foi visto e triggerOnce é true, não precisa observar novamente
    if (isIntersecting && triggerOnce) return;

    // Cleanup do observer anterior se existir
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Verificar se IntersectionObserver está disponível
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: se não suportar, considera como visível
      setIsIntersecting(true);
      return;
    }

    // Criar observer apenas uma vez e reutilizar
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            if (triggerOnce && observerRef.current) {
              observerRef.current.disconnect();
              observerRef.current = null;
            }
          } else if (!triggerOnce) {
            setIsIntersecting(false);
          }
        },
        {
          threshold,
          rootMargin,
        }
      );
    }

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [threshold, rootMargin, triggerOnce, isIntersecting]);

  return [elementRef, isIntersecting];
}

