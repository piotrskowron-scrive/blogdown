/*
 * blogdown
 *
 * Copyright (c) 2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*eslint-env mocha*/
'use strict';

var assert = require('assert');
var sinon = require('sinon');
var fs = require('fs');
var processor = require('../lib/item-processor');

describe('processor', function () {

  beforeEach(function () {
    sinon.stub(fs, 'existsSync').returns(false);
    this.item = { file : { path : '' } };
  });

  afterEach(function () {
    fs.existsSync.restore();
  });

  it('adds formatted timestamps for file timestamps', function () {
    this.item.file.created  = '1970-01-01T01:00:00+01:00';
    this.item.file.modified = '1970-01-02T02:00:00+01:00';
    this.item.file.rendered = '1970-01-03T03:00:00+01:00';

    processor.process([this.item], '', {
      dates      : {
        fullDate : 'MMMM Do YYYY',
        someTime : 'HH:mm:ss'
      }
    });

    var timezoneOffSet = -1 * (new Date()).getTimezoneOffset() / 60;

    assert.equal(this.item.dates.fullDate.created, 'January 1st 1970');
    assert.equal(this.item.dates.fullDate.modified, 'January 2nd 1970');
    assert.equal(this.item.dates.fullDate.rendered, 'January 3rd 1970');
    // zero-pad, ref: https://groups.google.com/forum/#!topic/nodejs/df5UzXFAByA
    assert.equal(this.item.dates.someTime.created,
        ('0' + timezoneOffSet).slice(-2) + ':00:00');
    assert.equal(this.item.dates.someTime.modified,
        ('0' + (timezoneOffSet + 1)).slice(-2) + ':00:00');
    assert.equal(this.item.dates.someTime.rendered,
        ('0' + (timezoneOffSet + 2)).slice(-2) + ':00:00');
  });

  it('adds DRAFT for files that are marked as DRAFT', function () {
    this.item.file.created  = 'DRAFT';

    processor.process([this.item], '', {
      dates      : {
        fullDate : 'MMMM Do YYYY',
        someTime : 'HH:mm:ss'
      }
    });

    assert.equal(this.item.dates.fullDate.created, 'DRAFT');
    assert.equal(this.item.dates.fullDate.modified, 'DRAFT');
    assert.equal(this.item.dates.fullDate.rendered, 'DRAFT');
    assert.equal(this.item.dates.someTime.created, 'DRAFT');
    assert.equal(this.item.dates.someTime.modified, 'DRAFT');
    assert.equal(this.item.dates.someTime.rendered, 'DRAFT');
  });

  it('does not add timestamps if file timestamps do not exist', function () {
    processor.process([this.item], '', {
      dates      : {
        someTime : 'HH:mm:ss'
      }
    });

    assert.strictEqual(this.item.dates.someTime, undefined);
  });

  it('checks for processor.js in given path', function () {
    processor.process([], 'some/path', {});

    sinon.assert.calledOnce(fs.existsSync);
    sinon.assert.calledWith(fs.existsSync,
        process.cwd() + '/some/path/processor.js');
  });

  it('requires and calls function exported by processor.js', function () {
    fs.existsSync.returns(true);

    processor.process([this.item], 'test/fixture', {});

    assert(this.item.iWasHere);
  });

});
