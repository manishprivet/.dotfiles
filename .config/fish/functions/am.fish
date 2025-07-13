function am --wraps='AMP_API_KEY=$AMP_API_KEY amp' --description 'alias am=AMP_API_KEY=$AMP_API_KEY amp'
  AMP_API_KEY=$AMP_API_KEY amp $argv
        
end
