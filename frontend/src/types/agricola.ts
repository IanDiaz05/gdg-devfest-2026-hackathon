export type EstadoSemaforo = 'OPTIMO' | 'NORMAL' | 'ALTO';

export interface ProductoResumen {
  id: string;
  nombre: string;
  categoria: 'FRUTAS' | 'VERDURAS' | 'ESPECIAS_GRANOS';
  unidad: string; // ej. "kg"
  iconoUrl: string;
  estadoMesActual: EstadoSemaforo;
  precioPromedioMes: number;
  variacionPorcentualAnual: number; // ej. -18.5 (más barato) o +32.0 (más caro)
}

export interface PuntoMensual {
  mesNumero: number; // 1 - 12
  mesNombre: string; // "Ene", "Feb", etc.
  precioPromedio: number;
  precioMinimo: number;
  precioMaximo: number;
  temperaturaPromedioZona?: number; // °C en estado productor
  precipitacionMmZona?: number;     // mm de lluvia en estado productor
  indiceCombustible?: number;       // Referencia diésel/gasolina
  notaEvento?: string;              // Ej. "Inicio de temporada de sequía"
}

export interface AnalisisProductoDetalle extends ProductoResumen {
  regionProductoraPrincipal: string; // ej. "Michoacán"
  mesesBaratos: string[];            // ej. ["Mayo", "Junio", "Julio"]
  mesesCaros: string[];              // ej. ["Diciembre", "Enero"]
  hallazgoPrincipal: string;         // Texto de Data Storytelling
  factoresClave: Array<{
    tipo: 'CLIMA' | 'TRANSPORTE' | 'ESTACIONALIDAD';
    etiqueta: string;
  }>;
  serieHistoricaMensual: PuntoMensual[];
  sustitutosRecomendados: Array<{
    productoId: string;
    nombre: string;
    razonSustitucion: string; // ej. "Ideal para salsas frescas y 40% más económico este mes"
    ahorroEstimadoPorcentaje: number;
  }>;
}
