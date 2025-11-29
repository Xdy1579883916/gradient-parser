import type {
  AST,
  ColorNode,
  Gradient,
  LinearGradient,
  LinearOrientationNode,
  PercentageNode,
  PositionKeywordNode,
  PositionNode,
  RadialGradient,
  RadialOrientationNode,
} from './types'
import { parse } from './parser'

/**
 * 将颜色节点转为 SVG `<stop>` 可用的 `color` 与 `opacity`。
 * @param node 颜色节点（literal/hex/rgb/rgba/hsl/hsla/var）
 * @returns 包含 `color` 字符串及可选 `opacity`
 */
export function toColorAndOpacity(node: ColorNode): { color: string, opacity?: string } {
  if (node.type === 'literal') {
    return { color: node.value }
  }
  if (node.type === 'hex') {
    return { color: `#${node.value}` }
  }
  if (node.type === 'rgb') {
    return { color: `rgb(${node.value.join(', ')})` }
  }
  if (node.type === 'rgba') {
    const [r, g, b, a] = node.value
    return { color: `rgb(${r}, ${g}, ${b})`, opacity: a }
  }
  if (node.type === 'hsl') {
    return { color: `hsl(${node.value[0]}, ${node.value[1]}%, ${node.value[2]}%)` }
  }
  if (node.type === 'hsla') {
    const [h, s, l, a] = node.value
    return { color: `hsl(${h}, ${s}%, ${l}%)`, opacity: a }
  }
  if (node.type === 'var') {
    return { color: `var(${node.value})` }
  }
  return { color: '' }
}

/**
 * 根据颜色节点的长度信息计算 `<stop>` 的 `offset` 百分比。
 * 未指定时按等分分布；仅支持百分比长度。
 */
export function offsetFromLength(length: ColorNode['length'], index: number, total: number): string | undefined {
  if (!length) {
    if (total > 1) {
      const pct = (index / (total - 1)) * 100
      return `${pct}%`
    }
    return undefined
  }
  if (length.type === '%') {
    return `${length.value}%`
  }
  return undefined
}

/**
 * 将 `to top/right/...` 方向关键字转换为角度（deg）。
 * @param value 方向字符串，如 `top right`
 */
export function directionalToAngle(value: string): number | undefined {
  const v = value.toLowerCase()
  if (v === 'top') {
    return 0
  }
  if (v === 'top right' || v === 'right top') {
    return 45
  }
  if (v === 'right') {
    return 90
  }
  if (v === 'bottom right' || v === 'right bottom') {
    return 135
  }
  if (v === 'bottom') {
    return 180
  }
  if (v === 'bottom left' || v === 'left bottom') {
    return 225
  }
  if (v === 'left') {
    return 270
  }
  if (v === 'top left' || v === 'left top') {
    return 315
  }
  return undefined
}

/**
 * 依据角度计算线性渐变的起止坐标（相对百分比）。
 * @param angleDeg 角度（deg）
 */
export function angleToLineCoords(angleDeg: number): { x1: string, y1: string, x2: string, y2: string } {
  const rad = (angleDeg * Math.PI) / 180
  const dx = Math.sin(rad)
  const dy = -Math.cos(rad)
  const invDx = dx === 0 ? Number.POSITIVE_INFINITY : 0.5 / Math.abs(dx)
  const invDy = dy === 0 ? Number.POSITIVE_INFINITY : 0.5 / Math.abs(dy)
  const t = Math.min(invDx, invDy)
  const cx = 0.5
  const cy = 0.5
  const x2n = cx + t * dx
  const y2n = cy + t * dy
  const x1n = cx - t * dx
  const y1n = cy - t * dy
  return {
    x1: `${Math.round(x1n * 100)}%`,
    y1: `${Math.round(y1n * 100)}%`,
    x2: `${Math.round(x2n * 100)}%`,
    y2: `${Math.round(y2n * 100)}%`,
  }
}

/**
 * 生成线性渐变的 `<linearGradient>` SVG 片段。
 * @param id 渐变定义的 id
 * @param gradient 线性渐变节点
 */
export function linearGradientTag(id: string, gradient: LinearGradient): string {
  let angle: number | undefined
  const orientation = gradient.orientation as LinearOrientationNode | undefined
  if (orientation && orientation.type === 'directional') {
    angle = directionalToAngle(orientation.value)
  }
  else if (orientation && orientation.type === 'angular') {
    angle = Number.parseFloat(orientation.value)
  }
  const coords = angleToLineCoords(typeof angle === 'number' ? angle : 180)
  const stops = gradient.colorStops.map((c, i, arr) => {
    const { color, opacity } = toColorAndOpacity(c)
    const offset = offsetFromLength(c.length, i, arr.length)
    const offsetAttr = offset ? ` offset="${offset}"` : ''
    const opacityAttr = opacity ? ` stop-opacity="${opacity}"` : ''
    return `<stop${offsetAttr} stop-color="${color}"${opacityAttr}/>`
  }).join('')
  return `<linearGradient id="${id}" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}">${stops}</linearGradient>`
}

