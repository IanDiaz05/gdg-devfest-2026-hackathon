export class ErrorApi extends Error {
  readonly recibidoEn = Date.now()

  constructor(
    message: string,
    readonly status: number,
    readonly codigo?: string,
    readonly reintentarEnS?: number,
  ) {
    super(message)
  }
}
