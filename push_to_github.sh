#!/bin/bash
# Script untuk push ke repository https://github.com/zy-shani/My-cashier.git
# Cara pakai:
#   ./push_to_github.sh <GITHUB_TOKEN>
# atau jalankan tanpa argumen untuk input token interaktif.

TOKEN="$1"

if [ -z "$TOKEN" ]; then
  read -s -p "Masukkan GitHub Personal Access Token (PAT): " TOKEN
  echo ""
fi

if [ -z "$TOKEN" ]; then
  echo "Error: Token GitHub tidak boleh kosong."
  exit 1
fi

echo "Mengatur remote origin..."
git remote set-url origin "https://zy-shani:${TOKEN}@github.com/zy-shani/My-cashier.git"

echo "Melakukan push ke branch main..."
git push -u origin main

EXIT_CODE=$?

# Reset URL remote agar token tidak tersimpan di config git
git remote set-url origin "https://github.com/zy-shani/My-cashier.git"

if [ $EXIT_CODE -eq 0 ]; then
  echo "Berhasil melakukan push ke https://github.com/zy-shani/My-cashier!"
else
  echo "Gagal melakukan push. Pastikan Personal Access Token memiliki izin 'repo' / write."
fi

exit $EXIT_CODE
