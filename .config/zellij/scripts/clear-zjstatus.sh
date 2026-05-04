#!/bin/sh

for pipe_name in "$@"; do
  zellij pipe "zjstatus::pipe::${pipe_name}::"
done
