/**
 * Safe JSON-LD script emitter for Next.js App Router.
 *
 * Using `dangerouslySetInnerHTML` is the official Next.js pattern for
 * structured data (https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld).
 * We escape `</script>` sequences to prevent XSS via injected product data.
 */

export function JsonLd({ data, id }: { data: object; id?: string }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
