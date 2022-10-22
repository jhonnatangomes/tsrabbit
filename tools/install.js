#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const exec = require('child_process').execSync;
const esbuild = require('esbuild');
const destPath = `${os.homedir()}/.tsrabbit/tsrabbit`;

esbuild.build({
  entryPoints: ['./bin/index.js'],
  bundle: true,
  minify: true,
  platform: 'node',
  outfile: destPath,
});
