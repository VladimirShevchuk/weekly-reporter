var https   = require('https');
var Promise = require('promise');
var ucfirst = require('ucfirst');
var cliArgs = require('commander');

cliArgs
    .version('0.0.1')
    .option('-h, --host <s>', 'JIRA server host')
    .option('-u, --user <s>', 'JIRA username')
    .option('-p, --password <s>', 'JIRA password')
    .option('-f, --from <s>', 'Start date of the report in Y-m-d format')
    .parse(process.argv);

if (!cliArgsAreValid()) {
    return;
}

function cliArgsAreValid() {

    var valid = 1;

    if(!cliArgs.user) {
        process.stdout.write("JIRA username is required \n");
        valid = 0;
    }

    if(!cliArgs.password) {
        process.stdout.write("JIRA password is required \n");
        valid = 0;
    }

    if(!cliArgs.from) {
        process.stdout.write("Report start date is required \n");
        valid = 0;
    }

    if (!valid) {
        process.stdout.write("\n");
        process.stdout.write("Use --help option to see usage example \n");
    }

    return valid;
}

function getRequestOptions(path, method='GET', headers={}) {
    return {
        host: cliArgs.host,
        port: 443,
        auth: cliArgs.user + ':' + cliArgs.password,
        path: path,
        method: method,
        headers: headers
    };
}

var getWeeklyWorklogIds = function() {
    return new Promise(function (resolve, reject) {

        var parts = cliArgs.from.split('-');
        var date  = new Date(parts[0], parts[1]-1, parts[2]);

        var options = getRequestOptions("/rest/api/2/worklog/updated?since=" + date.getTime());

        var req = https.request(options, (res) => {

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

var getWorklogByIds = function(ids){

    return new Promise(function(resolve, reject) {

        var postData = JSON.stringify({"ids": ids});

        var options = getRequestOptions(
            "/rest/api/2/worklog/list",
            'POST',
            {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        );

        var req = https.request(options, (res) => {

            var responseBody = '';

            res.on('data', (d) => {
                responseBody += d;
            });

            res.on('end', () => {
                var json = JSON.parse(responseBody);
                var worklogs = json.filter((worklog) => {
                    return worklog.author.name === cliArgs.user
                });

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

var printReport = function(worklogs) {

    var username  = cliArgs.user.split('@')[0];
    var name      = username.split('.').map(function(e){ return ucfirst(e); });

    process.stdout.write("\n\n");
    process.stdout.write(name[0] + ' ' + name[1] + ' (40h)');
    process.stdout.write("\n\n");

    for (var worklog of worklogs) {
        process.stdout.write(worklog.comment + "\n");
    }
}

getWeeklyWorklogIds()
    .then(getWorklogByIds)
    .then(printReport);