import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(HERE, '..');
function write(root, relative, content) {
  const dest = path.join(root, 'skandi-embeds', relative);
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  fs.writeFileSync(dest, content);
}
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skandi-compile-'));
  for (const stem of ['skandi-shell','skandi-footer','skandi-mobile-nav']) {
    for (const ext of stem === 'skandi-shell' ? ['css','js'] : ['html','css','js']) {
      const relative = `global/${stem}.${ext}`;
      // Files belong to the canonical Git checkout, not this test's package.
      const current = fs.readFileSync(path.join(PACKAGE_ROOT,'skandi-embeds',relative),'utf8');
      write(root,relative,current);
    }
  }
  write(root,'global/skandi-header.html','<header id="header"><button id="clubBtn">Login</button></header>');
  write(root,'global/skandi-header.css',':root{--blue:#022e64}html,body{height:118px!important}.nav-btn{color:blue}');
  write(root,'global/skandi-header.js','const SOURCE="SKANDI_CUSTOMER_HEADER_EXPANDBAR";post("SKANDI_EMBED_RESIZE",{height:118});function post(){}');
  write(root,'home/skandi-home.html','<div id="homeContent">TEST HOME</div>');
  write(root,'home/skandi-home.css','html,body{min-height:100%}.hero{color:red}');
  write(root,'home/skandi-home.js','const SOURCE="SKANDI_HOME";function send(){};send("RESIZE_IFRAME",{height});');
  return root;
}

test('compiler assembles one document inside the Wix HTML component', () => {
  const root=fixture();
  try {
    const output = path.join(root,'dist');
    execFileSync(process.execPath,[path.join(PACKAGE_ROOT,'scripts','build-skandi-app.mjs')],{
      env:{...process.env,SKANDI_REPO_ROOT:root,SKANDI_OUTPUT_DIR:output},stdio:'pipe'
    });
    const html=fs.readFileSync(path.join(output,'home','index.html'),'utf8');
    assert.equal((html.match(/<!doctype html>/gi)||[]).length,1);
    assert.equal((html.match(/<html\b/gi)||[]).length,1);
    assert.equal((html.match(/<iframe\b/gi)||[]).length,0);
    for(const id of ['skandi-global-header-root','skandi-app-root','skandi-global-footer-root','skandi-mobile-nav-root']) {
      assert.ok(html.includes(`id="${id}"`));
    }
    assert.ok(html.includes('TEST HOME'));
    assert.ok(html.includes('data-skandi-page="home"'));
    assert.ok(!html.includes('post("SKANDI_EMBED_RESIZE",{height:118})'));
    assert.ok(!html.includes('send("RESIZE_IFRAME",{height})'));
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('missing canonical Git input blocks compilation',()=>{
  const root=fixture();
  try {
    fs.rmSync(path.join(root,'skandi-embeds/global/skandi-header.js'));
    assert.throws(()=>execFileSync(process.execPath,[path.join(PACKAGE_ROOT,'scripts','build-skandi-app.mjs')],{
      env:{...process.env,SKANDI_REPO_ROOT:root},stdio:'pipe'
    }));
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('Git workflow commits the build and does not deploy GitHub Pages',()=>{
  const workflow=fs.readFileSync(path.join(PACKAGE_ROOT,'.github/workflows/skandi-app-build.yml'),'utf8');
  assert.match(workflow,/git add -- dist\/home\/index\.html/);
  assert.match(workflow,/git push origin HEAD:main/);
  assert.doesNotMatch(workflow,/actions\/deploy-pages|actions\/upload-pages|actions\/configure-pages/);
  const receiver=fs.readFileSync(path.join(PACKAGE_ROOT,'skandi-embeds/receiver/skandi-wix-receiver.html'),'utf8');
  assert.match(receiver,/raw\.githubusercontent\.com/);
  assert.doesNotMatch(receiver,/skanditravels\.github\.io/);
});
