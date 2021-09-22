import * as grpc from '@grpc/grpc-js'
import { Client, messages } from '../src'

const services = ['', 'test1', 'test2']

const main = async () => {
  const c = new Client('localhost:8080', grpc.credentials.createInsecure())
  setInterval(async () => {
    for (const s of services) {
      const req = new messages.HealthCheckRequest()
      req.setService(s)
      c.check(req, (err, resp) => {
        if (err) {
          console.log('error', s, err)
        } else {
          console.log('check', s, resp.toObject())
        }
      })
    }
  }, 5000)

  for (const s of services) {
    const req = new messages.HealthCheckRequest()
    req.setService(s)
    const call = c.watch(req)
    call.on('data', (resp: messages.HealthCheckResponse) => {
      console.log('watch', s, resp.toObject())
    })
  }
}

main()
