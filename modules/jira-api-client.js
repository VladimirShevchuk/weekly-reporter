var https   = require('https');
var Promise = require('promise');

var Client = function(connectionOptions) {
   this.connectionOptions = connectionOptions;
}

Client.prototype.getTempoWorklogsAsync = function(since) {

    var connectionOptions = Object.assign(
        {
            'path': "/rest/tempo-timesheets/3/worklogs/?dateFrom=" + since,
            'method': 'GET'
        },
        this.connectionOptions
    );

    return new Promise(function (resolve, reject) {

        var req = https.request(connectionOptions, (res) => {

            var responseBody = '';

            res.on('data', (d) => {
                responseBody += d;
            });

            res.on('end', () => {
                var json = JSON.parse(responseBody);

                resolve(json);
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

Client.prototype.getUpdatedWorklogIdsAsync = function(since) {

    var dateParts = since.split('-');
    var date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    var connectionOptions = Object.assign(
        {
            'path': "/rest/api/2/worklog/updated?since=" + date.getTime(),
            'method': 'GET'
        },
        this.connectionOptions
    );

    return new Promise(function (resolve, reject) {

        var req = https.request(connectionOptions, (res) => {

            var responseBody = '';

            res.on('data', (d) => {
                responseBody += d;
            });

            res.on('end', () => {
                var json = JSON.parse(responseBody);
                var ids = [];
                for (var worklog of json.values) {
                    ids.push(worklog.worklogId);
                }

                resolve(ids);
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

Client.prototype.getWorklogByIdsAsync = function(ids){

    var postData = JSON.stringify({"ids": ids});

    var connectionOptions = Object.assign(
        {
            'path': "/rest/api/2/worklog/list",
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        },
        this.connectionOptions
    );

    return new Promise(function(resolve, reject) {

        var req = https.request(connectionOptions, (res) => {

            var responseBody = '';

            res.on('data', (d) => {
                responseBody += d;
            });

            res.on('end', () => {
                var worklogs = JSON.parse(responseBody);


                resolve(worklogs);
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

module.exports = Client;

