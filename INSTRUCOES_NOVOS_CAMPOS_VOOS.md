# Implementação de Novos Campos para Voos

## Campos Adicionados

Os seguintes campos foram adicionados à estrutura de voos para armazenar informações mais detalhadas:

### 1. **Localizador** (`localizador`)
- **Tipo**: `VARCHAR(20)`
- **Descrição**: Código localizador da reserva (ex: ABC123)
- **Uso**: Identificação única da reserva na companhia aérea

### 2. **Duração** (`duracao`)
- **Tipo**: `VARCHAR(10)`
- **Descrição**: Duração total do voo (ex: 2h30m)
- **Uso**: Tempo de voo entre origem e destino

### 3. **Número de Compra** (`numero_compra`)
- **Tipo**: `VARCHAR(50)`
- **Descrição**: Número da compra/bilhete
- **Uso**: Referência do bilhete emitido

### 4. **Abertura de Check-in** (`abertura_checkin`)
- **Tipo**: `TIMESTAMP WITH TIME ZONE`
- **Descrição**: Data e hora de abertura do check-in
- **Uso**: Informar ao cliente quando poderá fazer check-in

### 5. **Bagagem Despachada** (`bagagem_despachada`)
- **Tipo**: `INTEGER`
- **Descrição**: Quantidade de bagagem despachada
- **Uso**: Número de bagagens permitidas/incluídas
- **Valor padrão**: 0

### 6. **Bagagem de Mão** (`bagagem_mao`)
- **Tipo**: `INTEGER`
- **Descrição**: Quantidade de bagagem de mão
- **Uso**: Número de bagagens de mão permitidas
- **Valor padrão**: 0

## Passos para Implementação

### 1. **Executar Script SQL**

#### Opção A: Para banco novo (campos ainda não existem)
Execute o arquivo `adicionar_campos_voos_detalhados.sql` no Supabase SQL Editor.

#### Opção B: Para corrigir campos existentes (se já salvou como TEXT)
Execute o arquivo `corrigir_campos_bagagem_voos.sql` no Supabase SQL Editor.

### 2. **Interfaces TypeScript Atualizadas**
As interfaces `Voo` foram atualizadas nos seguintes arquivos:
- `src/pages/Cotacoes.tsx`
- `src/pages/Cotacoes_backup_2.tsx`

### 3. **Próximos Passos Recomendados**

#### A. **Atualizar Formulários de Voo**
Adicionar campos no formulário de cadastro/edição de voos:

```tsx
// Exemplo de campos para adicionar no formulário
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Localizador
    </label>
    <input
      type="text"
      value={voo.localizador || ''}
      onChange={(e) => atualizarVoo(voo.id, 'localizador', e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
      placeholder="Ex: ABC123"
    />
  </div>
  
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Duração
    </label>
    <input
      type="text"
      value={voo.duracao || ''}
      onChange={(e) => atualizarVoo(voo.id, 'duracao', e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
      placeholder="Ex: 2h30m"
    />
  </div>
</div>
```

#### B. **Atualizar Funções de Salvamento**
Modificar a função `salvarVoo` para incluir os novos campos:

```tsx
const salvarVoo = async (voo: Voo) => {
  const { data, error } = await supabase
    .from('voos')
    .insert({
      // ... campos existentes
      localizador: voo.localizador,
      duracao: voo.duracao,
      numero_compra: voo.numeroCompra,
      abertura_checkin: voo.aberturaCheckin,
      bagagem_despachada: voo.bagagemDespachada,
      bagagem_mao: voo.bagagemMao
    })
}
```

#### C. **Atualizar Exibição na Impressão**
Modificar `CotacaoPrint.tsx` para exibir os novos campos:

```tsx
// Adicionar na seção de informações do voo
{voo.localizador && (
  <div className="info-box">
    <div className="info-box-label">Localizador</div>
    <div className="info-box-value">{voo.localizador}</div>
  </div>
)}

{voo.duracao && (
  <div className="info-box">
    <div className="info-box-label">Duração</div>
    <div className="info-box-value">{voo.duracao}</div>
  </div>
)}
```

#### D. **Estrutura Sugerida para Bagagem (JSON)**

```json
{
  "bagagem_despachada": {
    "incluida": true,
    "peso_maximo": "23kg",
    "dimensoes": "158cm linear",
    "quantidade": 1,
    "observacoes": "Bagagem incluída no bilhete"
  },
  "bagagem_mao": {
    "peso_maximo": "10kg",
    "dimensoes": "55x35x25cm",
    "quantidade": 1,
    "item_pessoal": true,
    "observacoes": "Mochila pequena permitida"
  }
}
```

## Benefícios

1. **Informações Completas**: Clientes terão acesso a todos os detalhes do voo
2. **Gestão Profissional**: Demonstra organização e atenção aos detalhes
3. **Redução de Dúvidas**: Menos perguntas sobre bagagem e procedimentos
4. **Conformidade**: Atende às expectativas do mercado de viagens

## Status de Implementação

- ✅ Script SQL criado
- ✅ Interfaces TypeScript atualizadas
- ⏳ Formulários a serem atualizados
- ⏳ Funções de salvamento a serem modificadas
- ⏳ Exibição na impressão a ser implementada

## Observações

- Todos os novos campos são opcionais (`nullable`)
- Compatibilidade mantida com dados existentes
- Campos podem ser preenchidos gradualmente conforme disponibilidade das informações 