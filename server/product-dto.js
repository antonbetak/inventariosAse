export function productDto(product) {
  return {
    ...product,
    id: String(product.id),
    cantidad: Number(product.cantidad),
    stock_minimo: Number(product.stock_minimo),
    precioVenta: Number(product.precio_venta),
    creadoEn: product.creado_en ? new Date(product.creado_en).toISOString() : null,
    stock_pendiente: Boolean(product.stock_pendiente),
    descripcion: product.descripcion ?? '',
    insumos: product.insumos ?? [],
  };
}
