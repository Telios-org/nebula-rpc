# nebula-rpc

![Build Status](https://github.com/Telios-org/nebula-rpc/actions/workflows/node.js.yml/badge.svg)

RPC layer for Nebula 

```shell
npm install @telios/nebula-rpc
```

## Compile Schema
```shell
npm install -g hrpc
hrpc schema.proto --rpc=index.js --messages=rpc-messages.js
npm install --save hrpc-runtime # make sure to add this to your package.json
```

# License

MIT