"use strict";
let Constants = require('../lib/constants').Regtest;
let Network = require('../lib/network').inject({Constants: Constants.Network});
let should = require('chai').should();

describe('Network', function() {

  it('should satisfy this basic API', function() {
    let network = Network();
    should.exist(network);
  });

  describe('#open', function() {

    it('should open a new network and close it', function() {
      let network = Network();
      return network.open()
      .then(function() {
        should.exist(network.netstream);
        return network.close();
      })
      .then(function() {
        should.not.exist(network.netstream);
      });
    });

  });

  describe('#connect', function() {

    it('should connect to another network and send data', function() {
      let network1 = Network({port: 8551});
      let network2 = Network({port: 8552});
      let netchannel1, netchannel2;
      let datasent = new Buffer([0]);
      let datarecv;
      return network1.open()
      .then(function() {
        return network2.open();
      })
      .then(function() {
        netchannel2 = network2.awaitNetchannels().next();
        return network1.connect(network2.address());
      })
      .then(function(netchannel) {
        should.exist(netchannel);
        netchannel1 = netchannel;
        return netchannel2.value;
      })
      .then(function(netchannel) {
        should.exist(netchannel);
        netchannel2 = netchannel;
        datarecv = netchannel2.awaitBuffers().next();
        return netchannel1.send(datasent);
      })
      .then(function() {
        return datarecv.value;
      })
      .then(function(data) {
        datarecv = data;
        datarecv.toString('hex').should.equal(datasent.toString('hex'));
        return netchannel1.close();
      })
      .then(function() {
        return network1.close();
      })
      .then(function() {
        return network2.close();
      });
    });

  });

});
