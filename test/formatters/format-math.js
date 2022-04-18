import assert from 'assert'
import MathFormatter from '../../src/formatters/FormatterMath.js'

describe('formatter math', () => {
  let format = (ast) => {
    let formatter = new MathFormatter(ast)
    return formatter.format()
  }

  it('format a general latex example', () => {
    const ast = {
      type: 'operator',
      operator: 'multiply',
      lhs: {
        type: 'operator',
        operator: 'plus',
        lhs: {
          type: 'number',
          value: 2,
        },
        rhs: {
          type: 'number',
          value: 3,
        },
      },
      rhs: {
        type: 'operator',
        operator: 'divide',
        lhs: {
          type: 'number',
          value: 5,
        },
        rhs: {
          type: 'number',
          value: 1,
        },
      },
    }

    assert.equal(format(ast), '(2+3)*5/1')
  })

  it('should format a minus bracket latex example', () => {
    const ast = {
      type: 'operator',
      operator: 'minus',
      isRightDistributive: true,
      lhs: {
        type: 'operator',
        operator: 'multiply',
        lhs: { type: 'number', value: 3 },
        rhs: {
          type: 'operator',
          operator: 'plus',
          lhs: { type: 'variable', value: 'x' },
          rhs: { type: 'variable', value: 'y' },
        },
      },
      rhs: {
        type: 'operator',
        operator: 'plus',
        lhs: {
          type: 'operator',
          operator: 'multiply',
          lhs: { type: 'number', value: 3 },
          rhs: { type: 'variable', value: 'x' },
        },
        rhs: {
          type: 'operator',
          operator: 'multiply',
          lhs: { type: 'number', value: 3 },
          rhs: { type: 'variable', value: 'y' },
        },
      },
    }

    assert.equal(format(ast), '3*(x+y)-(3*x+3*y)')
    // actual result is 3*(x+y)-3*x+3*y
  })

  it('should format a minus bracket with many children', () => {
    const ast = {
      type: 'uni-operator',
      operator: 'minus',
      isRightDistributive: true,
      value: {
        type: 'operator',
        operator: 'plus',
        lhs: { type: 'number', value: 3 },
        rhs: {
          type: 'operator',
          operator: 'minus',
          lhs: { type: 'number', value: 4 },
          rhs: {
            type: 'operator',
            operator: 'plus',
            lhs: { type: 'number', value: 4 },
            rhs: { type: 'number', value: 8 },
          },
        },
      },
    }

    assert.equal(format(ast), '-(3+4-4+8)')
  })

  // cases
  // - (1 + 2 - 4 + 2)

  it('should format a uni minus bracket latex example', () => {
    const ast = {
      type: 'uni-operator',
      operator: 'minus',
      isRightDistributive: true,
      value: {
        type: 'operator',
        operator: 'plus',
        lhs: {
          type: 'operator',
          operator: 'multiply',
          lhs: { type: 'number', value: 3 },
          rhs: { type: 'variable', value: 'x' },
        },
        rhs: {
          type: 'operator',
          operator: 'multiply',
          lhs: { type: 'number', value: 3 },
          rhs: { type: 'variable', value: 'y' },
        },
      },
    }

    assert.equal(format(ast), '-(3*x+3*y)')
    // actual result is --3*x+3*y
  })

  it('format division', () => {
    const ast = {
      type: 'operator',
      operator: 'divide',
      lhs: {
        type: 'number',
        value: 1,
      },
      rhs: {
        type: 'operator',
        operator: 'multiply',
        lhs: {
          type: 'number',
          value: 3,
        },
        rhs: {
          type: 'number',
          value: 4,
        },
      },
    }

    assert.equal(format(ast), '1/(3*4)')
  })

  describe('format parenthesis nesting', () => {
    const ast = {
      lhs: {
        type: 'number',
        value: 6,
      },
      operator: 'multiply',
      rhs: {
        lhs: {
          lhs: {
            type: 'number',
            value: 5,
          },
          operator: 'plus',
          rhs: {
            lhs: {
              type: 'number',
              value: 2,
            },
            operator: 'multiply',
            rhs: {
              type: 'number',
              value: 6,
            },
            type: 'operator',
          },
          type: 'operator',
        },
        operator: 'multiply',
        rhs: {
          type: 'number',
          value: 8,
        },
        type: 'operator',
      },
      type: 'operator',
    }

    assert.equal(format(ast), '6*(5+2*6)*8')
  })

  describe('exponents', () => {
    it('parse expression with exponents', () => {
      const ast = {
        type: 'operator',
        operator: 'minus',
        lhs: {
          type: 'operator',
          operator: 'exponent',
          lhs: {
            type: 'number',
            value: 3,
          },
          rhs: {
            type: 'operator',
            operator: 'plus',
            lhs: {
              type: 'number',
              value: 6,
            },
            rhs: {
              type: 'number',
              value: 4,
            },
          },
        },
        rhs: {
          type: 'operator',
          operator: 'exponent',
          lhs: {
            type: 'variable',
            value: 'var',
          },
          rhs: {
            type: 'number',
            value: 2,
          },
        },
      }

      assert.equal(format(ast), '3^(6+4)-var^2')
    })

    it('parse nested exponents', () => {
      const ast = {
        type: 'operator',
        operator: 'exponent',
        lhs: {
          type: 'number',
          value: 3,
        },
        rhs: {
          type: 'operator',
          operator: 'exponent',
          lhs: {
            type: 'number',
            value: 5,
          },
          rhs: {
            type: 'operator',
            operator: 'minus',
            lhs: {
              type: 'number',
              value: 22,
            },
            rhs: {
              type: 'number',
              value: 3,
            },
          },
        },
      }

      assert.equal(format(ast), '3^5^(22-3)')
    })

    it('format exponents of negative numbers with curley braces', () => {
      const ast = {
        type: 'operator',
        operator: 'exponent',
        lhs: {
          type: 'number',
          value: 3,
        },
        rhs: {
          type: 'number',
          value: -1,
        },
      }

      assert.equal(format(ast), '3^(-1)')
    })
  })

  it('should format latex with spaces correctly', () => {
    const parsedLatex = {
      type: 'operator',
      operator: 'multiply',
      lhs: {
        type: 'variable',
        value: 'var',
      },
      rhs: {
        type: 'variable',
        value: 'var',
      },
    }

    assert.equal(format(parsedLatex), 'var*var')
  })

  describe('functions', () => {
    it('should format sqrt function', () => {
      const parsedLatex = {
        type: 'function',
        value: 'sqrt',
        content: {
          type: 'number',
          value: 123,
        },
      }

      assert.equal(format(parsedLatex), 'sqrt(123)', 'sqrt example')
    })
  })

  describe('equations', () => {
    it('should format simple equation with variables and numbers', () => {
      const parsedLatex = {
        type: 'equation',
        lhs: {
          type: 'variable',
          value: 'y',
        },
        rhs: {
          type: 'operator',
          operator: 'plus',
          lhs: {
            type: 'operator',
            operator: 'multiply',
            lhs: {
              type: 'variable',
              value: 'a',
            },
            rhs: {
              type: 'variable',
              value: 'x',
            },
          },
          rhs: {
            type: 'operator',
            operator: 'multiply',
            lhs: {
              type: 'number',
              value: 2,
            },
            rhs: {
              type: 'variable',
              value: 'b',
            },
          },
        },
      }

      assert.equal(format(parsedLatex), 'y=a*x+2*b')
    })
  })

  describe('greek letters', () => {
    // doesn't play nice with algebrite
    it.skip('should format lower case', () => {
      const parsedLatex = {
        type: 'operator',
        operator: 'multiply',
        lhs: {
          type: 'variable',
          value: 'alpha',
        },
        rhs: {
          type: 'variable',
          value: 'beta',
        },
      }

      assert.equal(format(parsedLatex), 'α*β')
    })

    // doesn't play nice with algebrite
    it.skip('should format upper case', () => {
      const parsedLatex = {
        type: 'operator',
        operator: 'multiply',
        lhs: {
          type: 'variable',
          value: 'Alpha',
        },
        rhs: {
          type: 'variable',
          value: 'Delta',
        },
      }

      assert.equal(format(parsedLatex), 'Α*Δ')
    })
  })

  it('format variables with subscripts', () => {
    const parsedLatex = {
      type: 'operator',
      operator: 'minus',
      lhs: {
        type: 'subscript',
        base: {
          type: 'variable',
          value: 't',
        },
        subscript: {
          type: 'variable',
          value: 'last',
        },
      },
      rhs: {
        type: 'subscript',
        base: {
          type: 'variable',
          value: 't',
        },
        subscript: {
          type: 'subscript',
          base: {
            type: 'variable',
            value: 'first',
          },
          subscript: {
            type: 'variable',
            value: 'a',
          },
        },
      },
    }

    assert.equal(format(parsedLatex), 't_(last)-t_(first_a)')
  })
})
