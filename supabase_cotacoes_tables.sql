-- Tabela de Cotações (com user_id para controle de acesso)
CREATE TABLE public."Cotacoes" (
    id SERIAL PRIMARY KEY,
    user_id uuid NOT NULL, -- id do usuário/agência criador (relacionado ao Supabase Auth)
    cliente_id INTEGER REFERENCES public.clientes(id),
    titulo TEXT,
    status TEXT DEFAULT 'aberta',
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Voos
CREATE TABLE public."Voos" (
    id SERIAL PRIMARY KEY,
    cotacao_id INTEGER REFERENCES public."Cotacoes"(id) ON DELETE CASCADE,
    companhia_id INTEGER REFERENCES public."CiasAereas"(id),
    numero_voo TEXT NOT NULL,
    origem TEXT,
    destino TEXT,
    data_voo DATE,
    data_embarque DATE,
    hora_embarque TIME,
    data_chegada DATE,
    hora_chegada TIME,
    duracao TEXT,
    classe TEXT,
    conexoes TEXT,
    notificacao_checkin TEXT,
    item_pessoal INTEGER DEFAULT 0,
    bagagem_mao INTEGER DEFAULT 0,
    bagagem_despachada INTEGER DEFAULT 0,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de ligação: Passageiros da Cotação
CREATE TABLE public."CotacaoPassageiros" (
    id SERIAL PRIMARY KEY,
    cotacao_id INTEGER REFERENCES public."Cotacoes"(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE CASCADE
);

-- Ativar Row Level Security na tabela de cotações
ALTER TABLE public."Cotacoes" ENABLE ROW LEVEL SECURITY;

-- Policy: só o dono pode ver/editar/excluir suas cotações
CREATE POLICY "Agencia só vê suas cotações"
  ON public."Cotacoes"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agencia só edita suas cotações"
  ON public."Cotacoes"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Agencia só deleta suas cotações"
  ON public."Cotacoes"
  FOR DELETE USING (auth.uid() = user_id);

-- (Opcional) Policy para inserir cotações apenas para si mesmo
CREATE POLICY "Agencia só insere suas cotações"
  ON public."Cotacoes"
  FOR INSERT WITH CHECK (auth.uid() = user_id); 