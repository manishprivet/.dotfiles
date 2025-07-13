function ai --wraps='OPENAI_API_KEY=$OPENAI_API_KEY codex' --description 'alias ai=OPENAI_API_KEY=$OPENAI_API_KEY codex'
  OPENAI_API_KEY=$OPENAI_API_KEY codex $argv
        
end
