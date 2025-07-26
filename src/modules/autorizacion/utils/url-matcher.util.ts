/**
 * Utilidades para manejo de URLs y wildcards en el sistema de autorización
 */
export class UrlMatcherUtil {
  /**
   * Normaliza una URL reemplazando IDs numéricos por wildcards
   */
  static normalizarUrl(url: string): string {
    return url.replace(/\/\d+/g, '/*');
  }

  /**
   * Verifica si un patrón wildcard coincide con una URL
   */
  static coincideWildcard(patron: string, url: string): boolean {
    if (!patron.endsWith('/*')) {
      return patron === url;
    }

    const patronBase = patron.slice(0, -2);
    return url.startsWith(patronBase + '/') || url === patronBase;
  }

  /**
   * Genera variantes de URL para búsqueda de políticas
   */
  static generarVariantesUrl(url: string): string[] {
    const variantes: string[] = [];

    const urlNormalizada = this.normalizarUrl(url);
    variantes.push(urlNormalizada);

    const segmentos = url.split('/').filter(Boolean);

    for (let i = segmentos.length - 1; i >= 1; i--) {
      const wildcard = '/' + segmentos.slice(0, i).join('/') + '/*';
      if (!variantes.includes(wildcard)) {
        variantes.push(wildcard);
      }
    }

    if (!variantes.includes('/*')) {
      variantes.push('/*');
    }

    return variantes;
  }

  /**
   * Limpia y valida una URL de entrada
   */
  static limpiarUrl(url: string): string {
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    url = url.split('?')[0].split('#')[0];

    if (url.length > 1 && url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    return url;
  }
}
