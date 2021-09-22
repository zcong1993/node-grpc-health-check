import { setTimeout } from 'timers/promises'
import * as grpc from '@grpc/grpc-js'
import {
  StatusMap,
  HealthImplementation,
  service,
  ServingStatus,
  Client,
  messages,
} from '../src'

let server: grpc.Server

const address = '0.0.0.0:8080'

afterEach(async () => {
  if (server) {
    server.forceShutdown()
    await setTimeout(200)
  }
})

const setupServer = async (setup: (server: grpc.Server) => void) => {
  server = new grpc.Server()
  setup(server)
  return new Promise<void>((resolve) => {
    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), () => {
      server.start()
      resolve()
    })
  })
}

const createRequest = (service: string) => {
  const req = new messages.HealthCheckRequest()
  req.setService(service)
  return req
}

const promisifyCheck = (c: InstanceType<typeof Client>, service: string) => {
  const req = createRequest(service)
  return new Promise<messages.HealthCheckResponse>((resolve, reject) => {
    c.check(req, (err, resp) => {
      if (err) {
        reject(err)
      } else {
        resolve(resp)
      }
    })
  })
}

it('test check', async () => {
  const mp: StatusMap = {
    '': ServingStatus.NOT_SERVING,
    test1: ServingStatus.SERVING,
  }

  await setupServer((s) => s.addService(service, new HealthImplementation(mp)))

  const c = new Client(address, grpc.credentials.createInsecure())
  const resp = await promisifyCheck(c, '')
  expect(resp.getStatus()).toBe(ServingStatus.NOT_SERVING)
  expect((await promisifyCheck(c, 'test1')).getStatus()).toBe(
    ServingStatus.SERVING
  )

  // check not exists server
  await expect(() => promisifyCheck(c, 'notexists')).rejects.toThrow()

  c.close()
})

it('test shutdown resume', async () => {
  const mp: StatusMap = {
    '': ServingStatus.SERVING,
    test1: ServingStatus.SERVING,
  }

  const h = new HealthImplementation(mp)

  await setupServer((s) => s.addService(service, h))

  const c = new Client(address, grpc.credentials.createInsecure())

  h.shutdown()
  expect((await promisifyCheck(c, '')).getStatus()).toBe(
    ServingStatus.NOT_SERVING
  )
  expect((await promisifyCheck(c, 'test1')).getStatus()).toBe(
    ServingStatus.NOT_SERVING
  )

  // setStatus will not work when shutdown
  h.setStatus('', ServingStatus.SERVING)
  expect((await promisifyCheck(c, '')).getStatus()).toBe(
    ServingStatus.NOT_SERVING
  )

  h.resume()
  expect((await promisifyCheck(c, '')).getStatus()).toBe(ServingStatus.SERVING)
  expect((await promisifyCheck(c, 'test1')).getStatus()).toBe(
    ServingStatus.SERVING
  )

  h.setStatus('test1', ServingStatus.UNKNOWN)
  expect((await promisifyCheck(c, 'test1')).getStatus()).toBe(
    ServingStatus.UNKNOWN
  )

  c.close()
})

it('test watch', async () => {
  const mp: StatusMap = {
    '': ServingStatus.SERVING,
  }

  const h = new HealthImplementation(mp)

  await setupServer((s) => s.addService(service, h))

  const c = new Client(address, grpc.credentials.createInsecure())

  const createRecorder = () =>
    ({
      '': [],
      test1: [],
    } as Record<string, any[]>)

  const getLastStatus = (recorder: Record<string, any[]>, service: string) => {
    const arr = recorder[service]
    return arr[arr.length - 1]
  }

  const r1 = createRecorder()

  const req1 = createRequest('')
  const call1 = c.watch(req1)

  call1.on('error', () => {})

  call1.on('data', (resp: messages.HealthCheckResponse) => {
    r1[''].push(resp.getStatus())
  })

  // not exists on begin
  const call2 = c.watch(createRequest('test1'))
  call2.on('error', () => {})
  call2.on('data', (resp: messages.HealthCheckResponse) => {
    r1['test1'].push(resp.getStatus())
  })

  await setTimeout(100)

  expect(getLastStatus(r1, '')).toBe(ServingStatus.SERVING)
  expect(getLastStatus(r1, 'test1')).toBe(ServingStatus.SERVICE_UNKNOWN)

  // changed status
  h.setStatus('', ServingStatus.NOT_SERVING)
  await setTimeout(100)
  expect(getLastStatus(r1, '')).toBe(ServingStatus.NOT_SERVING)
  expect(r1[''].length).toBe(2)

  // add test1 status
  h.setStatus('test1', ServingStatus.SERVING)
  await setTimeout(100)
  expect(getLastStatus(r1, 'test1')).toBe(ServingStatus.SERVING)
  expect(r1['test1'].length).toBe(2)

  // set same status should not trigger event
  h.setStatus('', ServingStatus.NOT_SERVING)
  await setTimeout(100)
  expect(r1[''].length).toBe(2)

  c.close()
})
