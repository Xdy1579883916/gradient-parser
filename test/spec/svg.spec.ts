// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest'
import * as gradients from '../../src'

describe('lib/svg defs', () => {
  it('should export cssGradientToSvgDefs', () => {
    expect(typeof gradients.cssGradientToSvgDefs).to.equal('function')
  })

  it('linear to right with two stops', () => {
    const svg = gradients.cssGradientToSvgDefs('g1', 'linear-gradient(to right, red, blue)')
    expect(svg).to.equal('<linearGradient id="g1" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stop-color="red"/><stop offset="100%" stop-color="blue"/></linearGradient>')
  })

  it('linear at 45deg', () => {
    const svg = gradients.cssGradientToSvgDefs('g45', 'linear-gradient(45deg, red, blue)')
    expect(svg).to.equal('<linearGradient id="g45" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="red"/><stop offset="100%" stop-color="blue"/></linearGradient>')
  })

  it('linear to bottom with rgba alpha', () => {
    const svg = gradients.cssGradientToSvgDefs('g2', 'linear-gradient(to bottom, rgba(255, 0, 0, 0.5), rgba(0, 0, 255, 0.8))')
    expect(svg).to.equal('<linearGradient id="g2" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="rgb(255, 0, 0)" stop-opacity="0.5"/><stop offset="100%" stop-color="rgb(0, 0, 255)" stop-opacity="0.8"/></linearGradient>')
  })

  it('radial circle at center', () => {
    const svg = gradients.cssGradientToSvgDefs('rg1', 'radial-gradient(circle at center, red, blue)')
    expect(svg).to.equal('<radialGradient id="rg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="red"/><stop offset="100%" stop-color="blue"/></radialGradient>')
  })

  it('radial circle at left top', () => {
    const svg = gradients.cssGradientToSvgDefs('rg2', 'radial-gradient(circle at left top, red, blue)')
    expect(svg).to.equal('<radialGradient id="rg2" cx="0%" cy="0%" r="50%"><stop offset="0%" stop-color="red"/><stop offset="100%" stop-color="blue"/></radialGradient>')
  })
})
