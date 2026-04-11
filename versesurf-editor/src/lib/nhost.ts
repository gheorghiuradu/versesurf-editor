import { createClient } from '@nhost/nhost-js'

const nhost = createClient({
  subdomain: process.env.NHOST_SUBDOMAIN,
  region: process.env.NHOST_REGION,
})

export default nhost
