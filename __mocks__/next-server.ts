export class NextRequest {
  url: string
  method: string
  private _init: any
  constructor(url: string, init?: any) {
    this.url = url
    this.method = init?.method || 'GET'
    this._init = init || {}
  }
  async json() {
    const body = this._init?.body
    if (!body) return {}
    if (typeof body === 'string') {
      try {
        return JSON.parse(body)
      } catch {
        return {}
      }
    }
    return body
  }
  async formData() {
    const body = this._init?.body
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      return body
    }
    throw new Error('formData not available')
  }
}

export class NextResponse {
  static json(body: any, init?: { status?: number }) {
    const status = init?.status ?? 200
    return {
      status,
      async json() { return body },
    } as any
  }
}
