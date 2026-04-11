#!/bin/sh
set -e

mkdir -p .next/cache/images data

npx drizzle-kit push

exec node server-entry.cjs