/**
 * 将位置关键字（left/center/right/top/bottom）映射到百分比。
 * @param keyword 位置关键字
 * @param axis 轴向（x/y）
 */
export function keywordToPercent(keyword: string, axis: 'x' | 'y'): string | undefined {
  const k = keyword.toLowerCase()
  if (axis === 'x') {
    if (k === 'left') {
      return '0%'
    }
    if (k === 'center') {
      return '50%'
    }
    if (k === 'right') {
      return '100%'
    }
  }
  else {
    if (k === 'top') {
      return '0%'
    }
    if (k === 'center') {
      return '50%'
    }
    if (k === 'bottom') {
      return '100%'
    }
  }
  return undefined
}

/**
 * 从 PositionNode 计算径向渐变的 `cx`/`cy` 百分比。
 */
export function positionToCxCy(pos?: PositionNode): { cx?: string, cy?: string } {
  if (!pos) {
    return {}
  }
  const x = pos.value.x
  const y = pos.value.y
  let cx: string | undefined
  let cy: string | undefined
  if (x) {
    if ((x as PercentageNode).type === '%') {
      cx = `${(x as PercentageNode).value}%`
    }
    else if ((x as PositionKeywordNode).type === 'position-keyword') {
      cx = keywordToPercent((x as PositionKeywordNode).value, 'x')
    }
  }
  if (y) {
    if ((y as PercentageNode).type === '%') {
      cy = `${(y as PercentageNode).value}%`
    }
    else if ((y as PositionKeywordNode).type === 'position-keyword') {
      cy = keywordToPercent((y as PositionKeywordNode).value, 'y')
    }
  }
  return { cx, cy }
}

/**
 * 生成径向渐变的 `<radialGradient>` SVG 片段。
 * @param id 渐变定义的 id
 * @param gradient 径向渐变节点
 */
export function radialGradientTag(id: string, gradient: RadialGradient): string {
  let at: PositionNode | undefined
  let r: string | undefined
  const ori = gradient.orientation as RadialOrientationNode | RadialOrientationNode[] | undefined
  const first = Array.isArray(ori) ? ori[0] : ori
  if (first && first.type === 'shape') {
    const shape = first
    if (shape.at) {
      at = shape.at
    }
    if (shape.value === 'circle' && shape.style && (shape.style as PercentageNode).type === '%') {
      r = `${(shape.style as PercentageNode).value}%`
    }
  }
  else if (first && first.type === 'extent-keyword') {
    if (first.at) {
      at = first.at
    }
  }
  else if (first && first.type === 'default-radial') {
    if (first.at) {
      at = first.at
    }
  }
  const { cx, cy } = positionToCxCy(at)
  const attrs: string[] = [`id="${id}"`]
  attrs.push(`cx="${cx ?? '50%'}"`)
  attrs.push(`cy="${cy ?? '50%'}"`)
  attrs.push(`r="${r ?? '50%'}"`)
  const stops = gradient.colorStops.map((c, i, arr) => {
    const { color, opacity } = toColorAndOpacity(c)
    const offset = offsetFromLength(c.length, i, arr.length)
    const offsetAttr = offset ? ` offset="${offset}"` : ''
    const opacityAttr = opacity ? ` stop-opacity="${opacity}"` : ''
    return `<stop${offsetAttr} stop-color="${color}"${opacityAttr}/>`
  }).join('')
  return `<radialGradient ${attrs.join(' ')}>${stops}</radialGradient>`
}

/**
 * 将一段 CSS 渐变字符串转换为 SVG `<defs>` 中的渐变定义。
 * @param id 渐变定义的 id
 * @param css CSS 渐变字符串
 * @returns 对应的 `<linearGradient>` 或 `<radialGradient>` 片段
 */
export function cssGradientToSvgDefs(id: string, css: string): string {
  const ast: AST = parse(css)
  if (!ast.length) {
    return ''
  }
  const gradient: Gradient = ast[0]
  if (gradient.type === 'linear-gradient' || gradient.type === 'repeating-linear-gradient') {
    return linearGradientTag(id, gradient as LinearGradient)
  }
  if (gradient.type === 'radial-gradient' || gradient.type === 'repeating-radial-gradient') {
    return radialGradientTag(id, gradient as RadialGradient)
  }
  return ''
}
