// GENERATED CODE -- DO NOT EDIT!

// package: grpc.health.v1
// file: health.proto

import * as health_pb from './health_pb'
import * as grpc from '@grpc/grpc-js'

interface IHealthService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  check: grpc.MethodDefinition<
    health_pb.HealthCheckRequest,
    health_pb.HealthCheckResponse
  >
  watch: grpc.MethodDefinition<
    health_pb.HealthCheckRequest,
    health_pb.HealthCheckResponse
  >
}

export const HealthService: IHealthService

export interface IHealthServer extends grpc.UntypedServiceImplementation {
  check: grpc.handleUnaryCall<
    health_pb.HealthCheckRequest,
    health_pb.HealthCheckResponse
  >
  watch: grpc.handleServerStreamingCall<
    health_pb.HealthCheckRequest,
    health_pb.HealthCheckResponse
  >
}

export class HealthClient extends grpc.Client {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: object
  )
  check(
    argument: health_pb.HealthCheckRequest,
    callback: grpc.requestCallback<health_pb.HealthCheckResponse>
  ): grpc.ClientUnaryCall
  check(
    argument: health_pb.HealthCheckRequest,
    metadataOrOptions: grpc.Metadata | grpc.CallOptions | null,
    callback: grpc.requestCallback<health_pb.HealthCheckResponse>
  ): grpc.ClientUnaryCall
  check(
    argument: health_pb.HealthCheckRequest,
    metadata: grpc.Metadata | null,
    options: grpc.CallOptions | null,
    callback: grpc.requestCallback<health_pb.HealthCheckResponse>
  ): grpc.ClientUnaryCall
  watch(
    argument: health_pb.HealthCheckRequest,
    metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null
  ): grpc.ClientReadableStream<health_pb.HealthCheckResponse>
  watch(
    argument: health_pb.HealthCheckRequest,
    metadata?: grpc.Metadata | null,
    options?: grpc.CallOptions | null
  ): grpc.ClientReadableStream<health_pb.HealthCheckResponse>
}
