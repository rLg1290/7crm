
ALTER TABLE cotacoes 
ADD COLUMN IF NOT EXISTS forma_pagamento text,
ADD COLUMN IF NOT EXISTS detalhes_pagamento jsonb;
