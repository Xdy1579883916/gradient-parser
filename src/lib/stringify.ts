// Copyright (c) 2014 Rafael Caricio. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {
  AngularNode,
  AnyNode,
  AST,
  ColorNode,
  DefaultRadialNode,
  DirectionalNode,
  DistanceNode,
  ExtentKeywordNode,
  Gradient,
  LinearGradient,
  PositionKeywordNode,
  PositionNode,
  RadialGradient,
  RepeatingLinearGradient,
  RepeatingRadialGradient,
  ShapeNode,
} from './types'

export interface Visitor {
  'visit_linear-gradient': (node: LinearGradient) => string
  'visit_repeating-linear-gradient': (node: RepeatingLinearGradient) => string
  'visit_radial-gradient': (node: RadialGradient) => string
  'visit_repeating-radial-gradient': (node: RepeatingRadialGradient) => string
  'visit_gradient': (node: Gradient) => string
  'visit_shape': (node: ShapeNode) => string
  'visit_default-radial': (node: DefaultRadialNode) => string
  'visit_extent-keyword': (node: ExtentKeywordNode) => string
  'visit_position-keyword': (node: PositionKeywordNode) => string
  'visit_position': (node: PositionNode) => string
  'visit_%': (node: { type: '%', value: string }) => string
  'visit_em': (node: { type: 'em', value: string }) => string
  'visit_px': (node: { type: 'px', value: string }) => string
  'visit_calc': (node: { type: 'calc', value: string }) => string
  'visit_literal': (node: { type: 'literal', value: string, length?: DistanceNode }) => string
  'visit_hex': (node: { type: 'hex', value: string, length?: DistanceNode }) => string
  'visit_rgb': (node: { type: 'rgb', value: string[], length?: DistanceNode }) => string
  'visit_rgba': (node: { type: 'rgba', value: string[], length?: DistanceNode }) => string
  'visit_hsl': (node: { type: 'hsl', value: [string, string, string], length?: DistanceNode }) => string
  'visit_hsla': (node: { type: 'hsla', value: [string, string, string, string], length?: DistanceNode }) => string
  'visit_var': (node: { type: 'var', value: string, length?: DistanceNode }) => string
  'visit_color': (resultColor: string, node: ColorNode) => string
  'visit_angular': (node: AngularNode) => string
  'visit_directional': (node: DirectionalNode) => string
  'visit_array': (elements: AnyNode[]) => string
  'visit_object': (obj: { width?: AnyNode, height?: AnyNode }) => string
  'visit': (element: AnyNode | AnyNode[] | { width?: AnyNode, height?: AnyNode } | null | undefined) => string
}

/**
 * 默认字符串化访问器：将 AST 节点转为标准 CSS 渐变字符串。
 * 可替换或扩展以定制输出格式（例如缩写、兼容前缀等）。
 */
export const visitor: Visitor = {

  'visit_linear-gradient': (node: any) => visitor.visit_gradient(node),

  'visit_repeating-linear-gradient': (node: any) => visitor.visit_gradient(node),

  'visit_radial-gradient': (node: any) => visitor.visit_gradient(node),

  'visit_repeating-radial-gradient': (node: any) => visitor.visit_gradient(node),

  'visit_gradient': (node: any) => {
    let orientation = visitor.visit(node.orientation)
    if (orientation) {
      orientation += ', '
    }
    return `${node.type}(${orientation}${visitor.visit(node.colorStops)})`
  },

  'visit_shape': (node: any) => {
    let result = node.value
    const at = visitor.visit(node.at)
    const style = visitor.visit(node.style)
    if (style) {
      result += ` ${style}`
    }
    if (at) {
      result += ` at ${at}`
    }
    return result
  },

  'visit_default-radial': (node: any) => {
    let result = ''
    const at = visitor.visit(node.at)
    if (at) {
      result += at
    }
    return result
  },

  'visit_extent-keyword': (node: any) => {
    let result = node.value
    const at = visitor.visit(node.at)
    if (at) {
      result += ` at ${at}`
    }
    return result
  },

  'visit_position-keyword': node => node.value,

  'visit_position': node => `${visitor.visit(node.value.x)} ${visitor.visit(node.value.y)}`,

  'visit_%': node => `${node.value}%`,

  'visit_em': node => `${node.value}em`,

  'visit_px': node => `${node.value}px`,

  'visit_calc': node => `calc(${node.value})`,

  'visit_literal': (node: any) => visitor.visit_color(node.value, node),

  'visit_hex': (node: any) => visitor.visit_color(`#${node.value}`, node),

  'visit_rgb': (node: any) => visitor.visit_color(`rgb(${node.value.join(', ')})`, node),

  'visit_rgba': (node: any) => visitor.visit_color(`rgba(${node.value.join(', ')})`, node),

  'visit_hsl': (node: any) => visitor.visit_color(`hsl(${node.value[0]}, ${node.value[1]}%, ${node.value[2]}%)`, node),

  'visit_hsla': (node: any) => visitor.visit_color(`hsla(${node.value[0]}, ${node.value[1]}%, ${node.value[2]}%, ${node.value[3]})`, node),

  'visit_var': (node: any) => visitor.visit_color(`var(${node.value})`, node),

  'visit_color': (resultColor: string, node: any) => {
    let result = resultColor
    const length = visitor.visit(node.length)
    if (length) {
      result += ` ${length}`
    }
    return result
  },

  'visit_angular': (node: any) => `${node.value}deg`,

  'visit_directional': (node: any) => `to ${node.value}`,

  'visit_array': elements => elements.map(visitor.visit).join(', '),

  'visit_object': (obj: any) => (obj.width && obj.height) ? `${visitor.visit(obj.width)} ${visitor.visit(obj.height)}` : '',

  'visit': (element) => {
    if (!element) {
      return ''
    }
    if (Array.isArray(element)) {
      return visitor.visit_array(element)
    }
    if (typeof element === 'object' && element && 'type' in (element as any)) {
      const nodeVisitor = (visitor as unknown as Record<string, (node: any) => string>)[`visit_${(element as any).type}`]
      if (nodeVisitor) {
        return nodeVisitor(element as any)
      }
      throw new Error(`Missing visitor visit_${(element as any).type}`)
    }
    if (typeof element === 'object') {
      return visitor.visit_object(element as { width?: AnyNode, height?: AnyNode })
    }
    throw new Error('Invalid node.')
  },

}

/**
 * 将 AST 或单个渐变节点字符串化为 CSS。
 * @param root AST 数组或单个渐变节点
 * @returns CSS 字符串（为空或无节点时返回空字符串）
 */
export function stringify(root?: AST | Gradient | null): string {
  return visitor.visit(root)
}
