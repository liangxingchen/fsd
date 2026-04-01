require('dotenv').config();

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, '\nreason:', reason);
  process.exit(1);
});

const Path = require('path');
const fs = require('fs');
const { globSync } = require('glob');
const mkdirp = require('mkdirp');

const FSD = require('../packages/fsd/src/fsd').default;
const FSAdapter = require('../packages/fsd-fs/src/index').default;
const OSSAdapter = require('../packages/fsd-oss/src/index').default;
const TOSAdapter = require('../packages/fsd-tos/src/index').default;
const VODAdapter = require('../packages/fsd-vod/src/index').default;

const adapterArg = process.argv.find((a) => a.startsWith('--adapter='));
const selected = adapterArg
  ? adapterArg.split('=')[1].split(',').map((s) => s.trim().toLowerCase())
  : null;

function shouldRun(name) {
  return !selected || selected.includes(name.toLowerCase());
}

function runCases(adapter, files) {
  for (let file of files) {
    if (file.indexOf('/') === -1) continue;
    let cases = require(Path.join(__dirname, file)).default;
    cases(FSD({ adapter }));
  }
}

{
  if (shouldRun('vod')) {
    const files = globSync('vod/*', { cwd: __dirname });
    let adapter = new VODAdapter({
      accessKeyId: process.env.VOD_KEYID,
      accessKeySecret: process.env.VOD_SECRET,
      templateGroupId: process.env.VOD_TEMPLATE_GROUP_ID,
      region: 'cn-shanghai',
      urlPrefix: process.env.VOD_URL_PREFIX,
      privateKey: process.env.VOD_PRIVATE_KEY
    });
    runCases(adapter, files);
  }
}

{
  const files = globSync('cases/*', { cwd: __dirname });

  if (shouldRun('fs')) {
    fs.rmSync('/tmp/fsd', { recursive: true, force: true });
    mkdirp.sync('/tmp/fsd');
    mkdirp.sync('/tmp/fsd-tmp');
    let adapter = new FSAdapter({
      root: '/tmp/fsd',
      urlPrefix: 'http://localhost',
      tmpdir: '/tmp/fsd-tmp'
    });
    runCases(adapter, files);
  }

  if (shouldRun('oss')) {
    let adapter = new OSSAdapter({
      accessKeyId: process.env.FILE_OSS_KEYID,
      accessKeySecret: process.env.FILE_OSS_SECRET,
      bucket: process.env.FILE_OSS_BUCKET,
      region: process.env.FILE_OSS_REGION,
      accountId: process.env.FILE_OSS_ACCOUNT,
      roleName: process.env.FILE_OSS_ROLE,
      urlPrefix: 'http://localhost',
      publicRead: true,
      root: '/fsd-test'
    });
    runCases(adapter, files);
  }

  if (shouldRun('tos')) {
    let adapter = new TOSAdapter({
      accessKeyId: process.env.TOS_KEYID,
      accessKeySecret: process.env.TOS_SECRET,
      bucket: process.env.TOS_BUCKET,
      region: process.env.TOS_REGION,
      accountId: process.env.TOS_ACCOUNT,
      roleName: process.env.TOS_ROLE,
      urlPrefix: 'http://localhost',
      publicRead: true,
      root: '/fsd-test'
    });
    runCases(adapter, files);
  }
}
