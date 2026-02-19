import {
  PayloadCollectionItem,
  PayloadUpsertData,
  PayloadQueryOptions,
  PayloadItemResult,
  PayloadBulkResult,
  PayloadApiResponse,
  PayloadModuleOptions,
} from "./types"
import { MedusaError } from "@medusajs/framework/utils"
import qs from "qs"

export default class PayloadModuleService {
  private baseUrl: string
  private headers: Record<string, string>
  private defaultOptions: Record<string, any> = {
    is_from_medusa: true,
  }

  constructor(_container: Record<string, any>, options: PayloadModuleOptions) {
    if (!options.serverUrl || !options.apiKey) {
      this.baseUrl = ""
      this.headers = {}
      return
    }
    this.baseUrl = `${options.serverUrl}/api`
    this.headers = {
      "Content-Type": "application/json",
      Authorization: `${options.userCollection || "users"} API-Key ${options.apiKey}`,
    }
  }

  private async makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.headers, ...options.headers },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Payload API error: ${response.status} ${response.statusText}. ${errorData.message || ""}`
        )
      }
      return await response.json()
    } catch (error) {
      if (error instanceof MedusaError) throw error
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to communicate with Payload: ${JSON.stringify(error)}`
      )
    }
  }

  async create<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    data: PayloadUpsertData,
    options: PayloadQueryOptions = {}
  ): Promise<PayloadItemResult<T>> {
    const stringifiedQuery = qs.stringify({ ...options, ...this.defaultOptions }, { addQueryPrefix: true })
    return await this.makeRequest<PayloadItemResult<T>>(`/${collection}/${stringifiedQuery}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async update<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    data: PayloadUpsertData,
    options: PayloadQueryOptions = {}
  ): Promise<PayloadItemResult<T>> {
    const stringifiedQuery = qs.stringify({ ...options, ...this.defaultOptions }, { addQueryPrefix: true })
    return await this.makeRequest<PayloadItemResult<T>>(`/${collection}/${stringifiedQuery}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async delete(collection: string, options: PayloadQueryOptions = {}): Promise<PayloadApiResponse> {
    const stringifiedQuery = qs.stringify({ ...options, ...this.defaultOptions }, { addQueryPrefix: true })
    return await this.makeRequest<PayloadApiResponse>(`/${collection}/${stringifiedQuery}`, {
      method: "DELETE",
    })
  }

  async find(
    collection: string,
    options: PayloadQueryOptions = {}
  ): Promise<PayloadBulkResult<PayloadCollectionItem>> {
    const stringifiedQuery = qs.stringify({ ...options, ...this.defaultOptions }, { addQueryPrefix: true })
    return await this.makeRequest<PayloadBulkResult<PayloadCollectionItem>>(`/${collection}${stringifiedQuery}`)
  }

  async list(filter: { product_id: string | string[] }) {
    const ids = Array.isArray(filter.product_id) ? filter.product_id : [filter.product_id]
    const result = await this.find("products", {
      where: { medusa_id: { in: ids.join(",") } },
      depth: 2,
    })
    return result.docs.map((doc) => ({
      ...doc,
      product_id: doc.medusa_id,
    }))
  }
}
