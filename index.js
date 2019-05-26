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
                ontouchstart=""
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
    // 数字が押されたとき
    case ACTION.NUM: {
      switch (state.mode) {
        case MODE.DEFAULT:
          return { ...state, display: state.display + payload.value }
        case MODE.CLEAR:
          return { ...state, display: payload.value, mode: MODE.DEFAULT }
        default:
          return state
      }
    }
    case ACTION.OP: {
      // 二項演算子が押されたとき
      const { op } = payload
      switch (state.mode) {
        case MODE.DEFAULT:
          const current = parseFloat(state.display)
          const value = calc(state.op, state.value, current)
          return {
            ...state,
            op,
            mode: MODE.CLEAR,
            value,
            display: value.toString()
          }
        case MODE.CLEAR:
          return { ...state, op }
      }
    }
    case ACTION.CLEAR: {
      // "C"が押されたとき
      return { ...state, op: OP.NONE, mode: MODE.CLEAR, display: '0' }
    }
    case ACTION.ANS: {
      // "="が押されたとき
      const current = parseFloat(state.display)
      const value = calc(state.op, state.value, current)
      return {
        ...state,
        op: OP.NONE,
        mode: MODE.CLEAR,
        value,
        display: value.toString()
      }
    }
    case ACTION.DOT: {
      // "."が押されたとき
      const { display, mode } = state
      if (display.includes('.')) {
        return state
      } else if (mode === MODE.CLEAR) {
        return { ...state, mode: MODE.DEFAULT, display: '0.' }
      } else {
        return { ...state, display: display + '.' }
      }
    }
    case ACTION.ZERO: {
      // "0"が押されたとき
      const { display, mode } = state
      if (mode === MODE.CLEAR) {
        return state
      } else {
        return { ...state, display: display + '0' }
      }
    }
    default: {
      return state
    }
  }
}

const calc = (type, lhs, rhs) => {
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
