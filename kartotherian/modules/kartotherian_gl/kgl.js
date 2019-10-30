const Promise = require('bluebird');
const Err = require('@kartotherian/err');
const checkType = require('@kartotherian/input-validator');
const styleResolve = require('kartotherian_gl_style_server/styleResolve');
const GL = require('tilelive-gl');
const tmp = require('tmp');
const fs = require('fs');

let core;

function KGL(uri, callback) {
    const self = this;
    return Promise.try(() => {
        let params = checkType.normalizeUrl(uri).query;
        if (!params.style) {
            throw new Err(`Uri must include 'style' query parameter: ${uri}`);
        }
        this.params = params;
    }).then((handler) => {
        const styleJson = JSON.stringify(styleResolve(core, this.params.style, local = true), null, 2);

        // Hack, write the content in a temp file as tilelive-gl can only read style from fs
        var tmpobj = tmp.fileSync({ postfix: '.json' });
        fs.write(tmpobj.fd, styleJson, (err) => {
            if (err) throw err;
        });

        uri.pathname = tmpobj.name;
        this.gl = new GL(uri, (err, map) => {
            if (err) throw err;
            this.source = map;
            self.map = map;
        });

        tmpobj.removeCallback();
    }).return(this).nodeify(callback);
}

KGL.prototype.getTile = function (z, x, y, callback) {
    return this.source.getTile(z, x, y, callback);
};

KGL.prototype.getInfo = function (callback) {
    return this.source.getInfo(callback);
};

KGL.initKartotherian = (cor) => {
    core = cor;
    core.tilelive.protocols['kartotherian+gl:'] = KGL;
};

module.exports = KGL;
