function nv --wraps=nvim --description 'Launch nvim with API keys'
    OPENAI_API_KEY=$OPENAI_API_KEY AI_API_KEY=$AI_API_KEY AI_BASE_URL=$AI_BASE_URL nvim $argv
end
