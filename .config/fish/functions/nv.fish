function nv --wraps='OPENAI_API_KEY=$OPENAI_API_KEY nvim' --description 'alias nv=OPENAI_API_KEY=$OPENAI_API_KEY nvim'
  OPENAI_API_KEY=$OPENAI_API_KEY nvim $argv
        
end
