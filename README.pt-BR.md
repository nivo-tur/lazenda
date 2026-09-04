<div align="center">

# Lazenda

**CRM open source construído em torno da próxima ação.**

Saiba quem precisa de atenção.<br>
Saiba em que ponto está cada relacionamento.<br>
Saiba o que fazer a seguir.

[English](README.md) · [Português](README.pt-BR.md) · [Español](README.es.md)

[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-2f6f4e)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3fcf8e?logo=supabase&logoColor=white)

</div>

Lazenda é um CRM open source para startups e equipes pequenas, construído a partir de uso operacional real.

A maioria dos CRMs é projetada para manter os registros corretos. O Lazenda também é projetado para manter o trabalho em movimento.

No centro do produto está uma pergunta simples:

> **O que devo fazer a seguir?**

## Prévia do produto

![Visão Hoje do Lazenda com ações atrasadas, atuais e próximas](docs/images/lazenda-preview.png)

## Por que Lazenda

Muitos CRMs respondem: “O que sabemos sobre este relacionamento?”. O Lazenda também pergunta: “O que precisa acontecer a seguir?”.

O produto conecta um ciclo operacional simples:

**Relacionamento → Próxima ação → Movimento → Histórico → Aprendizado**

O Lazenda reúne essas etapas em um único fluxo operacional. O foco atual está no início desse ciclo: tornar relacionamentos, posição no pipeline e próximas ações claros o suficiente para orientar o trabalho diário.

## Produto atual

As funcionalidades abaixo estão disponíveis hoje.

### Hoje

- Separa negócios atrasados, ações para hoje e próximas ações.
- Apoia a priorização operacional do dia a dia.
- Permite concluir a ação atual e definir a próxima ação e sua data.
- Exibe contexto relevante do negócio, incluindo valor potencial e atalho para WhatsApp quando disponível.

### Pipeline

- Visualização Kanban nas etapas comerciais atuais.
- Drag and drop entre etapas, com persistência no Supabase.
- Busca por negócio ou contato e filtros por etapa, município, distrito e situação de atenção.
- Cards com próxima ação, data, valor potencial e atalho para WhatsApp.

### Gestão de negócios

- Cadastro, visualização, edição e exclusão de negócios.
- Armazenamento de nome do negócio, contato, WhatsApp, município, distrito, origem, observações, valor potencial, próxima ação e data.

### Estrutura de localização

- Seleção estruturada de município e distrito.
- Distritos associados ao respectivo município.

### Persistência

- Dados de negócios e localizações são lidos e gravados no Supabase.
- PostgreSQL é o banco de dados subjacente.

