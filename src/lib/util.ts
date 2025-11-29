export const GRADIENT_RE = /^\s*(?:-(?:webkit|o|ms|moz)-)?(?:linear|radial|repeating-linear|repeating-radial)-gradient\s*\(((?:\([^)]*\)|[^)(])*)\)\s*$/i

export function isGradientColor(input: any): RegExpExecArray | null {
  if (!input || typeof input !== 'string')
    return null
  return GRADIENT_RE.exec(input)
}
