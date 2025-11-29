# @dy-kit/gradient-parser

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

一个轻量的 CSS 渐变解析与字符串化工具，支持将 `linear-gradient(...)`、`radial-gradient(...)` 等解析为 AST、再序列化回 CSS，或转换为 SVG `<linearGradient>`/`<radialGradient>` 片段。

## 安装

```bash
pnpm add @dy-kit/gradient-parser
# 或
npm i @dy-kit/gradient-parser
yarn add @dy-kit/gradient-parser
```

## 快速开始

```ts
import { cssGradientToSvgDefs, isGradientColor, parse, stringify } from '@dy-kit/gradient-parser'

// 快速判断是否为受支持的渐变表达式（含可选厂商前缀）
isGradientColor('linear-gradient(red, blue)') // RegExpExecArray
isGradientColor('red') // null

// 解析为 AST 并回串
const ast = parse('linear-gradient(to right, #fff, transparent)')
const css = stringify(ast) // 'linear-gradient(to right, #fff, transparent)'

// 转换为 SVG defs 片段
const defs = cssGradientToSvgDefs('g1', 'linear-gradient(to right, red, blue)')
// <linearGradient id="g1" x1="0%" y1="50%" x2="100%" y2="50%">...</linearGradient>
```

## API

- `parse(css: string): AST`
  - 解析 CSS 渐变字符串为 AST 数组（支持多重渐变定义）
- `stringify(root?: AST | Gradient | null): string`
  - 将 AST 或单个渐变节点序列化为 CSS 字符串
- `cssGradientToSvgDefs(id: string, css: string): string`
  - 将单个渐变字符串转换为 SVG `<linearGradient>`/`<radialGradient>` 片段
- `isGradientColor(input: string): RegExpExecArray | null`
  - 基于正则的快速判断：是否为受支持的渐变表达式（含可选厂商前缀）
- `GradientParser`, `tokens`, `GRADIENT_RE`, `visitor`
  - 进阶：可用于自定义解析/字符串化流程或调试

类型与节点定义可参考 `src/lib/types.ts`。

## 支持的渐变类型

- `linear-gradient(...)`
- `radial-gradient(...)`
- `repeating-linear-gradient(...)`
- `repeating-radial-gradient(...)`

暂不支持 `conic-gradient(...)`。

## 示例

```ts
import { parse, stringify } from '@dy-kit/gradient-parser'

const input = 'radial-gradient(circle at center, red, blue)'
const ast = parse(input)
// ast[0].type === 'radial-gradient'

const output = stringify(ast)
// 'radial-gradient(circle at center, red, blue)'
```

```ts
import { cssGradientToSvgDefs } from '@dy-kit/gradient-parser'

const defs = cssGradientToSvgDefs('rg1', 'radial-gradient(circle at left top, red, blue)')
// <radialGradient id="rg1" cx="0%" cy="0%" r="50%">...</radialGradient>
```

## 运行与开发

```bash
pnpm run typecheck   # 类型检查
pnpm test            # 运行测试
pnpm run build       # 构建产物（ESM）
```

## License

[MIT](./LICENSE) License © 2024-PRESENT [XiaDeYu](https://github.com/Xdy1579883916)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@dy-kit/gradient-parser?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@dy-kit/gradient-parser
[npm-downloads-src]: https://img.shields.io/npm/dm/@dy-kit/gradient-parser?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@dy-kit/gradient-parser
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@dy-kit/gradient-parser?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@dy-kit/gradient-parser
[license-src]: https://img.shields.io/github/license/Xdy1579883916/gradient-parser.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/Xdy1579883916/gradient-parser/blob/mine/LICENSE
