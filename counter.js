import { html, app, logger } from './lib.js'

const render = (emit, state) => {
  return html`
    <main>
      <h1>${state.count}</h1>
      <button onclick=${() => emit(ACTION.up, { amount: 1 })}>up</button>
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

app(document.querySelector('#app'), initialState, [logger], mutation, render)
