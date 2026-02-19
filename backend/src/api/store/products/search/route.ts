import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ALGOLIA_MODULE } from "../../../../modules/algolia"
import AlgoliaModuleService from "../../../../modules/algolia/service"
import { z } from "@medusajs/framework/zod"

export const SearchSchema = z.object({
  query: z.string(),
})

type SearchRequest = z.infer<typeof SearchSchema>

export async function POST(req: MedusaRequest<SearchRequest>, res: MedusaResponse) {
  const algoliaModuleService: AlgoliaModuleService = req.scope.resolve(ALGOLIA_MODULE)
  const { query } = req.validatedBody as SearchRequest
  const results = await algoliaModuleService.search(query)
  res.json(results)
}
