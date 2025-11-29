// Copyright (c) 2014 Rafael Caricio. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {
  AngularNode,
  AST,
  CalcNode,
  ColorNode,
  Coordinates,
  DefaultRadialNode,
  DirectionalNode,
  DistanceNode,
  EmNode,
  ExtentKeywordNode,
  Gradient,
  LinearGradient,
  LinearOrientationNode,
  PositionKeywordNode,
  PositionNode,
  PxNode,
  RadialGradient,
  RadialOrientationNode,
  RepeatingLinearGradient,
  RepeatingRadialGradient,
  ShapeNode,
} from './types'

/**
 * 词法匹配规则集合：用于识别渐变类型、角度、颜色、长度等。
 * 这些正则在解析过程中被顺序扫描，用于拆分输入字符串。
 */
export const tokens = {
  linearGradient: /^(-(webkit|o|ms|moz)-)?(linear-gradient)/i,
  repeatingLinearGradient: /^(-(webkit|o|ms|moz)-)?(repeating-linear-gradient)/i,
  radialGradient: /^(-(webkit|o|ms|moz)-)?(radial-gradient)/i,
  repeatingRadialGradient: /^(-(webkit|o|ms|moz)-)?(repeating-radial-gradient)/i,
  sideOrCorner: /^to (left (top|bottom)|right (top|bottom)|top (left|right)|bottom (left|right)|left|right|top|bottom)/i,
  extentKeywords: /^(closest-side|closest-corner|farthest-side|farthest-corner|contain|cover)/,
  positionKeywords: /^(left|center|right|top|bottom)/i,
  pixelValue: /^(-?((\d*\.\d+)|(\d+\.?)))px/,
  percentageValue: /^(-?((\d*\.\d+)|(\d+\.?)))%/,
  emValue: /^(-?((\d*\.\d+)|(\d+\.?)))em/,
  angleValue: /^(-?((\d*\.\d+)|(\d+\.?)))deg/,
  radianValue: /^(-?((\d*\.\d+)|(\d+\.?)))rad/,
  startCall: /^\(/,
  endCall: /^\)/,
  comma: /^,/,
  hexColor: /^#([0-9a-f]+)/i,
  literalColor: /^([a-z]+)/i,
  rgbColor: /^rgb/i,
  rgbaColor: /^rgba/i,
  varColor: /^var/i,
  calcValue: /^calc/i,
  variableName: /^(--[a-z0-9-,\s#]+)/i,
  number: /^((\d*\.\d+)|(\d+\.?))/,
  hslColor: /^hsl/i,
  hslaColor: /^hsla/i,
}

/**
 * CSS 渐变解析器：按规范解析 `linear-gradient(...)`、`radial-gradient(...)` 等，
 * 生成简洁的 AST 结构，便于后续字符串化或 SVG 转换。
 */
export class GradientParser {
  input: string
  constructor(code: string) {
    this.input = code.toString().trim()
    if (this.input.endsWith(';'))
      this.input = this.input.slice(0, -1)
  }

  error(msg: string): never {
    const err = new Error(`${this.input}: ${msg}`)
    ;(err as any).source = this.input
    throw err
  }

  /**
   * 解析当前输入并返回 AST；若存在未消费的输入，抛出错误。
   */
  getAST(): AST {
    const ast = this.matchListDefinitions()
    if (this.input.length > 0)
      this.error('Invalid input not EOF')
    return ast
  }

  matchListDefinitions(): AST {
    return this.matchListing<Gradient>(() => this.matchDefinition())
  }

  matchDefinition(): Gradient | undefined {
    return this.matchGradient('linear-gradient', tokens.linearGradient, () => this.matchLinearOrientation())
      || this.matchGradient('repeating-linear-gradient', tokens.repeatingLinearGradient, () => this.matchLinearOrientation())
      || this.matchGradient('radial-gradient', tokens.radialGradient, () => this.matchListRadialOrientations())
      || this.matchGradient('repeating-radial-gradient', tokens.repeatingRadialGradient, () => this.matchListRadialOrientations())
  }

  matchGradient(type: 'linear-gradient', pattern: RegExp, orientationMatcher: () => LinearOrientationNode | undefined): LinearGradient | undefined
  matchGradient(type: 'repeating-linear-gradient', pattern: RegExp, orientationMatcher: () => LinearOrientationNode | undefined): RepeatingLinearGradient | undefined
  matchGradient(type: 'radial-gradient', pattern: RegExp, orientationMatcher: () => RadialOrientationNode | RadialOrientationNode[] | undefined): RadialGradient | undefined
  matchGradient(type: 'repeating-radial-gradient', pattern: RegExp, orientationMatcher: () => RadialOrientationNode | RadialOrientationNode[] | undefined): RepeatingRadialGradient | undefined
  matchGradient(type: Gradient['type'], pattern: RegExp, orientationMatcher: () => LinearOrientationNode | RadialOrientationNode | RadialOrientationNode[] | undefined): Gradient | undefined {
    return this.matchCall(pattern, () => {
      const orientation = orientationMatcher()
      if (orientation) {
        if (!this.scan(tokens.comma))
          this.error('Missing comma before color stops')
      }
      return { type, orientation, colorStops: this.matchListing(() => this.matchColorStop()) } as Gradient
    })
  }

  matchCall<T>(pattern: RegExp, callback: (captures: RegExpExecArray) => T): T | undefined {
    const captures = this.scan(pattern)
    if (captures) {
      if (!this.scan(tokens.startCall))
        this.error('Missing (')
      const result = callback(captures)
      if (!this.scan(tokens.endCall))
        this.error('Missing )')
      return result
    }
  }

  matchLinearOrientation(): LinearOrientationNode | undefined {
    const sideOrCorner = this.matchSideOrCorner()
    if (sideOrCorner)
      return sideOrCorner
    const legacyDirection = this.match('position-keyword', tokens.positionKeywords, 1)
    if (legacyDirection)
      return { type: 'directional', value: (legacyDirection as any).value }
    return this.matchAngle()
  }

  matchSideOrCorner(): DirectionalNode | undefined {
    const res = this.match('directional', tokens.sideOrCorner, 1)
    return res as unknown as DirectionalNode | undefined
  }

  matchAngle(): AngularNode | undefined {
    const res = this.match('angular', tokens.angleValue, 1) || this.match('angular', tokens.radianValue, 1)
    return res as unknown as AngularNode | undefined
  }

  matchListRadialOrientations(): RadialOrientationNode[] | undefined {
    let radialOrientations: RadialOrientationNode[] | undefined
    let radialOrientation = this.matchRadialOrientation()
    let lookaheadCache
    if (radialOrientation) {
      radialOrientations = []
      radialOrientations.push(radialOrientation)
      lookaheadCache = this.input
      if (this.scan(tokens.comma)) {
        radialOrientation = this.matchRadialOrientation()
        if (radialOrientation)
          radialOrientations.push(radialOrientation)
        else this.input = lookaheadCache
      }
    }
    return radialOrientations
  }

  matchRadialOrientation(): RadialOrientationNode | undefined {
    let radialType = (this.matchCircle() || this.matchEllipse()) as RadialOrientationNode | undefined
    if (radialType) {
      (radialType as any).at = this.matchAtPosition()
    }
    else {
      const extent = this.matchExtentKeyword()
      if (extent) {
        radialType = extent
        const positionAt = this.matchAtPosition()
        if (positionAt)
          (radialType as any).at = positionAt
      }
      else {
        const atPosition = this.matchAtPosition()
        if (atPosition) {
          radialType = { type: 'default-radial', at: atPosition } as DefaultRadialNode
        }
        else {
          const defaultPosition = this.matchPositioning()
          if (defaultPosition)
            radialType = { type: 'default-radial', at: defaultPosition } as DefaultRadialNode
        }
      }
    }
    return radialType
  }

  matchCircle(): ShapeNode | undefined {
    const circle = this.match('shape', /^(circle)/i, 0)
    if (circle)
      (circle as any).style = this.matchLength() || this.matchExtentKeyword()
    return circle as unknown as ShapeNode | undefined
  }

  matchEllipse(): ShapeNode | undefined {
    const ellipse = this.match('shape', /^(ellipse)/i, 0)
    if (ellipse)
      (ellipse as any).style = this.matchPositioning() || this.matchDistance() || this.matchExtentKeyword()
    return ellipse as unknown as ShapeNode | undefined
  }

  matchExtentKeyword(): ExtentKeywordNode | undefined {
    return this.match('extent-keyword', tokens.extentKeywords, 1) as unknown as ExtentKeywordNode | undefined
  }

  matchAtPosition(): PositionNode | undefined {
    if (this.match('position', /^at/, 0)) {
      const positioning = this.matchPositioning()
      if (!positioning)
        this.error('Missing positioning value')
      return positioning
    }
  }

  matchPositioning(): PositionNode | undefined {
    const location = this.matchCoordinates()
    if (location.x || location.y)
      return { type: 'position', value: location }
  }

  matchCoordinates(): Coordinates {
    return { x: this.matchDistance(), y: this.matchDistance() }
  }

  matchListing<T>(matcher: () => T | undefined): T[] {
    let captures = matcher()
    const result: T[] = []
    if (captures) {
      result.push(captures)
      while (this.scan(tokens.comma)) {
        captures = matcher()
        if (captures)
          result.push(captures)
        else this.error('One extra comma')
      }
    }
    return result
  }

  matchColorStop(): ColorNode {
    const color = this.matchColor()
    if (!color)
      this.error('Expected color definition')
    ;(color as any).length = this.matchDistance()
    return color as ColorNode
  }

  matchColor(): ColorNode | undefined {
    return this.matchHexColor() || this.matchHSLAColor() || this.matchHSLColor() || this.matchRGBAColor() || this.matchRGBColor() || this.matchVarColor() || this.matchLiteralColor()
  }

  matchLiteralColor(): ColorNode | undefined {
    return this.match('literal', tokens.literalColor, 0) as unknown as ColorNode | undefined
  }

  matchHexColor(): ColorNode | undefined {
    return this.match('hex', tokens.hexColor, 1) as unknown as ColorNode | undefined
  }

  matchRGBColor(): ColorNode | undefined {
    return this.matchCall(tokens.rgbColor, () => ({ type: 'rgb', value: this.matchListing(() => this.matchNumber()) })) as unknown as ColorNode | undefined
  }

  matchRGBAColor(): ColorNode | undefined {
    return this.matchCall(tokens.rgbaColor, () => ({ type: 'rgba', value: this.matchListing(() => this.matchNumber()) })) as unknown as ColorNode | undefined
  }

  matchVarColor(): ColorNode | undefined {
    return this.matchCall(tokens.varColor, () => ({ type: 'var', value: this.matchVariableName() })) as unknown as ColorNode | undefined
  }

  matchHSLColor(): ColorNode | undefined {
    return this.matchCall(tokens.hslColor, () => {
      const lookahead = this.scan(tokens.percentageValue)
      if (lookahead)
        this.error('HSL hue value must be a number in degrees (0-360) or normalized (-360 to 360), not a percentage')
      const hue = this.matchNumber()
      this.scan(tokens.comma)
      let captures = this.scan(tokens.percentageValue)
      const sat = captures ? captures[1] : null
      this.scan(tokens.comma)
      captures = this.scan(tokens.percentageValue)
      const light = captures ? captures[1] : null
      if (!sat || !light)
        this.error('Expected percentage value for saturation and lightness in HSL')
      return { type: 'hsl', value: [hue!, sat, light] }
    }) as unknown as ColorNode | undefined
  }

  matchHSLAColor(): ColorNode | undefined {
    return this.matchCall(tokens.hslaColor, () => {
      const hue = this.matchNumber()
      this.scan(tokens.comma)
      let captures = this.scan(tokens.percentageValue)
      const sat = captures ? captures[1] : null
      this.scan(tokens.comma)
      captures = this.scan(tokens.percentageValue)
      const light = captures ? captures[1] : null
      this.scan(tokens.comma)
      const alpha = this.matchNumber()
      if (!sat || !light)
        this.error('Expected percentage value for saturation and lightness in HSLA')
      return { type: 'hsla', value: [hue!, sat, light, alpha!] }
    }) as unknown as ColorNode | undefined
  }

  matchPercentage(): string | null {
    const captures = this.scan(tokens.percentageValue)
    return captures ? captures[1] : null
  }

  matchVariableName(): string | undefined {
    return this.scan(tokens.variableName)?.[1]
  }

  matchNumber(): string | undefined {
    return this.scan(tokens.number)?.[1]
  }

  matchDistance(): DistanceNode | undefined {
    return this.match('%', tokens.percentageValue, 1) || this.matchPositionKeyword() || this.matchCalc() || this.matchLength()
  }

  matchPositionKeyword(): PositionKeywordNode | undefined {
    return this.match('position-keyword', tokens.positionKeywords, 1) as unknown as PositionKeywordNode | undefined
  }

  matchCalc(): CalcNode | undefined {
    return this.matchCall(tokens.calcValue, () => {
      let openParenCount = 1
      let i = 0
      while (openParenCount > 0 && i < this.input.length) {
        const char = this.input[i]
        if (char === '(')
          openParenCount++
        else if (char === ')')
          openParenCount--
        i++
      }
      if (openParenCount > 0)
        this.error('Missing closing parenthesis in calc() expression')
      const calcContent = this.input.substring(0, i - 1)
      this.consume(i - 1)
      return { type: 'calc', value: calcContent }
    }) as unknown as CalcNode | undefined
  }

  matchLength(): PxNode | EmNode | undefined {
    return (this.match('px', tokens.pixelValue, 1) as unknown as PxNode | undefined)
      || (this.match('em', tokens.emValue, 1) as unknown as EmNode | undefined)
  }

  match<T extends string, V = string>(type: T, pattern: RegExp, captureIndex: number): { type: T, value: V } | undefined {
    const captures = this.scan(pattern)
    if (captures)
      return { type, value: captures[captureIndex] as unknown as V }
  }

  scan(regexp: RegExp): RegExpExecArray | null {
    const blankCaptures = /^\s+/.exec(this.input)
    if (blankCaptures)
      this.consume(blankCaptures[0].length)
    const captures = regexp.exec(this.input)
    if (captures)
      this.consume(captures[0].length)
    return captures
  }

  consume(size: number): void {
    this.input = this.input.slice(size)
  }
}

/**
 * 解析一段 CSS 渐变字符串为 AST。
 * @param code 输入的 CSS 渐变，如 `linear-gradient(#000, #fff)`
 * @returns AST 数组（支持多重渐变）
 */
export function parse(code: string): AST {
  return new GradientParser(code).getAST()
}
