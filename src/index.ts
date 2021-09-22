import {
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
  status as grpcStatus,
  UntypedServiceImplementation,
} from '@grpc/grpc-js'
import {
  IHealthServer,
  HealthClient,
  HealthService,
} from './generated/health_grpc_pb'
import { HealthCheckRequest, HealthCheckResponse } from './generated/health_pb'

export * as messages from './generated/health_pb'

export const Client = HealthClient
export const service = HealthService
export const ServingStatus = HealthCheckResponse.ServingStatus

class BaseService implements UntypedServiceImplementation {
  [name: string]: any
}

export type StatusValue =
  HealthCheckResponse.ServingStatusMap[keyof HealthCheckResponse.ServingStatusMap]
export type StatusMap = Record<string, StatusValue>

export class HealthImplementation extends BaseService implements IHealthServer {
  private isShutdown = false
  private _statusMap: StatusMap
  private watchClientsMap = new Map<
    string,
    Map<
      ServerWritableStream<HealthCheckRequest, HealthCheckResponse>,
      StatusValue
    >
  >()

  constructor(statusMap: StatusMap) {
    super()
    this._statusMap = {
      ...statusMap,
    }
  }

  setStatus(service: string, status: StatusValue) {
    if (this.isShutdown) {
      return
    }

    this._statusMap[service] = status
    this.dispatchNewStatus(service, status)
  }

  shutdown() {
    ;[...this.watchClientsMap.keys()].map((service) =>
      this.setStatus(service, HealthCheckResponse.ServingStatus.NOT_SERVING)
    )
    this.isShutdown = true
  }

  resume() {
    this.isShutdown = false
    ;[...this.watchClientsMap.keys()].map((service) =>
      this.setStatus(service, HealthCheckResponse.ServingStatus.SERVING)
    )
  }

  check(
    call: ServerUnaryCall<HealthCheckRequest, HealthCheckResponse>,
    callback: sendUnaryData<HealthCheckResponse>
  ) {
    const service = call.request.getService()
    const status = this._statusMap[service]
    if (status === undefined) {
      callback({ code: grpcStatus.NOT_FOUND })
    }
    callback(null, this.responseForStatus(status))
  }

  watch(call: ServerWritableStream<HealthCheckRequest, HealthCheckResponse>) {
    const service = call.request.getService()

    // lazy init map
    if (!this.watchClientsMap.has(service)) {
      this.watchClientsMap.set(service, new Map())
    }

    const serviceClientMap = this.watchClientsMap.get(service)
    const status =
      this._statusMap[service] ??
      HealthCheckResponse.ServingStatus.SERVICE_UNKNOWN
    call.write(this.responseForStatus(status), (err: Error) => {
      if (err) {
        serviceClientMap.delete(call)
      }
    })

    serviceClientMap.set(call, status)

    call.once('cancelled', () => {
      serviceClientMap.delete(call)
    })
  }

  private dispatchNewStatus(service: string, status: StatusValue) {
    if (!this.watchClientsMap.has(service)) {
      return
    }

    const serviceClientMap = this.watchClientsMap.get(service)

    for (const call of serviceClientMap.keys()) {
      const lastStatus = serviceClientMap.get(call)
      if (lastStatus === status) {
        continue
      }
      serviceClientMap.set(call, status)
      call.write(this.responseForStatus(status), (err: Error) => {
        if (err) {
          serviceClientMap.delete(call)
        }
      })
    }
  }

  private responseForStatus(status: StatusValue) {
    const resp = new HealthCheckResponse()
    resp.setStatus(status)
    return resp
  }
}

export const Implementation = HealthImplementation
