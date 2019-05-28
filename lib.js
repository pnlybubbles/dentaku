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
    const dom = render(emit, newState)
    if (!($target.childNodes[0] instanceof Node)) {
      $target.appendChild(dom)
    } else {
      updateDiffDom($target.childNodes[0], dom)
    }
    state = newState
  }

  emit(BUILTIN_ACTION.init)
}

const NODE_TYPE = {
  ELEMENT_NODE: 1,
  COMMENT_NODE: 8
}

const isElementNode = node => node.nodeType === NODE_TYPE.ELEMENT_NODE
const isCommentNode = node => node.nodeType === NODE_TYPE.COMMENT_NODE

const replaceNode = (targetNode, newNode) => {
  targetNode.parentNode.replaceChild(newNode, targetNode)
}

const isShallowEqualNode = (targetNode, newNode) =>
  targetNode.nodeType === newNode.nodeType &&
  targetNode.nodeName === newNode.nodeName &&
  targetNode.nodeValue === newNode.nodeValue &&
  targetNode.childNodes.length === newNode.childNodes.length

const updateDiffDom = (targetNode, newNode) => {
  if (!isShallowEqualNode(targetNode, newNode)) {
    replaceNode(targetNode, newNode)
  } else {
    if (isElementNode(targetNode) && isElementNode(newNode)) {
      for (const targetAttribute of targetNode.attributes) {
        const name = targetAttribute.name
        const newValue = newNode.getAttribute(name)
        if (newValue === null) {
          targetNode.removeAttribute(name)
        } else if (newValue !== targetAttribute.value) {
          targetNode.setAttribute(name, newValue)
        }
      }
      for (const newAttribute of newNode.attributes) {
        if (targetNode.getAttribute(newAttribute.name) !== null) continue
        targetNode.setAttribute(newAttribute.name, newAttribute.value)
      }
    }
    for (const [targetNode_, newNode_] of zip(
      targetNode.childNodes,
      newNode.childNodes
    )) {
      updateDiffDom(targetNode_, newNode_)
    }
  }
}

export const html = (template, ...args) => {
  const { argsStr, funcMap, nodeMap } = parseArgs(args)
  const text = [...eachAlternatly(template, argsStr)].join('')
  const dom = new DOMParser()
    .parseFromString(text, 'text/html')
    .querySelector('body').childNodes[0]
  traverseNode(dom, node => {
    if (isElementNode(node)) {
      // イベントリスナの設定
      for (const attr of node.attributes) {
        const f = funcMap[attr.value]
        if (f !== undefined) {
          const name = attr.name
          node.removeAttribute(name)
          node.addEventListener(name.slice(2), f)
        }
      }
    } else if (isCommentNode(node)) {
      // 子ノードの挿入
      const n = nodeMap[node.nodeValue]
      if (n !== undefined) {
        replaceNode(node, n)
      }
    }
  })
  return dom
}

const traverseNode = (entryNode, f) => {
  f(entryNode)
  for (const node of entryNode.childNodes) {
    traverseNode(node, f)
  }
}

const parseArgs = args => {
  const funcMap = {}
  const nodeMap = {}
  const argsStr = args.map(arg => {
    switch (typeof arg) {
      case 'string':
        return arg
      case 'function':
        const hash = randomString()
        funcMap[hash] = arg
        return hash
      case 'object':
        if (Array.isArray(arg)) {
          const {
            funcMap: funcMap_,
            nodeMap: nodeMap_,
            argsStr: argsStr_
          } = parseArgs(arg)
          Object.assign(funcMap, funcMap_)
          Object.assign(nodeMap, nodeMap_)
          return argsStr_.join('')
        } else if (arg instanceof Node) {
          const hash = randomString()
          nodeMap[hash] = arg
          return `<!--${hash}-->`
        } else {
          return arg.toString()
        }
      default:
        return arg.toString()
    }
  })
  return { argsStr, funcMap, nodeMap }
}

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

export const styleObjectToString = style =>
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

function* zip(a, b) {
  const minLength = Math.max(a.length, b.length)
  for (let i = 0; i < minLength; i++) {
    yield [a[i], b[i]]
  }
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

export const isIOS = /iP(hone|(o|a)d)/.test(navigator.userAgent)
export const isSP = /(iP(hone|(o|a)d))|Android/.test(navigator.userAgent)
