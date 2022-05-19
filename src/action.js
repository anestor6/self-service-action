var path = require('path'),
fs = require('fs');

const yaml = require('js-yaml')
const core = require('@actions/core')
const github = require('@actions/github')

function run(){

    let returnCatalog = []
    let modules = []

    function fromDir(startPath, filter, callback) {
    
        if (!fs.existsSync(startPath)) {
            console.log("no dir ", startPath);
            return;
        }
    
        var files = fs.readdirSync(startPath);
        for (var i = 0; i < files.length; i++) {
            var filename = path.join(startPath, files[i]);
            var stat = fs.lstatSync(filename);
            if (stat.isDirectory()) {
                fromDir(filename, filter, callback); //recurse
            } else if (filter.test(filename)) callback(filename);
        };
    };
    
    fromDir('./', /self-service-catalog\.yaml$/, function(filename) {
        let fileContents = fs.readFileSync(filename, 'utf8');
        let data = yaml.load(fileContents)
        if(!data) return
        modules = [...modules, data]
    });

    console.log(typeof core.getInput('version'))
    console.log(Object.keys(core.getInput('version')))
    let releaseInfo = core.getInput('version')

    console.log(releaseInfo['current'])

    console.log(core.getInput('version'))

    returnCatalog = {
        'version': ``,
        modules
    }
    console.log(returnCatalog)


}

run()