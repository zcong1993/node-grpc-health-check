import * as grpc from '@grpc/grpc-js'
import { HealthImplementation, service, StatusValue, StatusMap } from '../src'

const randomStatus = () => {
  return Math.floor(Math.random() * 4) as StatusValue
}

const services = ['', 'test1', 'test2']

const randomService = () =>
  services[Math.floor(Math.random() * services.length)]

const main = async () => {
  const server = new grpc.Server()
  const map: StatusMap = {}
  services.forEach((s) => (map[s] = randomStatus()))

  const h = new HealthImplementation(map)

  server.addService(service, h)

  setInterval(() => {
    const s = randomService()
    const newStatus = randomStatus()
    console.log('trigger', s, newStatus)
    h.setStatus(s, newStatus)
  }, 1000)

  server.bindAsync(
    '0.0.0.0:8080',
    grpc.ServerCredentials.createInsecure(),
    () => {
      server.start()
    }
  )
}

main()
