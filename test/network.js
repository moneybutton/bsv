"use strict";
let Network = require('../lib/network');
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
      let netbufs1, netbufs2;
      let datasent = new Buffer([0]);
      let datarecv;
      return network1.open()
      .then(function() {
        return network2.open();
      })
      .then(function() {
        netbufs2 = network2.netbufs().next();
        return network1.connect(network2.address());
      })
      .then(function(netbufs) {
        should.exist(netbufs);
        netbufs1 = netbufs;
        return netbufs2.value;
      })
      .then(function(netbufs) {
        should.exist(netbufs);
        netbufs2 = netbufs;
        datarecv = netbufs2.buffers().next();
        return netbufs1.send(datasent);
      })
      .then(function() {
        return datarecv.value;
      })
      .then(function(data) {
        datarecv = data;
        datarecv.toString('hex').should.equal(datasent.toString('hex'));
        return netbufs1.close();
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
