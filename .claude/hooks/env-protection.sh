#!/bin/bash
input=$(cat)
file_path=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null)
basename=$(basename "$file_path")
if [[ "$basename" == ".env" || "$basename" == .env.* ]]; then
    echo "Blocked: AI is not allowed to read .env files" >&2
    exit 2
fi
