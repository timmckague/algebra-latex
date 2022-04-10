// import * as greekLetters from '../models/greek-letters'

export default class MathFormatter {
  constructor(ast) {
    this.ast = ast
  }

  format(root = this.ast) {
    if (root == null) {
      return ''
    }

    switch (root.type) {
      case 'operator':
        return this.operator(root)
      case 'number':
        return this.number(root)
      case 'function':
        return this.function(root)
      case 'variable':
        return this.variable(root)
      case 'equation':
        return this.equation(root)
      case 'subscript':
        return this.subscript(root)
      case 'uni-operator':
        return this.uni_operator(root)
      default:
        throw Error('Unexpected type: ' + root.type)
    }
  }

  operator(root) {
    let op = root.operator

    switch (op) {
      case 'plus':
        op = '+'
        break
      case 'minus':
        op = '-'
        break
      case 'multiply':
        op = '*'
        break
      case 'divide':
        op = '/'
        break
      case 'modulus':
        op = '%'
        break
      case 'exponent':
        op = '^'
        break
      default:
    }

    let lhs = this.format(root.lhs)
    let rhs = this.format(root.rhs)

    const precedenceOrder = [
      ['modulus'],
      ['exponent'],
      ['multiply', 'divide'],
      ['plus', 'minus'],
    ]

    const higherPrecedence = (a, b) => {
      const depth = (op) => precedenceOrder.findIndex((val) => val.includes(op))

      return depth(b) > depth(a)
    }

    const shouldHaveParenthesis = (child) =>
      child.type == 'operator' &&
      higherPrecedence(root.operator, child.operator)

    let lhsParen = shouldHaveParenthesis(root.lhs)
    // Special case for exponents eg. (-1)^2
    lhsParen =
      lhsParen ||
      (op == '^' && root.lhs.type === 'number' && root.lhs.value < 0)

    let rhsParen = shouldHaveParenthesis(root.rhs)

    // Special case for division
    rhsParen = rhsParen || (op == '/' && root.rhs.type == 'operator')

    // Special case for minus eg for handling a - (b + c) vs a - b + c
    rhsParen = rhsParen || root.isRightDistributive

    // Special case to just make uni operators more explicit with their output
    // for example 10(-(1-x)) produces 10*-(1-x) which makes algebrite unhappy
    rhsParen = rhsParen || root.rhs.type == 'uni-operator'

    if (root.operator == 'exponent') {
      if (root.rhs.type == 'number' && root.rhs.value < 0) {
        rhsParen = true
      }
    }

    lhs = lhsParen ? `(${lhs})` : lhs
    rhs = rhsParen ? `(${rhs})` : rhs

    return lhs + op + rhs
  }

  number(root) {
    return `${root.value}`
  }

  function(root) {
    return `${root.value}(${this.format(root.content)})`
  }

  variable(root) {
    // this doesn't play nice with algebrite
    // let greekLetter = greekLetters.getSymbol(root.value)

    // if (greekLetter) {
    //   return greekLetter
    // }

    return `${root.value}`
  }

  equation(root) {
    return `${this.format(root.lhs)}=${this.format(root.rhs)}`
  }

  subscript(root) {
    if (root.subscript.type == 'variable' && root.subscript.value.length == 1) {
      return `${this.format(root.base)}_${this.format(root.subscript)}`
    }

    return `${this.format(root.base)}_(${this.format(root.subscript)})`
  }

  uni_operator(root) {
    if (root.operator == 'minus') {
      if (root.isRightDistributive) {
        return `-(${this.format(root.value)})`
      }
      return `-${this.format(root.value)}`
    }

    return this.format(root.value)
  }
}
