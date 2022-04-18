import { debug } from './logger'
import functions from './models/functions'

export default class ParserLatex {
  constructor(latex, Lexer, options = {}) {
    // if (!(Lexer instanceof LexerClass)) {
    //   throw Error('Please parse a valid lexer as second argument')
    // }

    this.lexer = new Lexer(latex)
    this.options = options
    this.ast = null
    this.current_token = null
    this.peek_token = null
    this.functions = functions.concat(options.functions || [])
  }

  parse() {
    debug('\nLatex parser .parse()')
    this.ast = this.equation()

    this.eat('EOF')

    return this.ast
  }

  next_token() {
    if (this.peek_token != null) {
      this.current_token = this.peek_token
      this.peek_token = null
      debug('next token from peek', this.current_token)
    } else {
      this.current_token = this.lexer.next_token()
      debug('next token', this.current_token)
    }
    return this.current_token
  }

  peek() {
    if (this.peek_token == null) {
      this.peek_token = this.lexer.next_token()
    }

    debug('next token from peek', this.peek_token)
    return this.peek_token
  }

  error(message) {
    let line = this.lexer.text.split('\n')[this.lexer.line]
    let spacing = ''

    for (let i = 0; i < this.lexer.col; i++) {
      spacing += ' '
    }

    throw Error(
      `Parser error\n${line}\n${spacing}^\nError at line: ${
        this.lexer.line + 1
      } col: ${this.lexer.col + 1}\n${message}`
    )
  }

  eat(token_type) {
    if (this.next_token().type != token_type) {
      this.error(
        `Expected ${token_type} found ${JSON.stringify(this.current_token)}`
      )
    }
  }

  equation() {
    // equation : expr ( EQUAL expr )?
    let lhs = this.expr()

    if (this.peek().type != 'equal') {
      return lhs
    } else {
      this.next_token()
    }

    let rhs = this.expr()

    return {
      type: 'equation',
      lhs,
      rhs,
    }
  }

  expr() {
    // expr : operator

    debug('expr')

    this.peek()

    if (
      this.peek_token.type == 'number' ||
      this.peek_token.type == 'operator' ||
      this.peek_token.type == 'variable' ||
      this.peek_token.type == 'function' ||
      this.peek_token.type == 'keyword' ||
      this.peek_token.type == 'bracket'
    ) {
      return this.operator()
    }

    if (this.peek_token.type == 'bracket' && this.peek_token.open == false) {
      return null
    }

    if (this.peek_token.type == 'EOF') {
      this.next_token()
      return null
    }

    this.next_token()
    this.error(`Unexpected token: ${JSON.stringify(this.current_token)}`)
  }

  keyword() {
    // keyword : KEYWORD
    //         | fraction
    //         | function

    debug('keyword')

    if (this.peek().type != 'keyword') {
      throw Error('Expected keyword found ' + JSON.stringify(this.peek_token))
    }

    let kwd = this.peek_token.value
    kwd = kwd.toLowerCase()

    debug('keyword -', kwd)

    if (kwd == 'frac') {
      return this.fraction()
    }

    if (kwd == 'sqrt') {
      return this.sqrt()
    }

    if (this.functions.includes(kwd.toLowerCase())) {
      return this.function()
    }

    this.eat('keyword')
    return {
      type: 'keyword',
      value: this.current_token.value,
    }
  }

  sqrt() {
    // sqrt : SQRT (L_SQUARE_BRAC NUMBER R_SQUARE_BRAC)? GROUP
    debug('sqrt')

    this.eat('keyword')

    if (this.current_token.value != 'sqrt') {
      this.error('Expected sqrt found ' + JSON.stringify(this.current_token))
    }

    if (this.peek().value != '[') {
      let content = this.group()

      return {
        type: 'function',
        value: 'sqrt',
        content,
      }
    }

    this.eat('bracket')
    if (this.current_token.value != '[') {
      this.error(
        'Expected "[" bracket, found ' + JSON.stringify(this.current_token)
      )
    }

    let base = this.number()

    this.eat('bracket')
    if (this.current_token.value != ']') {
      this.error(
        'Expected "]" bracket, found ' + JSON.stringify(this.current_token)
      )
    }

    let value = this.group()

    return {
      type: 'operator',
      operator: 'exponent',
      lhs: value,
      rhs: {
        type: 'operator',
        operator: 'divide',
        lhs: {
          type: 'number',
          value: 1,
        },
        rhs: base,
      },
    }
  }

  fraction() {
    // fraction : FRAC group group

    debug('fraction')

    this.eat('keyword')

    if (this.current_token.value != 'frac') {
      this.error(
        'Expected fraction found ' + JSON.stringify(this.current_token)
      )
    }

    let nominator = this.group()
    let denominator = this.group()

    return {
      type: 'operator',
      operator: 'divide',
      lhs: nominator,
      rhs: denominator,
    }
  }

  function() {
    // function : FUNCTION ( group | number )

    debug('function')

    this.eat('keyword')
    let value = this.current_token.value

    let content
    if (this.peek().type == 'bracket') {
      content = this.group()
    } else {
      content = this.number()
    }

    return {
      type: 'function',
      value,
      content,
    }
  }

  group() {
    // group : LBRACKET expr RBRACKET

    debug('start group')

    this.eat('bracket')
    if (this.current_token.open != true) {
      this.error('Expected opening bracket found ' + this.current_token)
    }

    let content = this.expr()

    this.eat('bracket')
    if (this.current_token.open != false) {
      this.error('Expected closing bracket found ' + this.current_token)
    }

    debug('end group')

    return content
  }

