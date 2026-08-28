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

- Quando uma conta inativa tentar entrar, exibir: **“Seu perfil está inativo. Entre em contato com o seu administrador.”**
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

## Descoberta operacional da PV Company

### Endereçamento físico adiado

- Não presumir depósitos, zonas, corredores, estruturas ou endereços sem levantamento presencial ou validação formal da empresa.
- A Fase 4 permanece no roadmap, mas será iniciada somente quando a equipe tiver informações confiáveis sobre a operação física.
- Enquanto isso, priorizar funcionalidades independentes da planta: catálogo, identificação, etiquetas, fornecedores, lotes, fluxos documentais e preparação de recebimentos.
- Evitar criar um “estoque genérico” que precise ser descartado quando a implantação real definir os locais e regras operacionais.

### Fornecedores aguardando validação

- Preservar o módulo e os dados já desenvolvidos para uso futuro em compras, recebimento e NF-e.
- Manter a aba de fornecedores oculta do menu principal enquanto a necessidade não estiver validada com a PV Company.
- Não reutilizar fornecedores como transportadoras: são responsabilidades e fluxos diferentes.

## Transportadoras, expedição e prontidão de coleta

- Cadastrar transportadoras separadamente dos fornecedores.
- Criar solicitações de coleta com código interno, referência da carga, quantidade de volumes, previsão e status.
- Fluxo inicial: `Em preparação` → `Pronto para coleta` → `Coletado`, com possibilidade de cancelamento antes da coleta.
- Gerar um link aleatório e restrito por coleta para compartilhamento com a transportadora.
- O portal externo não expõe estoque, usuários, clientes ou outras coletas.
- Futuramente adicionar expiração/rotação do link, notificações SignalR, confirmação de motorista/veículo e comprovante de coleta.

## Impressão e equipamentos

- A impressão A4 serve para testes domésticos e validação visual sem impressora térmica.
- Corrigir a paginação para que múltiplas cópias sejam distribuídas em várias páginas.
- Em impressora de etiquetas, configurar no driver o tamanho real do papel e imprimir em escala de 100%, sem “ajustar à página”.
- Antes da implantação, validar tamanho da etiqueta, resolução, contraste, resistência do adesivo e distância de leitura nos equipamentos reais da empresa.

## Ciclo de vida e leitura por scanner

### Etiquetas operacionais de catálogo

- Permitir gerar uma etiqueta por variante com QR Code, código interno, produto, cor, dimensões, unidade e conteúdo do volume.
- O QR Code usa o código interno imutável como identidade principal; textos editáveis permanecem apenas na apresentação humana.
- O formato inicial do payload é versionado para permitir evolução compatível com o futuro aplicativo de scanner.
- Etiquetas de catálogo identificam a variante e o conteúdo declarado, mas ainda não representam lote, número de série ou unidade logística única.
- A identificação individual de volumes será adicionada junto aos módulos de lotes, recebimento e expedição.

### Cores corporativas

- As cores de novas variantes devem vir do catálogo administrado pela empresa, evitando variações de escrita e cadastros duplicados.
- Catálogo inicial confirmado pela fonte XML: `Cinza`, `Laranja`, `Preto` e `Azul`.
- Futuramente disponibilizar administração de cores, mantendo cores antigas vinculadas ao histórico mesmo após inativação.

### Inativação e exclusão de produtos

- Inativação bloqueia novas operações, mas mantém o produto visível nos filtros administrativos e identificável por código.
- Exclusão é lógica e auditável: o produto fica oculto do catálogo comum, sem remoção física dos registros históricos.
- Somente produtos previamente inativados podem ser excluídos.
- A exclusão exige a permissão específica `products.delete`.

### Contrato futuro do scanner

- Toda leitura deve resolver primeiro o código interno, QR Code ou código externo para uma variante e seu produto.
- Se o produto ou a variante estiver inativo, nenhuma movimentação poderá ser criada.
- A API deverá responder com um código de erro estável e a interface exibirá exatamente: **“Produto Inativado do Sistema”**.
- Produtos excluídos logicamente continuam disponíveis apenas para auditoria e resolução histórica, nunca para movimentações.
