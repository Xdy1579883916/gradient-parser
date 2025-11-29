export interface PercentageNode { type: '%', value: string }
export interface EmNode { type: 'em', value: string }
export interface PxNode { type: 'px', value: string }
export interface CalcNode { type: 'calc', value: string }
export interface PositionKeywordNode { type: 'position-keyword', value: string }

export type DistanceNode = PercentageNode | EmNode | PxNode | CalcNode | PositionKeywordNode

export interface Coordinates { x?: DistanceNode, y?: DistanceNode }
export interface PositionNode { type: 'position', value: Coordinates }

export interface AngularNode { type: 'angular', value: string }
export interface DirectionalNode { type: 'directional', value: string }

export interface LiteralColorNode { type: 'literal', value: string, length?: DistanceNode }
export interface HexColorNode { type: 'hex', value: string, length?: DistanceNode }
export interface RgbColorNode { type: 'rgb', value: string[], length?: DistanceNode }
export interface RgbaColorNode { type: 'rgba', value: string[], length?: DistanceNode }
export interface HslColorNode { type: 'hsl', value: [string, string, string], length?: DistanceNode }
export interface HslaColorNode { type: 'hsla', value: [string, string, string, string], length?: DistanceNode }
export interface VarColorNode { type: 'var', value: string, length?: DistanceNode }

export type ColorNode = LiteralColorNode | HexColorNode | RgbColorNode | RgbaColorNode | HslColorNode | HslaColorNode | VarColorNode

export interface ExtentKeywordNode { type: 'extent-keyword', value: string, at?: PositionNode }
export interface ShapeNode {
  type: 'shape'
  value: 'circle' | 'ellipse'
  style?: DistanceNode | PositionNode | ExtentKeywordNode
  at?: PositionNode
}
export interface DefaultRadialNode { type: 'default-radial', at?: PositionNode }

export type RadialOrientationNode = ShapeNode | ExtentKeywordNode | DefaultRadialNode
export type LinearOrientationNode = DirectionalNode | AngularNode | null

export interface LinearGradient {
  type: 'linear-gradient'
  orientation?: LinearOrientationNode
  colorStops: ColorNode[]
}
export interface RepeatingLinearGradient {
  type: 'repeating-linear-gradient'
  orientation?: LinearOrientationNode
  colorStops: ColorNode[]
}
export interface RadialGradient {
  type: 'radial-gradient'
  orientation?: RadialOrientationNode | RadialOrientationNode[]
  colorStops: ColorNode[]
}
export interface RepeatingRadialGradient {
  type: 'repeating-radial-gradient'
  orientation?: RadialOrientationNode | RadialOrientationNode[]
  colorStops: ColorNode[]
}

export type Gradient = LinearGradient | RepeatingLinearGradient | RadialGradient | RepeatingRadialGradient
export type AST = Gradient[]

export type AnyNode = Gradient | RadialOrientationNode | LinearOrientationNode | PositionNode | DistanceNode | ColorNode
