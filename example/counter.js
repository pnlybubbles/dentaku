import { html, app, logger } from '../lib.js'

const handleClick = () => emit(ACTION.up, { amount: 1 })

const render = state => {
  return html`
    <main>
      <h1>${state.count}</h1>
      <button onclick=${handleClick}>up</button>
    </main>
  `
}

const initialState = {
  count: 0
}

const ACTION = {
  up: 'UP'
}

const mutation = (state, action, payload) => {
  switch (action) {
    case ACTION.up:
      return { ...state, count: state.count + payload.amount }
    default:
      return state
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
