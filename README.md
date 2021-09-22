# node-grpc-health-check

[![NPM version](https://img.shields.io/npm/v/@zcong/node-grpc-health-check.svg?style=flat)](https://npmjs.com/package/@zcong/node-grpc-health-check)
[![NPM downloads](https://img.shields.io/npm/dm/@zcong/node-grpc-health-check.svg?style=flat)](https://npmjs.com/package/@zcong/node-grpc-health-check)
[![codecov](https://codecov.io/gh/zcong1993/node-grpc-health-check/branch/master/graph/badge.svg)](https://codecov.io/gh/zcong1993/node-grpc-health-check)
[![JS Test](https://github.com/zcong1993/node-grpc-health-check/actions/workflows/js-test.yml/badge.svg)](https://github.com/zcong1993/node-grpc-health-check/actions/workflows/js-test.yml)

> Health check client and service for use with [@grpc/grpc-js](https://github.com/grpc/grpc-node/tree/master/packages/grpc-js).

## Background

This package exports both a client and server that adhere to the [gRPC Health Checking Protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md).

### Why not [grpc-health-check](https://github.com/grpc/grpc-node/tree/master/packages/grpc-health-check)

- `grpc-health-check` is for deprecated native [grpc](https://github.com/grpc/grpc-node/tree/master/packages/grpc-native-core) package not for [@grpc/grpc-js](https://github.com/grpc/grpc-node/tree/master/packages/grpc-js)
- `grpc-health-check` implements an expired protocol of `gRPC Health Checking Protocol` not the latest version

## Features

- 100% Typescript
- implements the latest version of `gRPC Health Checking Protocol`
- API is similar to `grpc-health-check`
- support `shutdown` and `resume` method like `grpc-go`

## Install

```bash
$ yarn add @zcong/node-grpc-health-check
# or npm
$ npm i @zcong/node-grpc-health-check --save
```

## Usage

### Server

```ts
import { HealthImplementation, service, ServingStatus } from '../src'

const server = new grpc.Server()
const h = new HealthImplementation({
  '': ServingStatus.NOT_SERVING,
  test1: ServingStatus.SERVING,
})
server.addService(service, h)
```

### Client

Any gRPC-node client can use `@zcong/node-grpc-health-check` to run health checks against other servers that follow the protocol.

Full examples can be viewed at [./example](./example).

## License

MIT &copy; zcong1993
