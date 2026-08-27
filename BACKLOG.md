# Backlog do WMS Inteligente

Este arquivo registra melhorias aprovadas para implementação futura. A ordem abaixo não representa necessariamente prioridade de entrega.

## Identidade e acesso

### Persistência e encerramento da sessão

- A sessão passa a sobreviver ao recarregamento por F5 na mesma aba.
- O access token deve ser renovado automaticamente antes do vencimento enquanto o refresh token estiver válido.
- Quando a renovação não for mais possível, encerrar a sessão de forma controlada e informar que é necessário entrar novamente.
- Como endurecimento futuro, avaliar refresh token em cookie `HttpOnly`, `Secure` e `SameSite`, reduzindo a exposição do token ao JavaScript.

### Exclusão de usuários pela administração

- Adicionar ação de exclusão na tela de usuários.
- Antes da implementação, decidir entre exclusão lógica e anonimização; não realizar exclusão física se o usuário possuir vínculos de auditoria ou operações.
- Exigir confirmação explícita e permissão administrativa específica.
- Impedir a exclusão da própria conta e do último administrador.

### Mensagem específica para usuário inativo

- Quando uma conta inativa tentar entrar, exibir: **“Seu usuário está inativo. Comunique seu administrador.”**
- Manter mensagens genéricas para e-mail ou senha incorretos, evitando revelar se contas desconhecidas existem.
- Cobrir o comportamento com testes na API e no frontend.

## Catálogo de produtos — fonte XML recebida

O arquivo `Lista de Produtos em XML.md`, recebido em 27/08/2026, foi analisado como XML e será mantido fora do GitHub até a equipe decidir se os dados empresariais podem ser publicados.

Resumo da fonte:

- 2 categorias: `Montantes` e `Pares de Longarina`;
- 27 produtos-base;
- 3 modelos: `Slim`, `Mini` e `Reforçado`;
- 4 cores: `Cinza`, `Laranja`, `Preto` e `Azul`;
- 108 variantes possíveis considerando uma variante para cada cor;
- atributos dimensionais encontrados: altura, profundidade e comprimento.

Diretriz de modelagem:

- Produto-base representa categoria, tipo, modelo e dimensões.
- Variante representa a opção comercial de cor vinculada ao produto-base.
- Cada variante recebe um código interno imutável e gerado automaticamente pelo WMS.
- Referência externa e código de barras de origem são opcionais e pertencem à variante.
- Medidas devem ser armazenadas em unidade padronizada, preferencialmente milímetros, e não como textos `1m`, `60cm` ou `1,20m`.
- O XML poderá alimentar um importador idempotente após a definição da unidade de medida, política de atualização e regras das etiquetas operacionais.
