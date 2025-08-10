#!/usr/bin/env node
// 後処理スクリプト: .hono (一時SSG出力) を dist に統合し削除
// 目的: ユーザーが最終成果物として dist/ のみを意識できるようにする

const fs = require('fs');
const path = require('path');

const tempDir = path.resolve('.hono');
const distDir = path.resolve('dist');

if (!fs.existsSync(tempDir)) {
  process.exit(0); // 生成されていなければ終了
}

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

function syncHtml(srcDir, targetDir) {
  for (const entry of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      syncHtml(srcPath, path.join(targetDir, entry));
    } else if (srcPath.endsWith('.html')) {
      const relative = path.relative(tempDir, srcPath);
      const destPath = path.join(targetDir, relative);
      const destParent = path.dirname(destPath);
      if (!fs.existsSync(destParent)) fs.mkdirSync(destParent, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

syncHtml(tempDir, distDir);

try {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('[postbuild] Cleaned temporary .hono directory. HTML synced to dist/.');
} catch (e) {
  console.warn('[postbuild] Failed to remove .hono:', e.message);
}

// 二重 posts ディレクトリ (dist/posts/posts/*.html) を dist/posts/*.html に正規化
const maybeNested = path.join(distDir, 'posts', 'posts');
const topPosts = path.join(distDir, 'posts');
if (fs.existsSync(maybeNested) && fs.statSync(maybeNested).isDirectory()) {
  const moveRecursive = (srcDir, destDir) => {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir)) {
      const srcPath = path.join(srcDir, entry);
      const destPath = path.join(destDir, entry);
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        moveRecursive(srcPath, destPath);
      } else if (entry.endsWith('.html')) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`[postbuild] Flattened posts: ${path.relative(topPosts, destPath)}`);
      }
    }
  };
  moveRecursive(maybeNested, topPosts);
  // ネストディレクトリを削除
  fs.rmSync(maybeNested, { recursive: true, force: true });
}


fs.rmSync(path.join(distDir, 'dist'), { recursive: true, force: true });

// public/ ディレクトリを dist/ にコピー
const publicDir = path.resolve('public');
if (fs.existsSync(publicDir)) {
  function copyPublic(srcDir, destDir) {
    for (const entry of fs.readdirSync(srcDir)) {
      const srcPath = path.join(srcDir, entry);
      const destPath = path.join(destDir, entry);
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
        copyPublic(srcPath, destPath);
      } else {
        const destParent = path.dirname(destPath);
        if (!fs.existsSync(destParent)) fs.mkdirSync(destParent, { recursive: true });
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyPublic(publicDir, distDir);
  console.log('[postbuild] public/ ディレクトリを dist/ にコピーしました');
}