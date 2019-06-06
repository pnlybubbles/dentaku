import {
  html,
  app,
  logger,
  classNames,
  styleObjectToString,
  isIOS,
  isSP
} from './lib.js'
import { ACTION, MODE, OP, PAD } from './constant.js'

const cachedHandlers = PAD.map(pad => () => emit(pad.type, pad.payload))
const stop = e => e.stopPropagation()

const render = state => {
  return html`
    <main class="root">
      <div class="display-container">
        <div class="display">${state.display}</div>
        <div class="history" ontouchmove=${stop}>
          ${state.history.map(v => renderHistoryItem(v))}
        </div>
      </div>
      <div class="container">
        ${PAD.map((pad, i) =>
          renderButton(pad, cachedHandlers[i], state.op, state.ac)
        )}
      </div>
    </main>
  `
}

const onClick = isSP ? 'ontouchend' : 'onclick'

const renderHistoryItem = value => html`
  <div
    class="history-item"
    onclick=${() => emit(ACTION.APPLY_MEMORY, { value })}
  >
    ${value}
  </div>
`

const renderLabel = label => {
  if (label.slice(0, 3) === 'fa-') {
    return html`
      <i class="${classNames(['fas', label])}"></i>
    `
  } else {
    return label
  }
}

const renderButton = (pad, handler, op, ac) => html`
  <div
    class="${classNames([
      'button',
      {
        op: pad.type === ACTION.OP,
        fn: [ACTION.MEMORY, ACTION.CLEAR_MEMORY, ACTION.CLEAR].includes(
          pad.type
        ),
        ans: pad.type === ACTION.ANS,
        highlight: pad.type === ACTION.OP && pad.payload.op === op
      }
    ])}"
    ${onClick}=${handler}
  >
    <div class="label">
      ${pad.type === ACTION.CLEAR && ac ? 'AC' : renderLabel(pad.label)}
    </div>
  </div>
`

const initialState = {
  value: 0,
  display: '0',
  mode: MODE.CLEAR,
  op: OP.NONE,
  ac: true,
  history: []
}

const mutation = (state, action, payload) => {
  switch (action) {
    // 数字が押されたとき
    case ACTION.NUM: {
      switch (state.mode) {
        case MODE.DEFAULT:
          return { ...state, display: state.display + payload.value }
        case MODE.CLEAR:
          return {
            ...state,
            display: payload.value,
            mode: MODE.DEFAULT,
            ac: false
          }
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
      if (state.ac) {
        return {
          ...state,
          mode: MODE.CLEAR,
          display: '0',
          op: OP.NONE,
          value: 0
        }
      } else {
        return { ...state, mode: MODE.CLEAR, display: '0', ac: true }
      }
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
        display: value.toString(),
        ac: true
      }
    }
    case ACTION.DOT: {
      // "."が押されたとき
      const { display, mode } = state
      if (display.includes('.')) {
        return state
      } else if (mode === MODE.CLEAR) {
        return { ...state, mode: MODE.DEFAULT, display: '0.', ac: false }
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
    case ACTION.MEMORY: {
      const { history, display } = state
      const current = parseFloat(display)
      const value = calc(state.op, state.value, current)
      return {
        ...state,
        history: [...history, value]
      }
    }
    case ACTION.APPLY_MEMORY: {
      return {
        ...state,
        display: payload.value.toString()
      }
    }
    case ACTION.CLEAR_MEMORY: {
      return {
        ...state,
        history: []
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
    case OP.PERCENTAGE:
      return lhs * rhs * 0.01
    default:
      return lhs
  }
}

const { emit, use, run } = app(
  document.querySelector('#app'),
  initialState,
  mutation,
  render
)

use(logger)
run()

// iOS対応
if (isIOS) {
  window.addEventListener(
    'touchmove',
    function(e) {
      e.preventDefault()
    },
    { passive: false }
  )
  document.body.style = styleObjectToString({
    minHeight: `${window.innerHeight}px`
  })
}

// PWA対応
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('service-worker.js')
    .then(function(registration) {
      console.log(
        'Service Worker registration successful with scope: ',
        registration.scope
      )
    })
    .catch(function(err) {
      console.log('Service Worker registration failed: ', err)
    })
}
