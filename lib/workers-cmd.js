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
  Bw: require('./bw'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Bw = deps.Bw
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
   * buffers, or Fullnode objects.
   */
  WorkersCmd.argsToBw = function (bw, args) {
    bw.writeVarIntNum(args.length)
    for (let index in args) {
      let arg = args[index]
      if (Buffer.isBuffer(arg)) {
        // argument is Buffer
        bw.writeUInt8(0) // header byte
        bw.writeVarIntNum(arg.length)
        bw.write(arg)
      } else if (arg instanceof Struct) {
        // argument is Fullnode object
        bw.writeUInt8(1) // header byte
        let classname = arg.constructor.name
        bw.writeVarIntNum(classname.length)
        bw.write(new Buffer(classname))
        let buf = arg.toFastBuffer()
        bw.writeVarIntNum(buf.length)
        bw.write(buf)
      } else {
        // assume basic javascript type
        bw.writeUInt8(2) // header byte
        let buf = new Buffer(JSON.stringify(arg))
        bw.writeVarIntNum(buf.length)
        bw.write(buf)
      }
    }
    return bw
  }

  /**
   * The arguments to a workers command can be normal javascript objects,
   * buffers, or Fullnode objects.
   */
  WorkersCmd.argsFromBr = function (br, classes) {
    let argslen = br.readVarIntNum()
    let args = []
    for (let i = 0; i < argslen; i++) {
      let header = br.readUInt8()
      if (header === 0) {
        // argument is Buffer
        let len = br.readVarIntNum()
        let buf = br.read(len)
        args.push(buf)
      } else if (header === 1) {
        // argument is Fullnode object
        let classNameLEn = br.readVarIntNum()
        let classname = br.read(classNameLEn).toString()
        let buflen = br.readVarIntNum()
        let buf = br.read(buflen)
        let obj = classes[classname]().fromFastBuffer(buf)
        args.push(obj)
      } else if (header === 2) {
        // argument is basic javascript type
        let len = br.readVarIntNum()
        let buf = br.read(len)
        let obj = JSON.parse(buf.toString())
        args.push(obj)
      } else {
        throw new Error('invalid header byte for argument')
      }
    }
    return args
  }

  WorkersCmd.prototype.toBw = function (bw) {
    if (!bw) {
      bw = new Bw()
    }
    let classNameBuf = new Buffer(this.classname)
    bw.writeUInt8(Number(this.isobj))
    bw.writeVarIntNum(classNameBuf.length)
    bw.write(classNameBuf)
    let methodNameBuf = new Buffer(this.methodname)
    bw.writeVarIntNum(methodNameBuf.length)
    bw.write(methodNameBuf)
    bw.writeVarIntNum(this.objbuf.length)
    bw.write(this.objbuf)
    WorkersCmd.argsToBw(bw, this.args)
    bw.writeVarIntNum(this.id)
    return bw
  }

  WorkersCmd.prototype.fromBr = function (br, classes) {
    this.isobj = Boolean(br.readUInt8())
    let classNameLEn = br.readVarIntNum()
    this.classname = br.read(classNameLEn).toString()
    let methodNameLEn = br.readVarIntNum()
    this.methodname = br.read(methodNameLEn).toString()
    let objbuflen = br.readVarIntNum()
    this.objbuf = br.read(objbuflen)
    this.args = WorkersCmd.argsFromBr(br, classes)
    this.id = br.readVarIntNum()
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

inject = require('injecter')(inject, dependencies)
let WorkersCmd = inject()
module.exports = WorkersCmd
