
import React, { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

/**
 * Imagem com fallback:
 * - Respeita `alt` tal como for passado (incluindo `alt=""` para imagens decorativas).
 * - Não inventa textos alternativos.
 * - Adiciona lazy-loading e decoding assíncrono por omissão.
 *
 * Boas práticas:
 * - Se a imagem for decorativa, usar `alt=""` e, quando apropriado, `aria-hidden="true"`.
 * - Se for informativa/funcional, escrever um `alt` descritivo e conciso.
 */
export function ImageWithFallback(
  props: React.ImgHTMLAttributes<HTMLImageElement>
) {
  const [didError, setDidError] = useState(false);

  // Melhorias de performance por defeito (podem ser sobrescritas via props)
  const {
    src,
    alt,
    className,
    style,
    loading = "lazy",
    decoding = "async",
    ...rest
  } = props;

  const handleError = () => setDidError(true);

  if (didError) {
    return (
      <img
        src={ERROR_IMG_SRC}
        alt={alt ?? ""}              // mantém a intenção do autor
        className={className}
        style={style}
        loading={loading}
        decoding={decoding}
        data-original-url={src}
        {...rest}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}                     // pode ser "", pode ser texto, pode nem vir (não forçamos)
      className={className}
      style={style}
      loading={loading}
      decoding={decoding}
      onError={handleError}
      {...rest}
    />
  );
}
