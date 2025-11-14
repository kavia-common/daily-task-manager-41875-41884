#!/bin/bash
cd /home/kavia/workspace/code-generation/daily-task-manager-41875-41884/to_do_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

