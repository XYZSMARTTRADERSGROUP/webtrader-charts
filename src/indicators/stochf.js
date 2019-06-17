﻿import {uuid, toFixed} from '../common/utils.js';
import _ from 'lodash';
/*
 * Created by Mahboob.M on 2/8/16.
 */

var STOCHF = function (data, options, indicators) {
    options.fastKMaType = (options.fastKMaType || 'SMA').toUpperCase();
    options.fastDMaType = (options.fastDMaType || 'SMA').toUpperCase();
    IndicatorBase.call(this, data, options, indicators);
    this.uniqueID = [uuid(), uuid()];
    /*Fast %K = 100 SMA ( ( ( Close - Low ) / (High - Low ) ),Time Period )
    Fast %D: Simple moving average of Fast K (usually 3-period moving average)
    */
    this.stoch = new STOCH(data, { fastKPeriod: this.options.fastKPeriod,fastDPeriod: this.options.fastDPeriod, appliedTo: this.options.appliedTo }, indicators);
    this.kMa = new window[this.options.fastKMaType](this.stoch.indicatorData, { period: this.options.fastKPeriod, maType: this.options.fastKMaType }, indicators);
    this.indicatorData = this.kMa.indicatorData;
    this.kData = [];
    var _this = this;
    this.indicatorData.forEach(function (e) {
        _this.kData.push({ time: e.time, close: e.value });
    });
    this.dData = new window[options.fastDMaType](this.kData, { period: this.options.fastDPeriod, maType: this.options.fastDMaType }, indicators);
};

STOCHF.prototype = Object.create(IndicatorBase.prototype);
STOCHF.prototype.constructor = STOCHF;

STOCHF.prototype.addPoint = function (data) {
    var stoch = this.stoch.addPoint(data)[0].value;
    var kMa = this.kMa.addPoint({time:data.time , close:stoch})[0].value;
    this.indicatorData = this.kMa.indicatorData;
    var dValue = this.dData.addPoint({time:data.time , close:kMa})[0].value;
    return [{
        id: this.uniqueID[0],
        value: kMa
    }, {
        id: this.uniqueID[1],
        value: dValue
    }];
};

STOCHF.prototype.update = function (data) {
    var stoch = this.stoch.update(data)[0].value;
    var kMa = this.kMa.update({time:data.time , close:stoch})[0].value;
    this.indicatorData = this.kMa.indicatorData;
    var dValue =this.dData.update({time:data.time , close:kMa})[0].value;
    return [{
        id: this.uniqueID[0],
        value: kMa
    }, {
        id: this.uniqueID[1],
        value: dValue
    }];
};

STOCHF.prototype.toString = function () {
    return  'STOCHF (' + this.options.fastKPeriod + ', '+ this.options.fastDPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};

/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
STOCHF.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    //Prepare the data before sending a configuration
    var sochfData = [];
    this.indicatorData.forEach(function (e) {
        sochfData.push([e.time, e.value]);
    });
    var dData = [];
    this.dData.indicatorData.forEach(function (e) {
        dData.push([e.time, e.value]);
    });

    return [{
        axisConf: { // Secondary yAxis
            id: indicatorMetadata.id + '-' + this.uniqueID[0],
            title: {
                text: this.toString(),
                align: 'high',
                offset: 0,
                rotation: 0,
                y: 10,
                x: 30 + this.toString().length * 7.5
            },
            lineWidth: 2,
            plotLines: this.options.levels
        },
        seriesConf: {
            id: this.uniqueID[0],
            name: this.toString(),
            data: sochfData,
            type: 'line',
            yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
            color: this.options.stroke,
            lineWidth: this.options.strokeWidth,
            dashStyle: this.options.dashStyle,
            onChartIndicator: false
        },
        seriesConf: {
            id: this.uniqueID[1],
            name: '%D',
            data: dData,
            type: 'line',
            yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
            color: this.options.dStroke,
            lineWidth: this.options.strokeWidth,
            dashStyle: this.options.dashStyle,
            onChartIndicator: false
        }
    }];
};

/**
 * This method will return all IDs that are used to identify data series configuration
 * in the buildSeriesAndAxisConfFromData method.
 * @returns {*[]}
 */
STOCHF.prototype.getIDs = function() {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
STOCHF.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};


window.STOCHF = STOCHF;
