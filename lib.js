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
    // 構造データを取得
    const root = render(emit, newState)
    // DOM構築(キャッシュ適用)
    const dom = compile(root)
    // 差分更新
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
  ELEMENT_NODE: 1
}

const isElementNode = node => node.nodeType === NODE_TYPE.ELEMENT_NODE

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

const $cache = []

const saveCache = (vnode, dom) => {
  $cache.push({
    vnode,
    dom
  })
}

const fetchCache = template => {
  for (const c of $cache) {
    if (c.vnode.template.every((v, i) => template[i] === v)) {
      return c
    }
  }
  return null
}

const getDomByVnode = (vnode, slots) => {
  const { template, anchors } = vnode
  const cached = fetchCache(template)
  if (cached !== null) {
    return {
      dom: cached.dom.cloneNode(true),
      slots: Object.fromEntries(
        cached.vnode.anchors.map((a, i) => [a, slots[anchors[i]]])
      )
    }
  } else {
    const text = [...eachAlternately(template, anchors)].join('')
    const dom = new DOMParser()
      .parseFromString(text, 'text/html')
      .querySelector('body').childNodes[0]
    saveCache(vnode, dom)
    return {
      dom: dom.cloneNode(true),
      slots
    }
  }
}

const compile = ({ vnode: vnode_, slots: slots_ }) => {
  const { dom, slots } = getDomByVnode(vnode_, slots_)
  traverseNode(dom, node => {
    if (node.nodeValue !== null) {
      const slot = slots[node.nodeValue.trim()]
      if (slot) {
        switch (slot.type) {
          case SLOT_TYPE.NODE:
            replaceNode(node, compile(slot.value))
            break
          case SLOT_TYPE.VALUE:
            node.nodeValue = slot.value
            break
        }
      }
    }
    if (isElementNode(node)) {
      for (const attr of node.attributes) {
        const attrNameSlot = slots[attr.name]
        if (attrNameSlot) {
          node.setAttribute(attrNameSlot.value, attr.value)
          node.removeAttribute(attr.name)
        }
        const attrValueSlot = slots[attr.value]
        if (attrValueSlot) {
          node.setAttribute(attr.name, attrValueSlot.value)
        }
      }
    }
  })
  return dom
}

const traverseNode = (node, f) => {
  f(node)
  for (const childNodes of node.childNodes) {
    traverseNode(childNodes, f)
  }
}

const SLOT_TYPE = {
  NODE: 'NODE',
  VALUE: 'VALUE'
}

export const html = (templateOrg, ...args) => {
  // const text = [...eachAlternately(template, parseArgs(args))].join('')
  const slots = {}
  const anchors = []
  const template = [...templateOrg]
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (Array.isArray(arg)) {
      const slotArr = arg.map(a => parseArg(a))
      const anchorArr = slotArr.map(() => getAnchor())
      const textNodeSeparator = new Array(anchorArr.length - 1).fill('<!---->')
      Object.assign(slots, Object.fromEntries(zip(anchorArr, slotArr)))
      anchors.push(...anchorArr)
      template.splice(i + 1, 0, ...textNodeSeparator)
    } else {
      const anchor = getAnchor()
      Object.assign(slots, { [anchor]: parseArg(arg) })
      anchors.push(anchor)
    }
  }
  const vnode = {
    template,
    anchors
  }
  return {
    vnode,
    slots
  }
}

const getAnchor = () => `_${randomString()}`

const parseArg = arg => {
  switch (typeof arg) {
    case 'string':
    case 'number':
      return {
        type: SLOT_TYPE.VALUE,
        value: arg.toString()
      }
    case 'function':
      return {
        type: SLOT_TYPE.VALUE,
        value: registerGlobalFunction(arg)
      }
    case 'object':
      if ((arg.vnode, arg.slots)) {
        return {
          type: SLOT_TYPE.NODE,
          value: arg
        }
      } else {
        // Go through default ↓
      }
    default:
      console.warn('Unknown type of arg: ', arg)
      return {
        type: SLOT_TYPE.VALUE,
        value: arg.toString()
      }
  }
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

function* zip(a, b) {
  const minLength = Math.max(a.length, b.length)
  for (let i = 0; i < minLength; i++) {
    yield [a[i], b[i]]
  }
}

function* eachAlternately(first, second) {
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
