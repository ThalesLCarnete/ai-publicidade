// One-off: zera o banco de posts e os contadores de upvote no Vercel Blob.
// Uso: BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node scripts/reset-blob.mjs
//
// Escreve [] em posts-db.json e {} em votes.json (mesmas chaves/opções que
// lib/blob-store.ts e lib/votes.ts usam: addRandomSuffix:false, overwrite).
// Requer que o deploy com o manifest.json vazio já esteja no ar, senão o
// seedFromFiles repopula os posts legados na próxima leitura.

import { put } from '@vercel/blob'

const token = process.env.BLOB_READ_WRITE_TOKEN
if (!token) {
  console.error('Faltou BLOB_READ_WRITE_TOKEN no env.')
  process.exit(1)
}

const targets = [
  { key: 'ai-publicidade/posts-db.json', body: '[]' },
  { key: 'ai-publicidade/votes.json', body: '{}' },
]

for (const { key, body } of targets) {
  const res = await put(key, body, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token,
  })
  console.log('zerado:', key, '->', res.url)
}

console.log('OK — Blob zerado.')
