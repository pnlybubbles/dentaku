import { html, app, logger, classNames } from './lib.js'
import { ACTION, MODE, OP, PAD } from './constant.js'

const render = (emit, state) => {
  return html`
    <main class="root">
      <div class="display-container">
        <div class="display">${state.display}</div>
      </div>
      <div class="container">
        ${PAD.map(
          v =>
            html`
              <button
                class="${classNames([
                  'button',
                  {
                    op: v.type === ACTION.OP || v.type === ACTION.CLEAR,
                    ans: v.type === ACTION.ANS
                  }
                ])}"
                onclick=${() => emit(v.type, v.payload)}
              >
                <span class="label">${v.label}</span>
              </button>
            `
        )}
      </div>
    </main>
  `
}

const initialState = {
  value: 0,
  display: '0',
  mode: MODE.CLEAR,
  op: OP.NONE
}

const mutation = (state, action, payload) => {
  switch (action) {
    case ACTION.NUM:
      switch (state.mode) {
        case MODE.DEFAULT:
          return { ...state, display: state.display + payload.value }
        case MODE.CLEAR:
          return { ...state, display: payload.value, mode: MODE.DEFAULT }
        default:
          return state
      }
    case ACTION.OP:
      const { value, display } = state
      const current = parseFloat(display)
      const newValue =
        state.mode === MODE.CLEAR
          ? value
          : calculation(state.op, value, current)
      return {
        ...state,
        op: payload.op,
        mode: MODE.CLEAR,
        value: newValue,
        display: newValue.toString()
      }
    case ACTION.CLEAR:
      return { ...state, op: OP.NONE, mode: MODE.CLEAR, display: '0' }
    case ACTION.ANS:
      return (newValue => ({
        ...state,
        op: OP.NONE,
        mode: MODE.CLEAR,
        value: newValue,
        display: newValue.toString()
      }))(calculation(state.op, state.value, parseFloat(state.display)))
    default:
      return state
  }
}

const calculation = (type, lhs, rhs) => {
  switch (type) {
    case OP.NONE:
      return rhs
    case OP.ADD:
      return lhs + rhs
    case OP.SUB:
      return lhs - rhs
    case OP.MUL:
      return lhs * rhs
    case OP.DIV:
      return lhs / rhs
    default:
      return lhs
  }
}

app(document.querySelector('#app'), initialState, [logger], mutation, render)
