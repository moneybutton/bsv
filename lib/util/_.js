'use strict'

var _ = {}

_.isArray = t => Array.isArray(t)
_.isNumber = t => typeof t === 'number'
_.isObject = t => t && typeof t === 'object'
_.isString = t => typeof t === 'string'
_.isUndefined = t => typeof t === 'undefined'
_.isFunction = t => typeof t === 'function'
_.isNull = t => t === null
_.isDate = t => t instanceof Date
_.extend = (a, b) => Object.assign(a, b)
_.noop = () => { }
_.every = (a, f) => a.every(f || (t => t))
_.map = (a, f) => Array.from(a).map(f || (t => t))
_.includes = (a, e) => a.includes(e)
_.each = (a, f) => a.forEach(f)
_.clone = o => Object.assign({}, o)
_.pick = (object, keys) => {
  const obj = {}
  keys.forEach(key => {
    if (typeof object[key] !== 'undefined') { obj[key] = object[key] }
  })
  return obj
}
_.values = o => Object.values(o)
_.filter = (a, f) => a.filter(f)
_.reduce = (a, f, s) => a.reduce(f, s)
_.without = (a, n) => a.filter(t => t !== n)
_.shuffle = a => {
  const result = a.slice(0)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
_.difference = (a, b) => a.filter(t => !b.includes(t))
_.findIndex = (a, f) => a.findIndex(f)
_.some = (a, f) => a.some(f)
_.range = n => [...Array(n).keys()]

module.exports = _
