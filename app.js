var https   = require('https');
var ucfirst = require('ucfirst');
var cliArgs = require('commander');
var JiraClient = require('./modules/jira-api-client');

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

function getConnectionOptions() {
    return {
        host: cliArgs.host,
        port: 443,
        auth: cliArgs.user + ':' + cliArgs.password,
    };
};

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

var isOwnWorklog = function(worklog) {
    return worklog.author.name === cliArgs.user
}

var client = new JiraClient(getConnectionOptions());
client.getUpdatedWorklogIdsAsync(cliArgs.from)
    .then(function(worklogIds){return client.getWorklogByIdsAsync(worklogIds);})
    .then(function(worklogs){return worklogs.filter(isOwnWorklog)})
    .then(printReport);