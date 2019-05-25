export const BUILTIN_ACTION = {
  init: '__INIT__'
}

export const app = ($target, initialState, middlewares, mutation, render) => {
  let state = initialState

  const emit = (action, payload) => {
    const newState = mutation(state, action, payload)
    for (const mw of middlewares) {
      mw(newState, action, payload)
    }
    purgeGlobalFunction()
    const dom = render(emit, newState)
    $target.childNodes.forEach(v => $target.removeChild(v))
    $target.appendChild(dom)
    state = newState
  }

  emit(BUILTIN_ACTION.init)
}

export const html = (template, ...args) => {
  const text = [...eachAlternatly(template, parseArgs(args))].join('')
  return new DOMParser()
    .parseFromString(text, 'text/html')
    .querySelector('body').childNodes[0]
}

const parseArgs = args =>
  args.map(arg => {
    switch (typeof arg) {
      case 'string':
        return arg
      case 'function':
        return registerGlobalFunction(arg)
      case 'object':
        if (Array.isArray(arg)) {
          return parseArgs(arg).join('')
        } else if (arg instanceof Node) {
          return arg.outerHTML
        } else {
          return arg.toString()
        }
      default:
        return arg.toString()
    }
  })

export const logger = (state, action, _payload) => {
  console.log(
    `%c${getTimeString()} %c${action}%c %o`,
    styleObjectToString({
      color: '#aaa'
    }),
    styleObjectToString({
      'font-weight': 'bold',
      color: '#7c7'
    }),
    styleObjectToString({}),
    state
  )
}

const getTimeString = () => {
  const date = new Date()
  const hour = date
    .getHours()
    .toString()
    .padStart(2, '0')
  const minute = date
    .getMinutes()
    .toString()
    .padStart(2, '0')
  const second = date
    .getSeconds()
    .toString()
    .padStart(2, '0')
  const millisecond = date
    .getMilliseconds()
    .toString()
    .padStart(4, '0')
  return `${hour}:${minute}:${second}.${millisecond}`
}

const styleObjectToString = style =>
  Object.keys(style)
    .map(key => `${key}: ${style[key]};`)
    .join('\n')

const randomString = () =>
  Math.random()
    .toString(36)
    .slice(-8)

export const classNames = arrayClassNames =>
  arrayClassNames
    .filter(v => v)
    .flatMap(v => {
      if (typeof v === 'object') {
        return Object.keys(v).filter(k => v[k])
      } else {
        return v
      }
    })
    .join(' ')

const PREFIX = '__functions__'

const registerGlobalFunction = func => {
  const id = randomString()
  window[PREFIX] = window[PREFIX] || {}
  window[PREFIX][id] = func
  return `window['${PREFIX}']['${id}']()`
}

const purgeGlobalFunction = () => {
  window[PREFIX] = {}
}

function* eachAlternatly(first, second) {
  let i = 0
  let j = 0
  while (true) {
    if (i < first.length) yield first[i]
    i += 1
    if (j < second.length) yield second[j]
    j += 1
    if (i >= first.length && j >= second.length) break
  }
}
