import algebraJS from 'algebra.js'
import algebrite from 'algebrite'
import assert from 'assert'
import coffeequate from 'coffeequate'
// import util from 'util'
import AlgebraLatex from '../src/index'

// it.only(`Simple tester`, () => {
//   const input = '(-1)^2'
//   const expected = '(-1)^2'
//   const algebraExpression = new AlgebraLatex().parseLatex(input)
//   const mathExpression = algebraExpression.toMath()
//   try {
//     assert.equal(mathExpression, expected)
//   } catch (err) {
//     console.log(
//       util.inspect(algebraExpression.getAst(), {
//         showHidden: false,
//         depth: null,
//         colors: true,
//       })
//     )
//     throw err
//   }
// })

const cases = [
  {
    name: '1',
    input: '5 - (3 + 1)',
    expected: '5-(3+1)',
    ast: {
      type: 'operator',
      operator: 'minus',
      lhs: { type: 'number', value: 5 },
      rhs: {
        type: 'operator',
        operator: 'plus',
        lhs: { type: 'number', value: 3 },
        rhs: { type: 'number', value: 1 },
      },
    },
    expectedAST: {
      type: 'operator',
      operator: 'plus',
      lhs: { type: 'number', value: 5 },
      rhs: {
        type: 'uni-operator',
        operator: 'minus',
        value: {
          type: 'operator',
          operator: 'plus',
          lhs: { type: 'number', value: 3 },
          rhs: { type: 'number', value: 1 },
        },
      },
    },
    expectedAST2: {
      type: 'operator',
      operator: 'minus',
      lhs: { type: 'number', value: 5 },
      rhs: {
        type: 'operator',
        operator: 'multiply',
        lhs: { type: 'number', value: 1 },
        rhs: {
          type: 'operator',
          operator: 'plus',
          lhs: { type: 'number', value: 3 },
          rhs: { type: 'number', value: 1 },
        },
      },
    },
  },
  {
    name: '2',
    input: '5 - 3 + 1',
    expected: '5-3+1',
    ast: {
      type: 'operator',
      operator: 'minus',
      lhs: { type: 'number', value: 5 },
      rhs: {
        type: 'operator',
        operator: 'plus',
        lhs: { type: 'number', value: 3 },
        rhs: { type: 'number', value: 1 },
      },
    },
  },
  {
    name: '1',
    input: '- (3 + 1)',
    expected: '-(3+1)',
    ast: {
      type: 'uni-operator',
      operator: 'minus',
      value: {
        type: 'operator',
        operator: 'plus',
        lhs: { type: 'number', value: 3 },
        rhs: { type: 'number', value: 1 },
      },
    },
  },
  {
    name: '1',
    input: '- 3 + 1',
    expected: '-3+1',
    ast: {
      type: 'operator',
      operator: 'plus',
      lhs: { type: 'number', value: -3 },
      rhs: { type: 'number', value: 1 },
    },
  },
  {
    name: '1',
    input: '5 - 1(3 + 1)',
    expected: '5-(1*(3+1))',
    ast: {
      type: 'operator',
      operator: 'plus',
      lhs: { type: 'number', value: -3 },
      rhs: { type: 'number', value: 1 },
    },
  },
  {
    name: 'minus bracket expression',
    input: '3(x + y) - (3x + 3y)',
    expected: '3*(x+y)-(3*x+3*y)',
  },
  {
    name: 'uni minus bracket simple expression',
    input: '- (3x + 3y)',
    expected: '-(3*x+3*y)',
  },
  {
    name: 'uni minus multiply expression',
    input: '-3x',
    expected: '-3*x',
  },
  {
    name: 'uni minus multi element expression',
    input: '-(3 + 4 - 4 + 8)',
    expected: '-(3+4-4+8)',
  },
  {
    name: 'uni minus multi element expression 2',
    input: '-(3 + 4 - 4x + 8)',
    expected: '-(3+4-4*x+8)',
  },
  {
    name: 'subscript',
    input: 't_{last}-t_{first_a}',
    expected: 't_(last)-t_(first_a)',
  },
  {
    name: 'extra brackets',
    input: '(x+1)-((x+1))',
    expected: 'x+1-(x+1)',
  },
  {
    name: 'extra brackets 2',
    input: 'x^2+1-(x^2+1)',
    expected: 'x^2+1-(x^2+1)',
  },
  {
    name: 'weird expression',
    input: '(x-1)(-(-x+1))',
    expected: '(x-1)*(-(-x+1))',
  },
  {
    name: 'simple exponent',
    input: '(-1)^2',
    expected: '(-1)^2',
  },
]

