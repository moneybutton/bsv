/* global describe,it */
'use strict'
let should = require('chai').should()
let Point = require('../lib/point')
let Bn = require('../lib/bn')

describe('Point', function () {
  it('should create a point', function () {
    let p = new Point()
    should.exist(p)
    p = new Point()
    should.exist(p)
    ;(p instanceof Point).should.equal(true)
  })

  it('should have the standard properties for a point', function () {
    let p = new Point()
    let props = ['curve', 'type', 'precomputed', 'x', 'y', 'inf']

    // all enumerable, own properties should be in prop
    for (let k in p) {
      if (p.hasOwnProperty(k)) {
        props.indexOf(k).should.not.equal(-1)
      }
    }

    // all props should be properties of a point
    props.forEach(function (k) {
      (p[k] === undefined).should.equal(false)
    })
  })

  describe('#copyFrom', function () {
    it('should copy G', function () {
      let point = Point.getG()
      let point2
      ;(function () {
        point.copyFrom(point2)
      }).should.throw() // point2 is not a Point yet
      point2 = new Point()
      point.copyFrom(point2)
      point.toString().should.equal(point2.toString())
    })
  })

  describe('#toJSON', function () {
    it('should print G to JSON', function () {
      let G = Point.getG()
      let json = G.toJSON()
      json.x.should.equal(G.x.toString())
      json.y.should.equal(G.y.toString())
    })
  })

  describe('#fromJSON', function () {
    it('should recover G', function () {
      new Point().fromJSON(Point.getG().toJSON()).eq(Point.getG()).should.equal(true)
    })
  })

  describe('#toString', function () {
    it('should convert G to a string', function () {
      let G = Point.getG()
      G.toString().should.equal(JSON.stringify(G.toJSON()))
    })
  })

  describe('#fromString', function () {
    it('should convert a json string to G', function () {
      let G = Point.getG()
      new Point().fromString(G.toString()).eq(G).should.equal(true)
    })
  })

  describe('#getX', function () {
    it('should return a Bn', function () {
      let p = new Point()
      ;(p.getX() instanceof Bn).should.equal(true)
    })

    it('should return 0', function () {
      let p = new Point()
      p.getX().toString().should.equal('0')
    })

    it('should be convertable to a buffer', function () {
      let p = new Point()
      p.getX().toBuffer({size: 32}).length.should.equal(32)
    })
  })

  describe('#getY', function () {
    it('should return a Bn', function () {
      let p = new Point()
      ;(p.getY() instanceof Bn).should.equal(true)
    })

    it('should return 0', function () {
      let p = new Point()
      p.getY().toString().should.equal('0')
    })

    it('should be convertable to a buffer', function () {
      let p = new Point()
      p.getY().toBuffer({size: 32}).length.should.equal(32)
    })
  })

  describe('#add', function () {
    it('should get back a point', function () {
      let p1 = Point.getG()
      let p2 = Point.getG()
      let p3 = p1.add(p2)
      ;(p3 instanceof Point).should.equal(true)
    })

    it('should accurately add g to itself', function () {
      let p1 = Point.getG()
      let p2 = Point.getG()
      let p3 = p1.add(p2)
      p3.getX().toString().should.equal('89565891926547004231252920425935692360644145829622209833684329913297188986597')
      p3.getY().toString().should.equal('12158399299693830322967808612713398636155367887041628176798871954788371653930')
    })
  })

  describe('#mul', function () {
    it('should get back a point', function () {
      let g = Point.getG()
      let b = g.mul(new Bn(2))
      ;(b instanceof Point).should.equal(true)
    })

    it('should accurately multiply g by 2', function () {
      let g = Point.getG()
      let b = g.mul(new Bn(2))
      b.getX().toString().should.equal('89565891926547004231252920425935692360644145829622209833684329913297188986597')
      b.getY().toString().should.equal('12158399299693830322967808612713398636155367887041628176798871954788371653930')
    })

    it('should accurately multiply g by n-1', function () {
      let g = Point.getG()
      let n = Point.getN()
      let b = g.mul(n.sub(1))
      b.getX().toString().should.equal('55066263022277343669578718895168534326250603453777594175500187360389116729240')
      b.getY().toString().should.equal('83121579216557378445487899878180864668798711284981320763518679672151497189239')
    })

    // not sure if this is technically accurate or not...
    // normally, you should always multiply g by something less than n
    // but it is the same result in OpenSSL
    it('should accurately multiply g by n+1', function () {
      let g = Point.getG()
      let n = Point.getN()
      let b = g.mul(n.add(1))
      b.getX().toString().should.equal('55066263022277343669578718895168534326250603453777594175500187360389116729240')
      b.getY().toString().should.equal('32670510020758816978083085130507043184471273380659243275938904335757337482424')
    })

    it('should accurate multiply these problematic values related to a bug in bn.js', function () {
      // see these discussions:
      // https://github.com/bitpay/bitcore/pull/894
      // https://github.com/indutny/elliptic/issues/17
      // https://github.com/indutny/elliptic/pull/18
      // https://github.com/indutny/elliptic/pull/19
      // https://github.com/indutny/bn.js/commit/3557d780b07ed0ed301e128f326f83c2226fb679
      (function () {
        let nhex = '6d1229a6b24c2e775c062870ad26bc261051e0198c67203167273c7c62538846'
        let n = new Bn(nhex, 16)
        let g1 = Point.getG() // precomputed g
        let g2 = new Point().fromX(false, new Bn('79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 16)) // non-precomputed g
        let p1 = g1.mul(n)
        let p2 = g2.mul(n)
        let pxhex = 'd6106302d2698d6a41e9c9a114269e7be7c6a0081317de444bb2980bf9265a01'
        let pyhex = 'e05fb262e64b108991a29979809fcef9d3e70cafceb3248c922c17d83d66bc9d'
        p1.getX().toBuffer().toString('hex').should.equal(pxhex)
        p1.getY().toBuffer().toString('hex').should.equal(pyhex)
        p2.getX().toBuffer().toString('hex').should.equal(pxhex)
        p2.getY().toBuffer().toString('hex').should.equal(pyhex)
      })()
      ;(function () {
        let nhex = 'f2cc9d2b008927db94b89e04e2f6e70c180e547b3e5e564b06b8215d1c264b53'
        let n = new Bn(nhex, 16)
        let g1 = Point.getG() // precomputed g
        let g2 = new Point().fromX(false, new Bn('79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 16)) // non-precomputed g
        let p1 = g1.mul(n)
        let p2 = g2.mul(n)
        let pxhex = 'e275faa35bd1e88f5df6e8f9f6edb93bdf1d65f4915efc79fd7a726ec0c21700'
        let pyhex = '367216cb35b086e6686d69dddd822a8f4d52eb82ac5d9de18fdcd9bf44fa7df7'
        p1.getX().toBuffer().toString('hex').should.equal(pxhex)
        p1.getY().toBuffer().toString('hex').should.equal(pyhex)
        p2.getX().toBuffer().toString('hex').should.equal(pxhex)
        p2.getY().toBuffer().toString('hex').should.equal(pyhex)
      })()
    })
  })

  describe('#mulAdd', function () {
    it('should get back a point', function () {
      let p1 = Point.getG()
      let bn1 = new Bn(5)
      let p2 = Point.getG().add(p1)
      let bn2 = new Bn(6)
      p1.mulAdd(bn1, p2, bn2).getX().toString().should.equal(p1.mul(bn1).add(p2.mul(bn2)).getX().toString())
      p1.mulAdd(bn1, p2, bn2).getY().toString().should.equal(p1.mul(bn1).add(p2.mul(bn2)).getY().toString())
    })
  })

  describe('@getN', function () {
    it('should return n', function () {
      let bn = Point.getN()
      ;(bn instanceof Bn).should.equal(true)
    })
  })

  describe('@fromX', function () {
    it('should return g', function () {
      let g = Point.getG()
      let p = Point.fromX(false, g.getX())
      g.eq(p).should.equal(true)
    })
  })

  describe('#fromX', function () {
    it('should return g', function () {
      let g = Point.getG()
      let p = new Point().fromX(false, g.getX())
      g.eq(p).should.equal(true)
    })
  })

  describe('#validate', function () {
    it('should validate this valid point', function () {
      let x = new Bn().fromBuffer(new Buffer('ac242d242d23be966085a2b2b893d989f824e06c9ad0395a8a52f055ba39abb2', 'hex'))
      let y = new Bn().fromBuffer(new Buffer('4836ab292c105a711ed10fcfd30999c31ff7c02456147747e03e739ad527c380', 'hex'))
      let p = new Point(x, y)
      should.exist(p.validate())
    })

    it('should invalidate this invalid point', function () {
      let x = new Bn().fromBuffer(new Buffer('ac242d242d23be966085a2b2b893d989f824e06c9ad0395a8a52f055ba39abb2', 'hex'))
      let y = new Bn().fromBuffer(new Buffer('0000000000000000000000000000000000000000000000000000000000000000', 'hex'))
      let p = new Point(x, y)
      ;(function () {
        p.validate()
      }).should.throw('Invalid y value of public key')
    })
  })
})
