/* ========================================================================
 * DBH-PG: DBH 'Class'
 * ========================================================================
 * Copyright 2014 Sapienlab
 * Licensed under MIT (https://github.com/sapienlab/dbh-pg/blob/master/LICENSE)
 * ======================================================================== */
'use strict';

var util = require('util'),
    mysql = require('mysql'),
    Promise = require('bluebird'),
    clientExtras = require('./client-extras');

/**
 * @param {Object|null} setting
 * @param {Object|null} driver the mysql instance
 */
function DBH(setting, driver) {
    if (!(this instanceof DBH)) {
        console.warn('need \'new\' to instantiate DBH');
        return new DBH(setting, driver);
    }
    this.driver = driver || mysql;
    this.setting = setting || {};
    this.poll = this.driver.createPool(this.setting);
}
DBH.constructor = DBH;

DBH.prototype.conn = function(scope) {
    var dfd = Promise.defer();
    
    this.poll.getConnection(function(err, client) {
        
        dfd.promise.bind(client);
        client.scope = scope;
        
        if (err) {
            dfd.reject(err);
        } else {
            
            client.done = client.release.bind(client);
            client.begin = clientExtras.begin.bind(client);
            client.commit = clientExtras.commit.bind(client);
            client.rollback = clientExtras.rollback.bind(client);
            client.exec = clientExtras.exec.bind(client);
            client.insert = clientExtras.insert.bind(client);
            client.update = clientExtras.update.bind(client);
            client.delete = clientExtras.delete.bind(client);
            
            dfd.resolve(client);
        }
    });
    
    return dfd.promise;
};

[
    'done',
    'begin',
    'commit',
    'rollback',
    'insert',
    'update',
    'delete'
].forEach(function(fnName) {
    DBH.prototype[fnName] = function() {
        return this[fnName].apply(this, arguments);
    }
})

module.exports = DBH;