describe('API tests', () => {
  cases.forEach((testCase) => {
    const { input, expected } = testCase
    it(`Parse: ${input}`, () => {
      const latex = input
      const algebraExpression = new AlgebraLatex().parseLatex(latex)
      const mathExpression = algebraExpression.toMath()
      try {
        assert.equal(mathExpression, expected)
      } catch (err) {
        // console.log(
        //   util.inspect(algebraExpression.getAst(), {
        //     showHidden: false,
        //     depth: null,
        //     colors: true,
        //   })
        // )
        throw err
      }
    })
  })

  const latexEquation = 'x+\\frac{2}{3}-4=8'
  const algebraEquation = new AlgebraLatex().parseLatex(latexEquation)

  const latexExpression = 'x\\cdot\\frac{3}{9}'
  const algebraExpression = new AlgebraLatex().parseLatex(latexExpression)

  const mathEquation = algebraEquation.toMath()
  const mathExpression = algebraExpression.toMath()

  it('should parse math equation', () => {
    assert.equal(mathEquation, 'x+2/3-4=8')
  })

  it('parse empty input', () => {
    assert.equal(new AlgebraLatex().parseLatex('').toMath(), '')
    assert.equal(new AlgebraLatex().parseMath('').toLatex(), '')
  })

  it('should parse math expression', () => {
    assert.equal(mathExpression, 'x*3/9')
  })

  it('format latex equation', () => {
    assert.equal(algebraEquation.toLatex(), 'x+\\frac{2}{3}-4=8')
  })

  it('format latex expression', () => {
    assert.equal(algebraExpression.toLatex(), 'x\\cdot \\frac{3}{9}')
  })

  it('chain functions', () => {
    const result = new AlgebraLatex().parseMath('1/sqrt(2)').toLatex()
    assert.equal(result, '\\frac{1}{\\sqrt{2}}')
  })

  describe('algebra.js', () => {
    const algebraJSEquation = algebraEquation.toAlgebra(algebraJS)
    const algebraJSExpression = algebraExpression.toAlgebra(algebraJS)

    it('should solve equation', () => {
      assert.equal(algebraJSEquation.solveFor('x').toString(), '34/3')
    })

    it('should solve expression', () => {
      assert.equal(algebraJSExpression.toString(), '1/3x')
    })

    it('should parse greek letters correctly', () => {
      const latex = '\\alpha + \\alpha - \\Delta'
      const obj = new AlgebraLatex().parseLatex(latex)

      assert.equal(obj.toAlgebra(algebraJS).toTex(), '2\\alpha - \\Delta')
    })
  })

  describe('algebrite', () => {
    const algebriteExpression = algebraExpression.toAlgebrite(algebrite)
    const algebriteEquation = algebraEquation.toAlgebrite(algebrite)

    it('should solve expression', () => {
      assert.equal(algebriteExpression.toString(), '1/3*x')
    })

    it('should fail to parse equation', () => {
      assert.throws(() => {
        throw algebriteEquation
      }, /Algebrite can not handle equations, only expressions/)
    })

    it('should parse greek letters correctly', () => {
      const latex = '\\alpha + \\alpha - \\Delta'
      const obj = new AlgebraLatex().parseLatex(latex)

      assert.equal(obj.toAlgebrite(algebrite).toString(), '-Delta+2*alpha')
    })
  })

  describe('coffeequate', () => {
    const coffeequateEquation = algebraEquation.toCoffeequate(coffeequate)
    const coffeequateExpression = algebraExpression.toCoffeequate(coffeequate)

    it('should solve equation', () => {
      assert.equal(coffeequateEquation.toString(), '8 - 10/-3 + x')
    })

    it('should solve expression', () => {
      assert.equal(coffeequateExpression.toString(), 'x/3')
    })

    it('solve exponent', () => {
      const latex = '3^{3}+4^2'

      const result = new AlgebraLatex()
        .parseLatex(latex)
        .toCoffeequate(coffeequate)
        .toString()

      assert.equal(result, '43')
    })
  })
})
