import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function addTestProductScript({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("[add-test-product] Creating sample Vastu Sri Yantra Brass Idol test product...");

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
  });

  const salesChannelId = salesChannels[0]?.id;

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Vastu Sri Yantra Brass Idol (GMC Test Product)",
          handle: "vastu-sri-yantra-brass-idol-test",
          description: "Energized 24k Gold Plated Brass Sri Yantra Idol for Vastu harmony, wealth, and prosperity.",
          status: ProductStatus.PUBLISHED,
          sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
          options: [
            {
              title: "Size",
              values: ["Standard 4x4 Inch", "Large 6x6 Inch"],
            },
          ],
          variants: [
            {
              title: "Standard 4x4 Inch",
              sku: "VASTU-SRI-YANTRA-4X4",
              options: {
                Size: "Standard 4x4 Inch",
              },
              prices: [
                {
                  amount: 2100,
                  currency_code: "inr",
                },
                {
                  amount: 25,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "Large 6x6 Inch",
              sku: "VASTU-SRI-YANTRA-6X6",
              options: {
                Size: "Large 6x6 Inch",
              },
              prices: [
                {
                  amount: 4500,
                  currency_code: "inr",
                },
                {
                  amount: 55,
                  currency_code: "usd",
                },
              ],
            },
          ],
        },
      ],
    },
  });

  logger.info(`[add-test-product] Test product created successfully: ${products[0]?.id} (handle: ${products[0]?.handle})`);
}
