'use strict'

class Config {
  constructor (values) {
    this.keyDefined = (key) => key in values
    this.getValue = (key) => values[key]
  }

  get (key) {
    if (this.keyDefined(key)) {
      return this.getValue(key)
    } else {
      throw new Error(`Unknown configuration: ${key}`)
    }
  }
}

class ConfigBuilder {
  constructor () {
    this.variables = {}
  }

  build () {
    return new Config(this.variables)
  }

  addValue (key, value) {
    if (value === undefined) {
      throw new Error(`Failed to add "${key}" property. The value cannot be undefined`)
    }
    if (key in this.variables) {
      throw new Error(`"${key}" already has a value defined.`)
    }
    this.variables[key] = value
    return this
  }

  addValueWithDefault (key, value, defaultValue) {
    if (defaultValue === undefined) {
      throw new Error(`Failed to add "${key}" property. Default value cannot be undefined`)
    }
    return this.addValue(key, value === undefined ? defaultValue : value)
  }
}

const config = new ConfigBuilder()
  .addValue('NETWORK', process.env.NETWORK || 'mainnet')
  .build()

export { config }
