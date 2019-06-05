export const ACTION = {
  NUM: 'NUM',
  OP: 'OP',
  ANS: 'ANS',
  CLEAR: 'CLEAR',
  DOT: 'DOT',
  ZERO: 'ZERO',
  NONE: 'NONE',
  MEMORY: 'MEMORY',
  APPLY_MEMORY: 'APPLY_MEMORY',
  CLEAR_MEMORY: 'CLEAR_MEMORY'
}

export const OP = {
  ADD: 'ADD',
  SUB: 'SUB',
  MUL: 'MUL',
  DIV: 'DIV',
  PERCENTAGE: 'PERCENTAGE',
  NONE: 'NONE'
}

export const MODE = {
  DEFAULT: 'DEFAULT',
  CLEAR: 'CLEAR'
}

export const PAD = [
  {
    label: 'fa-trash',
    type: ACTION.CLEAR_MEMORY
  },
  {
    label: 'fa-save',
    type: ACTION.MEMORY
  },
  {
    label: 'fa-percentage',
    type: ACTION.OP,
    payload: {
      op: OP.PERCENTAGE
    }
  },
  {
    label: 'fa-divide',
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
    label: 'fa-times',
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
    label: 'fa-minus',
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
    label: 'fa-plus',
    type: ACTION.OP,
    payload: {
      op: OP.ADD
    }
  },
  {
    label: '0',
    type: ACTION.ZERO
  },
  {
    label: '.',
    type: ACTION.DOT
  },
  {
    label: 'C',
    type: ACTION.CLEAR
  },
  {
    label: 'fa-equals',
    type: ACTION.ANS
  }
]