Autenticação, suporte multiusuário, histórico completo, automações, IA, API pública e webhooks **não são funcionalidades atuais**. Consulte o [roadmap](#roadmap) para ver trabalhos planejados e exploratórios.

## Princípios do produto

- **Ação acima de administração.** O CRM deve ajudar alguém a agir, não apenas manter registros.
- **Todo relacionamento aberto deve ter uma próxima ação.** Movimento começa com uma ação e uma data claras.
- **Simples antes de sofisticado.** Complexidade só deve ser adicionada quando o uso real provar que ela é necessária.
- **Clareza operacional acima da burocracia de CRM.** O trabalho importante deve ser fácil de identificar e avançar.
- **Uso real antes da expansão de funcionalidades.** Decisões de produto devem partir de fluxos práticos.
- **Código aberto, dados privados.** O software pode ser público enquanto credenciais e dados operacionais permanecem protegidos.

## Status do projeto

> **O Lazenda está em desenvolvimento ativo.**

O produto está sendo usado e desenvolvido de forma iterativa. O schema do banco, APIs internas, processo de configuração e funcionalidades podem mudar. O repositório ainda não inclui migrations reproduzíveis, autenticação ou políticas documentadas de Row Level Security.

Não use o Lazenda em cargas críticas de produção sem uma revisão de segurança independente e uma configuração adequada de Supabase Auth e RLS.

## Roadmap

Tudo abaixo é roadmap — não uma descrição das funcionalidades atuais. A ordem é direcional, não representa compromisso de prazo e pode mudar conforme o aprendizado com o uso real.

### Agora

- Fundação open source
- Autenticação
- Gerenciamento de sessão
- Rotas protegidas
- RLS e segurança no Supabase

### Próximos passos

- Modelo de eventos comerciais e histórico
- Dashboard e métricas confiáveis

### Mais adiante

- Visão 360 do negócio
- Diagnóstico e fluxo estruturados
- Acompanhamento de clientes e resultados
- Inteligência territorial
- Automações úteis

### Em exploração

- Pipelines e campos personalizados
- Workspaces
- Importação e exportação
- API pública e webhooks
- Integrações
- Fluxos assistidos por IA

## Primeiros passos

### Pré-requisitos

- Git
- Uma versão LTS compatível do Node.js
- npm
- Um projeto Supabase

### 1. Clone o repositório

```bash
git clone https://github.com/nivo-tur/lazenda.git
cd lazenda
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o ambiente

```bash
cp .env.example .env.local
```

Adicione a URL do projeto Supabase e a Publishable Key ao `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Nunca coloque uma Secret Key ou chave `service_role` do Supabase em uma variável `NEXT_PUBLIC_*`. Tudo que tem o prefixo `NEXT_PUBLIC_` fica disponível para o código executado no navegador.

### 4. Configure o Supabase

O repositório ainda não contém migrations ou um schema reproduzível para os dados necessários de `businesses` e `locations`. A configuração do banco ainda está sendo documentada; não invente nem deduza tabelas de produção a partir do código do aplicativo.

### 5. Execute localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | :---: | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase utilizada pelo client no navegador. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Publishable Key do Supabase utilizada pelo client conforme o modelo de segurança do Supabase. |

Publishable Keys são destinadas ao uso no cliente quando o acesso ao banco está protegido adequadamente. Secret Keys e chaves `service_role` ignoram ou elevam acessos e nunca devem ser expostas via `NEXT_PUBLIC_*`, enviadas ao navegador ou commitadas.

## Arquitetura

A aplicação atual possui um caminho direto de dados entre navegador e Supabase:

```text
Navegador
  ↓
Aplicação Next.js
  ↓
Client JavaScript do Supabase
  ↓
Supabase / PostgreSQL
```

Isso torna Supabase Auth e RLS essenciais antes do uso em produção. Esses controles fazem parte do roadmap atual de segurança, não são funcionalidades concluídas.

## Estrutura do projeto

```text
app/          Página no App Router, views, formulários e UI do produto
lib/          Integrações compartilhadas, atualmente o client do Supabase
public/       Arquivos estáticos servidos pelo Next.js
docs/images/  Reservado para imagens da documentação pública
```

## Desenvolvimento

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o servidor local de desenvolvimento do Next.js. |
| `npm run build` | Cria uma build de produção. |
| `npm run start` | Serve uma build de produção criada anteriormente. |
| `npm run lint` | Executa o ESLint. |

No momento não há um script separado para verificação de tipos.

## Segurança

**Código público não significa dados públicos.** O Lazenda pretende combinar código-fonte público com credenciais privadas, banco protegido e dados operacionais privados.

Leia o [SECURITY.md](SECURITY.md) antes de relatar uma vulnerabilidade ou configurar um deploy. Autenticação e RLS continuam sendo trabalhos de segurança necessários; este repositório ainda não deve ser considerado seguro para produção por padrão.

## Como contribuir

Issues, sugestões e pull requests são bem-vindos. Como o projeto ainda está no início, discuta mudanças substanciais em uma issue antes de investir na implementação. Mantenha contribuições focadas, não inclua dados reais de clientes ou produção e diferencie claramente o comportamento atual de funcionalidades propostas.

## Open source e Nivo

O Lazenda é open source e atualmente é desenvolvido a partir de uso operacional real na Nivo. A Nivo é o ambiente operacional inicial, mas o objetivo de longo prazo é tornar o núcleo útil para além de uma única organização.

Este repositório documenta o produto — não processos privados, informações comerciais ou dados operacionais da Nivo.

## Licença

Licenciado sob a [Licença MIT](LICENSE).
