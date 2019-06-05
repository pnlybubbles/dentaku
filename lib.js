export const BUILTIN_ACTION = {
  init: '__INIT__'
}

/**
 * アプリのインスタンス化
 * @param {HTMLElement} $target マウント先
 * @param {State} initialState ステートの初期値
 * @param {(State, Action, Payload) => State} mutation ステートの更新
 * @param {(State) => Tree} render 描画関数
 */
export const app = ($target, initialState, mutation, render) => {
  let state = initialState
  const middlewares = []

  const emit = (action, payload) => {
    const newState = mutation(state, action, payload)
    for (const mw of middlewares) {
      mw(newState, action, payload)
    }
    // 構造データを取得
    const root = render(newState)
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

  const run = () => emit(BUILTIN_ACTION.init)
  const use = mw => middlewares.push(mw)

  return { emit, use, run }
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

// (targetNode: Node, newNode: Node) => void
// targetNodeをnewNodeと違う部分だけ更新する
const updateDiffDom = (targetNode, newNode) => {
  if (!isShallowEqualNode(targetNode, newNode)) {
    // ノードが異なる場合は置換
    replaceNode(targetNode, newNode)
  } else {
    if (isElementNode(targetNode) && isElementNode(newNode)) {
      // イベントリスナの差分更新
      const targetEvent = Object.keys(targetNode.dataset).filter(
        v => v.slice(0, 2) === 'on'
      )
      const newEvent = Object.keys(newNode.dataset).filter(
        v => v.slice(0, 2) === 'on'
      )
      // カスタムデータに`on~~~`がセットされているものだけ比較
      const interestEvent = targetEvent
        .concat(newEvent)
        .filter((v, i, self) => self.indexOf(v) === i)
      for (const onevent of interestEvent) {
        const listener = targetNode[onevent]
        const newListener = newNode[onevent]
        if (listener !== newListener) {
          targetNode[onevent] = newListener
        }
      }
      // 属性の差分更新
      for (const targetAttribute of targetNode.attributes) {
        const name = targetAttribute.name
        const newValue = newNode.getAttribute(name)
        if (newValue === null) {
          // 無い属性を削除
          targetNode.removeAttribute(name)
        } else if (newValue !== targetAttribute.value) {
          // 値が異なる属性を更新
          targetNode.setAttribute(name, newValue)
        }
      }
      for (const newAttribute of newNode.attributes) {
        if (targetNode.getAttribute(newAttribute.name) !== null) continue
        // 新しい属性を追加
        targetNode.setAttribute(newAttribute.name, newAttribute.value)
      }
    }
    for (const [targetNode_, newNode_] of [
      ...zip(targetNode.childNodes, newNode.childNodes)
    ].reverse()) {
      // ノードの差分更新
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

// (template: string[]) => { vnode, dom }
// テンプレートの配列内の文字列がすべて完全一致した場合にキャッシュを呼び出す
const fetchCache = template => {
  for (const c of $cache) {
    if (c.vnode.template.every((v, i) => template[i] === v)) {
      return c
    }
  }
  return null
}

// (vnode, slots) => { dom, slots }
// vnodeのテンプレートとアンカーを組み合わせてDOMを構成する
// 可能な場合はキャッシュされたDOMが利用可能なようにslotsを更新する
const getDomByVnode = (vnode, slots) => {
  const { template, anchors } = vnode
  const cached = fetchCache(template)
  if (cached !== null) {
    // キャッシュがある場合はDOMを再利用
    // キャッシュのDOMに埋め込まれているアンカーIDに対応するようにスロットのIDを更新
    return {
      dom: cached.dom.cloneNode(true),
      slots: Object.fromEntries(
        cached.vnode.anchors.map((a, i) => [a, slots[anchors[i]]])
      )
    }
  } else {
    // キャッシュにない場合はHTMLをパース
    const text = [...eachAlternately(template, anchors)].join('')
    const dom = new DOMParser()
      .parseFromString(text, 'text/html')
      .querySelector('body').childNodes[0]
    // キャッシュにDOMを対応するアンカーIDを保存
    saveCache(vnode, dom)
    return {
      dom: dom.cloneNode(true),
      slots
    }
  }
}

// template: 変数部で区切られた文字列の配列
// anchors: 変数部を識別するIDの配列
// slots: アンカーIDに対応する値を紐付けるハッシュテーブル
// Tree: { vnode, slots }
// vnode: { anchors: ID[], template: string[] }
// slots: { [ID]: SlotValue }
// ({ vnode, slots }: Tree) => dom
// vnodeとslotsからDOMを構成する
// vnodeのテンプレートからアンカーが埋め込まれたDOMを生成、DOMを走査してスロットを展開する
const compile = ({ vnode: vnode_, slots: slots_ }) => {
  const { dom, slots } = getDomByVnode(vnode_, slots_)
  const removeNodeQueue = []

  traverseNode(dom, node => {
    if (node.nodeValue !== null) {
      // Textノードの場合
      const slot = slots[node.nodeValue.trim()]
      if (slot) {
        switch (slot.type) {
          case SLOT_TYPE.NODE:
            // 再帰的に小要素をスロット展開
            replaceNode(node, compile(slot.value))
            break
          case SLOT_TYPE.VALUE:
            // 文字列としてスロット展開
            node.nodeValue = slot.value
            break
        }
      }
    }
    if (isElementNode(node)) {
      // Elementノードの場合
      for (const attr of node.attributes) {
        // 属性名をスロット展開
        let attrName = attr.name
        const attrNameSlot = slots[attrName]
        if (attrNameSlot) {
          node.setAttribute(attrNameSlot.value, attr.value)
          node.removeAttribute(attrName)
          attrName = attrNameSlot.value
        }
        // 属性値をスロット展開
        const attrValueSlot = slots[attr.value]
        if (attrValueSlot) {
          if (attrValueSlot.type === SLOT_TYPE.FUNCTION) {
            // 関数の場合はイベントリスナとしてプロパティに代入
            // イベント名をカスタムデータとして登録
            node.removeAttribute(attrName)
            node[attrName] = attrValueSlot.value
            node.dataset[attrName] = ''
            if (DEBUG && !EVENT_NAMES.includes(attrName)) {
              console.error(`Unknown event name: "${attrName}"`)
            }
          } else {
            node.setAttribute(attrName, attrValueSlot.value)
          }
        }
      }
    }
    if (isCommentNode(node)) {
      // コメントノードは削除
      removeNodeQueue.push(node)
    }
  })
  // 不要なノードの削除
  for (const node of removeNodeQueue) {
    node.remove()
  }
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
  VALUE: 'VALUE',
  FUNCTION: 'FUNCTION'
}

/**
 * 描画関数`render`の戻り値をつくる
 * @param {*} templateOrg
 * @param  {...any} args
 * @return {Tree}
 */
export const html = (templateOrg, ...args) => {
  const slots = {}
  const anchors = []
  const template = [...templateOrg]
  for (let i = args.length - 1; i >= 0; i--) {
    const arg = args[i]
    if (Array.isArray(arg)) {
      // 配列が1つのスロットに入っている場合は、配列をフラットに展開して複数のスロットにする
      // スロットが連続するとアンカーを埋め込んだときにテキストがつながってしまう
      // テキストノードを分割するために間にコメントノードを挟む
      // `ID1<!---->ID2<!---->ID3<!---->ID4`
      // のようなHTMLになるように配列を展開してフラットにする
      if (arg.length === 0) {
        const anchor = getAnchor()
        Object.assign(slots, { [anchor]: parseArg('') })
        anchors.unshift(anchor)
      } else if (arg.length >= 1) {
        const slotArr = arg.map(a => parseArg(a))
        const anchorArr = slotArr.map(() => getAnchor())
        Object.assign(slots, Object.fromEntries(zip(anchorArr, slotArr)))
        anchors.unshift(...anchorArr)
        if (arg.length >= 2) {
          const textNodeSeparator = new Array(arg.length - 1).fill('<!---->')
          template.splice(i + 1, 0, ...textNodeSeparator)
        }
      }
    } else {
      // アンカーIDを生成
      // アンカーIDに対応したスロットをハッシュテーブルに追加
      const anchor = getAnchor()
      Object.assign(slots, { [anchor]: parseArg(arg) })
      anchors.unshift(anchor)
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

// () => ID: string
const getAnchor = () => `_${randomString()}`

// (arg: any) => SlotValue
// SlotValue:
//   { type: VALUE, value: string } |
//   { type: NODE, value: TREE }
//   { type: FUNCTION, value: Function }
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
        type: SLOT_TYPE.FUNCTION,
        value: arg
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

/**
 * ログを出力するミドルウェア
 */
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

const EVENT_NAMES = Object.getOwnPropertyNames(HTMLElement.prototype).filter(
  v => v.slice(0, 2) === 'on'
)

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

export const DEBUG = location.hostname === 'localhost'
