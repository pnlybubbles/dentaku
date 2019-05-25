export const ACTION = {
  NUM: 'NUM',
  OP: 'OP',
  ANS: 'ANS',
  CLEAR: 'CLEAR'
}

export const OP = {
  ADD: 'ADD',
  SUB: 'SUB',
  MUL: 'MUL',
  DIV: 'DIV',
  NONE: 'NONE'
}

export const MODE = {
  DEFAULT: 'DEFAULT',
  CLEAR: 'CLEAR'
}

export const PAD = [
  {
    label: '＜',
    type: ACTION.OP,
    payload: {
      op: OP.NONE
    }
  },
  {
    label: '％',
    type: ACTION.OP,
    payload: {
      op: OP.NONE
    }
  },
  {
    label: 'M',
    type: ACTION.OP,
    payload: {
      op: OP.NONE
    }
  },
  {
    label: '÷',
    type: ACTION.OP,
    payload: {
      op: OP.DIV
    }
  },
  {
    label: '7',
    type: ACTION.NUM,
    payload: {
      value: '7'
    }
  },
  {
    label: '8',
    type: ACTION.NUM,
    payload: {
      value: '8'
    }
  },
  {
    label: '9',
    type: ACTION.NUM,
    payload: {
      value: '9'
    }
  },
  {
    label: '×',
    type: ACTION.OP,
    payload: {
      op: OP.MUL
    }
  },
  {
    label: '4',
    type: ACTION.NUM,
    payload: {
      value: '4'
    }
  },
  {
    label: '5',
    type: ACTION.NUM,
    payload: {
      value: '5'
    }
  },
  {
    label: '6',
    type: ACTION.NUM,
    payload: {
      value: '6'
    }
  },
  {
    label: '−',
    type: ACTION.OP,
    payload: {
      op: OP.SUB
    }
  },
  {
    label: '1',
    type: ACTION.NUM,
    payload: {
      value: '1'
    }
  },
  {
    label: '2',
    type: ACTION.NUM,
    payload: {
      value: '2'
    }
  },
  {
    label: '3',
    type: ACTION.NUM,
    payload: {
      value: '3'
    }
  },
  {
    label: '+',
    type: ACTION.OP,
    payload: {
      op: OP.ADD
    }
  },
  {
    label: '0',
    type: ACTION.NUM,
    payload: {
      value: '0'
    }
  },
  {
    label: '.',
    type: ACTION.NUM,
    payload: {
      value: '.'
    }
  },
  {
    label: 'C',
    type: ACTION.CLEAR,
    payload: {}
  },
  {
    label: '=',
    type: ACTION.ANS,
    payload: {}
  }
]
