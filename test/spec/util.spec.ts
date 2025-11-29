import { describe, expect, it } from 'vitest'
import { isGradientColor } from '../../src'

describe('lib/util', () => {
  it('should export isGradientColor', () => {
    expect(typeof isGradientColor).to.equal('function')
  })

  it('isGradientColor matches supported gradient types', () => {
    expect(isGradientColor('linear-gradient(red, blue)')).to.not.equal(null)
    expect(isGradientColor('-webkit-linear-gradient(red, blue)')).to.not.equal(null)
    expect(isGradientColor('radial-gradient(circle, red, rgba(1,2,3,0.5))')).to.not.equal(null)
  })

  it('isGradientColor rejects unsupported or non-gradient', () => {
    expect(isGradientColor('conic-gradient(red, blue)')).to.equal(null)
    expect(isGradientColor('linear-gradient(red, blue) extra')).to.equal(null)
    expect(isGradientColor('red')).to.equal(null)
  })
})
