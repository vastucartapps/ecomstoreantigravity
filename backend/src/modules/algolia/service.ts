import { algoliasearch, SearchClient } from "algoliasearch"

type AlgoliaOptions = {
  apiKey: string
  appId: string
  productIndexName: string
}

export type AlgoliaIndexType = "product"

export default class AlgoliaModuleService {
  private client: SearchClient | null
  private options: AlgoliaOptions

  constructor({}: Record<string, never>, options: AlgoliaOptions) {
    if (!options.appId || !options.apiKey) {
      this.client = null
      this.options = options
      return
    }
    this.client = algoliasearch(options.appId, options.apiKey)
    this.options = options
  }

  private ensureClient(): SearchClient {
    if (!this.client) throw new Error("Algolia is not configured. Set ALGOLIA_APP_ID and ALGOLIA_API_KEY.")
    return this.client
  }

  async getIndexName(type: AlgoliaIndexType) {
    switch (type) {
      case "product":
        return this.options.productIndexName
      default:
        throw new Error(`Invalid index type: ${type}`)
    }
  }

  async indexData(data: Record<string, unknown>[], type: AlgoliaIndexType = "product") {
    const client = this.ensureClient()
    const indexName = await this.getIndexName(type)
    await client.saveObjects({
      indexName,
      objects: data.map((item) => ({
        ...item,
        objectID: item.id,
      })),
    })
  }

  async retrieveFromIndex(objectIDs: string[], type: AlgoliaIndexType = "product") {
    const client = this.ensureClient()
    const indexName = await this.getIndexName(type)
    return await client.getObjects<Record<string, unknown>>({
      requests: objectIDs.map((objectID) => ({
        indexName,
        objectID,
      })),
    })
  }

  async deleteFromIndex(objectIDs: string[], type: AlgoliaIndexType = "product") {
    const client = this.ensureClient()
    const indexName = await this.getIndexName(type)
    await client.deleteObjects({
      indexName,
      objectIDs,
    })
  }

  async search(query: string, type: AlgoliaIndexType = "product") {
    const client = this.ensureClient()
    const indexName = await this.getIndexName(type)
    return await client.search({
      requests: [
        {
          indexName,
          query,
        },
      ],
    })
  }
}