  operator() {
    // operator : operator_term ((PLUS | MINUS) operator)?
    debug('operator left')
    let lhs = this.operator_multiply()
    let op = this.peek()

    if (op.type != 'operator' || (op.value != 'plus' && op.value != 'minus')) {
      debug('operator only left side')
      return lhs
    }

    // Operator token
    this.next_token()

    debug('operator right')
    let rhs = this.operator()

    const node = {
      type: 'operator',
      operator: op.value,
      lhs,
      rhs,
    }

    if (this.checkIsRightDistributive(op.value, this.current_token, rhs)) {
      node.isRightDistributive = true
    }
    return node
  }

  operator_multiply() {
    // operator_multiply : (operator_divide | GROUP) ( (MULTIPLY operator_multiply) | number )?

    debug('op mul left')

    let lhs = this.operator_divide()

    let op = this.peek()

    if (
      op.type == 'number' ||
      op.type == 'variable' ||
      op.type == 'keyword' ||
      (op.type == 'bracket' && op.value == '(')
    ) {
      op = {
        type: 'operator',
        value: 'multiply',
      }
    } else if (
      op.type != 'operator' ||
      (op.value != 'multiply' && op.value != 'divide')
    ) {
      debug('term only left side')
      return lhs
    } else {
      // Operator token
      this.next_token()
    }

    debug('op mul right')

    let rhs = this.operator_multiply()

    return {
      type: 'operator',
      operator: op.value,
      lhs,
      rhs,
    }
  }

  operator_divide() {
    // operator_divide : operator_mod operator_divide_prime

    debug('operator_divide')

    let lhs = this.operator_mod()

    const divideResult = this.operator_divide_prime(lhs)

    return divideResult
  }

  operator_divide_prime(lhs) {
    // operator_divide_prime : epsilon | DIVIDE operator_mod operator_divide_prime

    let op = this.peek()

    if (op.type != 'operator' || op.value != 'divide') {
      debug('operator_divide_prime - epsilon')
      return lhs
    } else {
      // Operator token
      this.next_token()
    }

    debug('operator_divide_prime - next operator')

    let rhs = this.operator_mod()

    return this.operator_divide_prime({
      type: 'operator',
      operator: 'divide',
      lhs,
      rhs,
    })
  }

  operator_mod() {
    // operator_mod : operator_exp ( MODULUS operator_mod )?

    debug('modulus left')

    let lhs = this.operator_exp()
    let op = this.peek()

    if (op.type != 'operator' || op.value != 'modulus') {
      debug('modulus only left side')
      return lhs
    } else {
      // Operator token
      this.next_token()
    }

    debug('modulus right')

    let rhs = this.operator_mod()

    return {
      type: 'operator',
      operator: 'modulus',
      lhs,
      rhs,
    }
  }

  operator_exp() {
    // operator_exp : subscript ( EXPONENT operator_exp )?

    let lhs = this.subscript()
    let op = this.peek()

    if (op.type != 'operator' || op.value != 'exponent') {
      debug('modulus only left side')
      return lhs
    } else {
      // Operator token
      this.next_token()
    }

    let rhs = this.operator_exp()

    return {
      type: 'operator',
      operator: 'exponent',
      lhs,
      rhs,
    }
  }

  variable() {
    this.eat('variable')

    return {
      type: 'variable',
      value: this.current_token.value,
    }
  }

  subscript() {
    // subscript : number ( SUBSCRIPT subscript )?
    const base_num = this.number()

    if (this.peek().type == 'underscore') {
      this.eat('underscore')

      const sub_value = this.subscript()

      return {
        type: 'subscript',
        base: base_num,
        subscript: sub_value,
      }
    }

    return base_num
  }

  number() {
    // number : NUMBER
    //        | uni_operator
    //        | variable
    //        | keyword
    //        | symbol
    //        | group

    debug('number')

    this.peek()

    if (this.peek_token.type == 'number') {
      this.next_token()
      return {
        type: this.current_token.type,
        value: this.current_token.value,
      }
    }

    if (this.peek_token.type == 'operator') {
      return this.uni_operator()
    }

    if (this.peek_token.type == 'variable') {
      return this.variable()
    }

    if (this.peek_token.type == 'keyword') {
      return this.keyword()
    }

    if (this.peek_token.type == 'bracket') {
      return this.group()
    }

    this.next_token()
    this.error(
      'Expected number, variable, function, group, or + - found ' +
        JSON.stringify(this.current_token)
    )
  }

  /**
   * Check if rhs is bracketed, if yes, keep that info to ensure a - (b + c) is different from a - b + c
   * the rhs == operator check is to ensure the property is not applied to
   * function like sin(x) or variables with subscript like x_{first}
   * @param {*} operator
   * @param {*} current_token
   * @param {*} rhs
   * @returns boolean
   */
  checkIsRightDistributive(operator, current_token, rhs) {
    return (
      operator === 'minus' &&
      current_token.type == 'bracket' &&
      !current_token.open &&
      rhs.type === 'operator'
    )
  }

  uni_operator() {
    this.eat('operator')
    if (
      this.current_token.value == 'plus' ||
      this.current_token.value == 'minus'
    ) {
      let prefix = this.current_token.value
      let value = this.number()

      if (value.type == 'number') {
        return {
          type: 'number',
          value: prefix == 'minus' ? -value.value : value.value,
        }
      }

      const node = {
        type: 'uni-operator',
        operator: prefix,
        value,
      }

      if (this.checkIsRightDistributive(prefix, this.current_token, value)) {
        node.isRightDistributive = true
      }
      return node
    }
  }
}
