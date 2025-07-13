function ocode --wraps='ANTHROPIC_API_KEY=$AI_API_KEY AI_BASE_URL=$AI_BASE_URL opencode' --description 'alias ocode=ANTHROPIC_API_KEY=$AI_API_KEY AI_BASE_URL=$AI_BASE_URL opencode'
  ANTHROPIC_API_KEY=$AI_API_KEY AI_BASE_URL=$AI_BASE_URL opencode $argv
        
end
