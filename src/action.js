var path = require('path'),
fs = require('fs');

const yaml = require('js-yaml')
const core = require('@actions/core')
const AWS = require('aws-sdk');
const { getDefaultRoleAssumerWithWebIdentity } = require("@aws-sdk/client-sts");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { S3Client, AbortMultipartUploadCommand, PutObjectCommand } = require("@aws-sdk/client-s3");


function run() {

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

    
    let releaseInfo = core.getInput('version')

    if(releaseInfo.length > 0) {
        releaseInfo = JSON.parse(core.getInput('version'))
    } else {
        releaseInfo = {
            'current' : {
                release: ''
            }
        }
    }

    returnCatalog = { 
        'version': releaseInfo['current']['release'],
        modules
    }

    console.log(returnCatalog)

    const provider = defaultProvider({
        roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity
    });

    const client = new S3Client({ credentialDefaultProvider: provider, region: 'us-east-1' });

    const paramsVer = {
        Bucket: 'triplelift-dev-backstage',
        Key: `catalog-module-${releaseInfo['current']['release']}.json`, // File name you want to save as in S3
        Body: `${JSON.stringify(returnCatalog)}`,
        ContentType: 'application/json'
    };

    const paramsLatest = {
        Bucket: 'triplelift-dev-backstage',
        Key: `catalog-module-latest.json`, // File name you want to save as in S3
        Body: `${JSON.stringify(returnCatalog)}`,
        ContentType: 'application/json'
    };


    let command = new PutObjectCommand(paramsVer);

    client.send(command).then((data) =>{
        console.log(data)
    }, 
    (error) => {
        console.log(error)
    })

    command = new PutObjectCommand(paramsLatest);

    client.send(command).then((data) =>{
        console.log(data)
    }, 
    (error) => {
        console.log(error)
    })
    
}

run()