# Macrobloco: pedidos, produção e expedição

Feature: `feature/orders-production`, nos dois repositórios.

## Escopo entregue

- Pedidos com PDF obrigatório (5 MB), XML obrigatório (2 MB) e até cinco anexos extras PDF/PNG/JPEG de 2 MB cada.
- Extração de número completo, chave e itens da NF-e. Pesquisa por cliente, número e chave. Quatro últimos dígitos destacados; chave completa única impede duplicar a mesma nota.
- Vínculo manual dos itens às variantes do catálogo; sugestões quando o código da nota coincide com o código interno. A API confere quantidades, descrições e unidades contra o XML.
- Instagram, Mercado Livre, WhatsApp, site oficial e presencial.
- Personalizados com detalhes, produto-base opcional, anexos do pedido, prazo do pedido e confirmação de conclusão. Eles não geram saldo de catálogo.
- Reserva automática ao cadastrar, priorizando pedidos mais antigos.
- Entrada de produção por código ou QR versionado do catálogo, escolha manual alternativa, quantidade e confirmação.
- Saldos físicos, reservados, disponíveis e faltas por variante.
- Reposição completa reservas pendentes automaticamente.
- Preparação, separação, conferência/embalagem, pronto para retirada e expedição completa. Expedição parcial bloqueada na API.
- Responsável, comentários e histórico de ações no pedido.
- Cancelamento libera reservas e redistribui saldo para pedidos pendentes.
- Livro de movimentações de entrada e saída no banco, com operador e horário.
- Fornecedores, transportadoras e portal de coleta descontinuados da navegação. Endpoints antigos respondem 410; dados históricos preservados.

## Modelo de estoque desta entrega

O saldo é consolidado por variante para a operação da empresa. Não há endereço fictício: depósitos, zonas e posições continuam pendentes de levantamento. A futura abertura por local precisará de migração/reconciliação dos saldos consolidados; não se deve somá-los duas vezes.

Reservas e baixas executam em transação PostgreSQL. Um lock transacional compartilhado serializa escritas operacionais, inclusive entre instâncias da API. Essa primeira implementação favorece consistência; a evolução para locks por variante dependerá de teste de carga. Restrições no banco impedem saldo negativo e reserva superior ao saldo físico.

A entrada usa identificador de operação para impedir duplicação por repetição da mesma requisição. O pedido usa identificador e chave da NF-e únicos. Um QR de catálogo pode ser usado várias vezes e não identifica uma caixa física única. Cada confirmação representa uma entrada; a quantidade embutida na etiqueta não é lançada automaticamente.

Produtos inativos são bloqueados. Exclusão lógica é impedida quando existem saldo ou pedidos abertos. Inativação e operações usam o mesmo lock para evitar disputa entre conferência de estado e entrada/saída.

## Acessos com os perfis atuais

| Ação | Perfis |
|---|---|
| Consultar pedidos e saldos | Administrador, gestor, comprador, estoquista, separador e auditor |
| Cadastrar/cancelar pedidos | Administrador, gestor e comprador |
| Registrar produção/concluir personalizado | Administrador, gestor e estoquista |
| Separar, conferir e expedir | Administrador, gestor, estoquista e separador |
| Comentar e atribuir responsável | Escritório e operação autorizados pelas ações acima |

As políticas agrupam permissões existentes (`purchasing.manage`, `inventory.receive`, `dispatch.manage`, `dispatch.readiness.update`). Menus não substituem validação na API.

## Atualizar cada máquina

Após receber a feature, dentro da API, com o Docker ligado:

```powershell
dotnet restore SistemaWms.sln
dotnet tool restore
dotnet ef database update --project src/Wms.Infrastructure --startup-project src/Wms.Api
dotnet run --project src/Wms.Api --launch-profile https
```

Em outro terminal, dentro de `Controle_de_estoque`:

```powershell
npm ci
npm run dev
```

Não apague volumes. A migration adiciona o schema `operations` e mantém cadastros existentes. Nenhum saldo inicial é presumido a partir do catálogo. Cadastros de produtos não representam peças produzidas.

## Roteiro de homologação

1. Registrar 6 unidades de uma variante ativa em Entrada de produção.
2. Importar XML com 10 unidades dessa mesma variante/unidade, anexar PDF e cadastrar.
3. Conferir 6 reservadas, 0 disponíveis e falta de 4.
4. Cadastrar segundo pedido e verificar que não reutiliza as 6 peças reservadas.
5. Registrar mais 4; verificar que o primeiro pedido recebe a reserva antes do segundo.
6. Iniciar separação, atribuir responsável e confirmar conferência/embalagem. Somente então marcar pronto.
7. Confirmar expedição inteira: baixar físico e reserva uma única vez.
8. Cancelar outro pedido com reserva e verificar liberação/redistribuição.
9. Testar personalizado pendente/concluído e anexos.
10. Repetir leitura de produto inativo, NF-e duplicada e tentativa de expedir parcialmente; devem ser rejeitadas.

Os testes de PostgreSQL requerem `WMS_OPERATIONS_TEST_DB` apontando exclusivamente para um banco de teste. Eles aplicam migrations e criam registros de teste, sem limpar dados anteriores. Não usar o banco de desenvolvimento ou produção nessa variável.

## Limites explícitos e próximos passos

- Importação manual de arquivos; sem integração automática com Bling, validação de assinatura fiscal ou consulta à SEFAZ. O PDF é conferido por formato; a associação visual à nota cabe ao escritório.
- Conversão de unidades/embalagens não é presumida. XML em unidade diferente da variante bloqueia cadastro até o processo ser definido.
- Prazo e anexos dos personalizados são compartilhados no pedido; discriminar no texto a qual item cada referência pertence.
- Saldo consolidado, sem lotes, endereços, inventário, ajustes ou apontamento de consumo de matéria-prima nesta entrega.
- Atualização das outras telas pelo botão Atualizar; notificações/SignalR continuam futuras.
- Lista e histórico carregados integralmente nesta versão; paginação e busca no servidor devem preceder uso de grandes volumes.
- Arquivos armazenados no PostgreSQL, com autorização no download; armazenamento externo e varredura de anexos ficam para preparação de produção.
- Testar equipamento 2D real, configuração de Enter do leitor e impressora térmica antes da implantação.
- Exclusão de usuários continua no backlog independente deste macrobloco.
