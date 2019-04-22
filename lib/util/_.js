'use strict'

// Replace whole lodash with single functions
var _ = {}

_.isArray = require('lodash/isArray')
_.isNumber = require('lodash/isNumber')
_.isObject = require('lodash/isObject')
_.isString = require('lodash/isString')
_.isUndefined = require('lodash/isUndefined')
_.isFunction = require('lodash/isFunction')
_.isNull = require('lodash/isNull')
_.isDate = require('lodash/isDate')
_.extend = require('lodash/extend')
_.noop = require('lodash/noop')
_.every = require('lodash/every')
_.map = require('lodash/map')
_.includes = require('lodash/includes')
_.each = require('lodash/each')
_.clone = require('lodash/clone')
_.pick = require('lodash/pick')
_.values = require('lodash/values')
_.cloneDeep = require('lodash/cloneDeep')
_.sortBy = require('lodash/sortBy')
_.filter = require('lodash/filter')
_.reduce = require('lodash/reduce')
_.without = require('lodash/without')
_.shuffle = require('lodash/shuffle')
_.difference = require('lodash/difference')
_.findIndex = require('lodash/findIndex')
_.some = require('lodash/some')
_.range = require('lodash/range')

module.exports = _
