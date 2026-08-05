import { createMindsClient } from '@animocabrands/minds-client-lib'
import type { MindsClient } from '@animocabrands/minds-client-lib'

let _client: MindsClient | null = null

export function getMindsClient(): MindsClient {
  if (!_client) {
    const key = process.env.MINDS_BUILDER_API_KEY
    if (!key) throw new Error('MINDS_BUILDER_API_KEY is not set')
    _client = createMindsClient({ builderApiKey: key })
  }
  return _client
}

export function getMindId(): string {
  const id = process.env.MINDS_MIND_ID
  if (!id) throw new Error('MINDS_MIND_ID is not set')
  return id
}
