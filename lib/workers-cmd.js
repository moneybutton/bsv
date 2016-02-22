/**
 * WorkersCmd
 * ==========
 *
 * A command sent to a worker. The idea is that you send the worker an object,
 * and a method to perform on that object, and the arguments to that method. It
 * will send back a result, which is a WorkersResult object.
 */
'use strict'
let dependencies = {
  BW: require('./bw'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let BW = deps.BW
  let Struct = deps.Struct

  function WorkersCmd (objbuf, classname, methodname, args, id) {
    if (!(this instanceof WorkersCmd)) {
      return new WorkersCmd(objbuf, classname, methodname, args, id)
    }
    this.fromObject({objbuf, classname, methodname, args, id})
  }

  WorkersCmd.prototype = Object.create(Struct.prototype)
  WorkersCmd.prototype.constructor = WorkersCmd

  /**
   * The arguments to a workers command can be normal javascript objects,
   * buffers, or fullnode objects.
   */
  WorkersCmd.argsToBW = function (bw, args) {
    bw.writeVarintNum(args.length)
    for (let index in args) {
      let arg = args[index]
      if (Buffer.isBuffer(arg)) {
        // argument is Buffer
        bw.writeUInt8(0) // header byte
        bw.writeVarintNum(arg.length)
        bw.write(arg)
      } else if (arg instanceof Struct) {
        // argument is fullnode object
        bw.writeUInt8(1) // header byte
        let classname = arg.constructor.name
        bw.writeVarintNum(classname.length)
        bw.write(new Buffer(classname))
        let buf = arg.toFastBuffer()
        bw.writeVarintNum(buf.length)
        bw.write(buf)
      } else {
        // assume basic javascript type
        bw.writeUInt8(2) // header byte
        let buf = new Buffer(JSON.stringify(arg))
        bw.writeVarintNum(buf.length)
        bw.write(buf)
      }
    }
    return bw
  }

  /**
   * The arguments to a workers command can be normal javascript objects,
   * buffers, or fullnode objects.
   */
  WorkersCmd.argsFromBR = function (br, classes) {
    let argslen = br.readVarintNum()
    let args = []
    for (let i = 0; i < argslen; i++) {
      let header = br.readUInt8()
      if (header === 0) {
        // argument is Buffer
        let len = br.readVarintNum()
        let buf = br.read(len)
        args.push(buf)
      } else if (header === 1) {
        // argument is fullnode object
        let classnamelen = br.readVarintNum()
        let classname = br.read(classnamelen).toString()
        let buflen = br.readVarintNum()
        let buf = br.read(buflen)
        let obj = classes[classname]().fromFastBuffer(buf)
        args.push(obj)
      } else if (header === 2) {
        // argument is basic javascript type
        let len = br.readVarintNum()
        let buf = br.read(len)
        let obj = JSON.parse(buf.toString())
        args.push(obj)
      } else {
        throw new Error('invalid header byte for argument')
      }
    }
    return args
  }

  WorkersCmd.prototype.toBW = function (bw) {
    if (!bw) {
      bw = new BW()
    }
    let classnamebuf = new Buffer(this.classname)
    bw.writeUInt8(Number(this.isobj))
    bw.writeVarintNum(classnamebuf.length)
    bw.write(classnamebuf)
    let methodnamebuf = new Buffer(this.methodname)
    bw.writeVarintNum(methodnamebuf.length)
    bw.write(methodnamebuf)
    bw.writeVarintNum(this.objbuf.length)
    bw.write(this.objbuf)
    WorkersCmd.argsToBW(bw, this.args)
    bw.writeVarintNum(this.id)
    return bw
  }

  WorkersCmd.prototype.fromBR = function (br, classes) {
    this.isobj = Boolean(br.readUInt8())
    let classnamelen = br.readVarintNum()
    this.classname = br.read(classnamelen).toString()
    let methodnamelen = br.readVarintNum()
    this.methodname = br.read(methodnamelen).toString()
    let objbuflen = br.readVarintNum()
    this.objbuf = br.read(objbuflen)
    this.args = WorkersCmd.argsFromBR(br, classes)
    this.id = br.readVarintNum()
    return this
  }

  WorkersCmd.prototype.fromObjectMethod = function (obj, methodname, args, id) {
    this.isobj = true
    this.objbuf = obj.toFastBuffer()
    this.classname = obj.constructor.name
    this.methodname = methodname
    this.args = args
    this.id = id
    return this
  }

  WorkersCmd.prototype.fromClassMethod = function (classname, methodname, args, id) {
    this.isobj = false
    this.objbuf = new Buffer(0)
    this.classname = classname
    this.methodname = methodname
    this.args = args
    this.id = id
    return this
  }

  return WorkersCmd
}

inject = require('./injector')(inject, dependencies)
let WorkersCmd = inject()
module.exports = WorkersCmd
