import { env } from '@/env'  
import { app } from '@/app'

app.listen({
  host: '0.0.0.0',
  port: env.PORT
}).then(() => {
  console.log('HTTP server running on http://localhost:' + env.PORT)
}).catch((err) => {
  console.error('Failed to start the server:', err)
})