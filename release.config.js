module.exports = {
  branches: [
    'main',
    'next',
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'npm version --allow-same-version ${nextRelease.version} && ( cd projects/alexkunin/ngx-misc && npm version --allow-same-version ${nextRelease.version} ) && ng build @alexkunin/ngx-misc && ( cd dist/alexkunin/ngx-misc && npm publish )',
      },
    ],
    '@semantic-release/changelog',
    [
      '@semantic-release/git',
      {
        assets: [
          'projects/alexkunin/ngx-misc/package.json',
          'CHANGELOG.md',
          'package.json',
          'package-lock.json',
        ],
      },
    ],
  ],
};
