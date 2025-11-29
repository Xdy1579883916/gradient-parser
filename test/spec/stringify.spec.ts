// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck

import type { AST } from '../../src'
import { beforeEach, describe, expect, it } from 'vitest'
import * as gradients from '../../src'

describe('lib/stringify', () => {
  let subject: string

  it('should exist', () => {
    expect(typeof gradients.stringify).to.equal('function')
  })

  describe('serialization', () => {
    it('should handle array input without error', () => {
      const nodes: AST = [{
        type: 'linear-gradient',
        colorStops: [{ type: 'literal', value: 'red' }, { type: 'literal', value: 'blue' }],
        orientation: null,
      }]

      expect(() => {
        const result = gradients.stringify(nodes)
        expect(result).to.equal('linear-gradient(red, blue)')
      }).not.toThrow()
    })

    it('if tree is null', () => {
      expect(gradients.stringify(null)).to.equal('')
    })

    it('should serialize a simple gradient', () => {
      const gradientDef = 'linear-gradient(black, white)'
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef)
    })

    it('should serialize gradient with hex', () => {
      const gradientDef = 'linear-gradient(#fff, white)'
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef)
    })

    it('should serialize gradient with var', () => {
      const gradientDef = 'linear-gradient(var(--color-black), white)'
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef)
    })

    it('should serialize gradient with rgb', () => {
      const gradientDef = 'linear-gradient(rgb(1, 2, 3), white)'
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef)
    })

    it('should serialize gradient with rgba', () => {
      const gradientDef = 'linear-gradient(rgba(1, 2, 3, .0), white)'
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef)
    })

    it('should serialize gradient with deg', () => {
      const gradientDef = 'linear-gradient(45deg, #fff, transparent)'
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef)
    })

    it('should serialize gradient with directional', () => {
      const gradientDef = 'linear-gradient(to left, #fff, transparent)'
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef)
    })

    describe('all metric values', () => {
      [
        'px',
        'em',
        '%',
      ].forEach((metric) => {
        let expectedResult: string

        describe(`stringify color stop for metric ${metric}`, () => {
          beforeEach(() => {
            expectedResult = `linear-gradient(blue 10.3${metric}, transparent)`
            const ast = gradients.parse(expectedResult)
            subject = gradients.stringify(ast)
          })

          it('should result as expected', () => {
            expect(subject).to.equal(expectedResult)
          })
        })
      })
    })

    describe('different radial declarations', () => {
      [
        'ellipse farthest-corner',
        'ellipse cover',
        'circle cover',
        'center bottom, ellipse cover',
        'circle at 87.23px -58.3px',
        'farthest-corner, red, blue',
        'farthest-corner at 87.23px -58.3px, red, blue',
      ].forEach((declaration) => {
        it(`should parse ${declaration} declaration`, () => {
          const expectedResult = `radial-gradient(${declaration}, red, blue)`
          const ast = gradients.parse(expectedResult)
          subject = gradients.stringify(ast)

          expect(subject).to.equal(expectedResult)
        })
      })
    })
  })
})
