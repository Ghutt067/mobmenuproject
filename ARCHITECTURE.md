# Arquitetura do Site - Documentação de Estrutura e Personalização

Este documento descreve a estrutura atual do site e os requisitos futuros para o sistema de personalização.

## 📋 Estrutura Geral

O site é uma aplicação React com TypeScript que utiliza:
- **React Router** para navegação
- **Supabase** como backend (banco de dados)
- Componentes modulares e reutilizáveis
- Context API para gerenciamento de estado (Cart, Search)

---

## 🎨 Componentes Principais

### 1. Header (`src/components/Header.tsx`)

#### Estrutura Atual:
- **Logo**: Imagem centralizada (`fequeijaologo.png`)
  - Localização: `src/assets/fequeijaologo.png`
  - Classe CSS: `.logo-image`
  - Renderizado dentro de `.logo-container`
  
- **Ícone de Pesquisa**: Botão no canto superior direito
  - Ícone: `search-alt-2-svgrepo-com.svg`
  - Classe CSS: `.search-btn` e `.icon`
  - **IMPORTANTE**: Este ícone NÃO muda quando a imagem do logo é alterada
  
- **Ícone de Menu**: Botão no canto superior esquerdo
  - Ícone: `menu-svgrepo-com.svg`
  - Classe CSS: `.menu-btn` e `.icon`
  - **IMPORTANTE**: Este ícone NÃO muda quando a imagem do logo é alterada

#### Requisitos Futuros de Personalização:
- ✅ **Logo do Header**:
  - Permitir upload/alterar imagem do logo
  - Manter proporções e responsividade
  - Suportar diferentes formatos (PNG, JPG, SVG)
  
- ✅ **Ícones de Pesquisa e Menu**:
  - **NÃO devem ser alterados** quando o logo for personalizado
  - Devem permanecer fixos e funcionais independentemente da personalização do logo

#### Estrutura de Dados Sugerida (Futuro):
```typescript
interface HeaderCustomization {
  logoImage: string; // URL ou path da imagem
  logoAlt: string; // Texto alternativo
  // Ícones de pesquisa e menu permanecem fixos
}
```

---

### 2. PromoBanner (`src/components/PromoBanner.tsx`)

#### Estrutura Atual:
- **Texto**: "ESQUENTA BLACK FRIDAY - ATÉ 60%OFF"
  - Renderizado em `<p className="promo-text">`
  - Estilizado com gradiente animado de cores
  
- **Cores Atuais**:
  - Background: `#FDD8A7` (cor de fundo)
  - Texto: Gradiente animado (preto → marrom → preto)
  - Animação: `color-shift` (8s ease-in-out infinite)

#### Requisitos Futuros de Personalização:
- ✅ **Visibilidade do Banner**:
  - Opção para mostrar/esconder o banner
  - Toggle on/off
  
- ✅ **Texto do Banner**:
  - Editor de texto para modificar o conteúdo
  - Suporte a texto customizado
  
- ✅ **Cores do Banner**:
  - Cor de fundo (background-color) personalizável
  - Cor do texto personalizável
  - Opção de manter ou remover animação de gradiente
  
- ✅ **Estilo do Banner**:
  - Tamanho da fonte
  - Padding/margens
  - Alinhamento do texto

#### Estrutura de Dados Sugerida (Futuro):
```typescript
interface PromoBannerCustomization {
  isVisible: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  useGradient: boolean; // Se true, usa gradiente animado
  gradientColors?: string[]; // Cores do gradiente se useGradient = true
  fontSize?: string;
  padding?: string;
  textAlign?: 'left' | 'center' | 'right';
}
```

---

### 3. Seções de Produtos (`src/pages/Home.tsx`)

#### Estrutura Atual:
- **Seções Organizadas por Sets**:
  - Cada seção tem um título (ex: "OS MAIS PEDIDOS:")
  - Título renderizado em `<h2 className="section-title">`
  - Produtos organizados em grid (2 colunas)
  
- **Estrutura de Dados**:
  - `Set`: Conjunto de produtos com nome e ordem de exibição
  - `Subset`: Subconjunto dentro de um Set
  - `Product`: Produto individual com todas as informações

- **Produtos**:
  - Cada produto tem:
    - `id`: Identificador único
    - `image`: Nome da imagem
    - `title`: Título do produto
    - `description1`: Primeira linha de descrição
    - `description2`: Segunda linha de descrição
    - `oldPrice`: Preço anterior (opcional, para desconto)
    - `newPrice`: Preço atual
    - `hasDiscount`: Calculado automaticamente
    - `fullDescription`: Descrição completa (opcional)
    - `setId`: ID do conjunto ao qual pertence
    - `subsetId`: ID do subconjunto (opcional)

#### Requisitos Futuros de Personalização:

##### 3.1. Gerenciamento de Seções:
- ✅ **Adicionar Seções**:
  - Criar novas seções com nome customizado
  - Definir ordem de exibição
  
- ✅ **Remover Seções**:
  - Deletar seções existentes
  - Soft delete (marcar como inativo)
  
- ✅ **Modificar Seções**:
  - Alterar nome/título da seção
  - Reordenar seções (mudar `displayOrder`)
  - Ativar/desativar seção

##### 3.2. Gerenciamento de Produtos:
- ✅ **Adicionar Produtos**:
  - Upload de imagem do produto
  - Definir título, descrições
  - Definir preços (antigo e novo)
  - Associar produto a uma seção/subseção
  - Definir ordem de exibição dentro da seção
  
- ✅ **Remover Produtos**:
  - Deletar produtos (soft delete)
  - Remover produto de uma seção
  
- ✅ **Modificar Produtos**:
  - Alterar imagem do produto
  - Editar título e descrições
  - Modificar preços (preço antes e depois)
  - Mover produto entre seções
  - Reordenar produtos dentro da seção
  
- ✅ **Escolher Produtos por Seção**:
  - Interface para selecionar quais produtos aparecem em cada seção
  - Drag-and-drop para reordenar
  - Filtros e busca para encontrar produtos

#### Estrutura de Dados Atual (Banco de Dados):
```typescript
// Tabela: sets
interface Set {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

// Tabela: subsets
interface Subset {
  id: string;
  set_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

// Tabela: products
interface Product {
  id: string;
  image: string;
  title: string;
  description1: string;
  description2: string;
  old_price: string; // Opcional
  new_price: string;
  has_discount: boolean; // Calculado automaticamente
  full_description?: string;
  set_id?: string;
  subset_id?: string;
  display_order: number;
  is_active: boolean;
  force_buy_button?: boolean;
}
```

---

## 🔄 Fluxo de Dados

### Carregamento de Produtos:
1. `Home.tsx` chama `getProductsGrouped()` do `productService.ts`
2. `productService.ts` busca dados do Supabase:
   - Busca `sets` ativos ordenados por `display_order`
   - Busca `subsets` ativos ordenados por `display_order`
   - Busca `products` ativos ordenados por `display_order`
3. Organiza produtos em estrutura hierárquica (Set → Subset → Products)
4. Renderiza seções na Home com títulos e produtos

### Renderização:
- Cada `Set` vira uma seção com título `<h2 className="section-title">`
- Produtos são renderizados em grid usando `ProductCard` component
- Se não há sets, usa fallback "OS MAIS PEDIDOS:"

---

## 🎯 Considerações para Implementação Futura

### 1. Sistema de Personalização:
- Criar interface administrativa para personalização
- Armazenar configurações de personalização no banco de dados
- Criar tabelas para:
  - `site_customization` (header, banner, etc.)
  - Manter estrutura atual de `sets`, `subsets`, `products`

### 2. Componentes que Precisam ser Flexíveis:
- **Header**: Aceitar logo customizado via props ou context
- **PromoBanner**: Aceitar configurações via props
- **Home**: Já flexível, usa dados do banco dinamicamente

### 3. Backward Compatibility:
- Manter valores padrão caso personalização não esteja configurada
- Garantir que ícones de pesquisa e menu sempre funcionem
- Manter estrutura de dados atual funcionando

### 4. Performance:
- Cache de configurações de personalização
- Lazy loading de imagens customizadas
- Otimização de queries do banco de dados

---

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── Header.tsx          # Header com logo, pesquisa e menu
│   ├── Header.css
│   ├── PromoBanner.tsx     # Banner promocional
│   ├── PromoBanner.css
│   └── ProductCard.tsx     # Card de produto individual
├── pages/
│   └── Home.tsx             # Página principal com seções de produtos
├── services/
│   └── productService.ts    # Serviços para buscar produtos do Supabase
├── contexts/
│   ├── CartContext.tsx      # Context do carrinho
│   └── SearchContext.tsx    # Context de pesquisa
└── lib/
    └── supabase.ts          # Configuração do Supabase
```

---

## ✅ Checklist de Personalização Futura

### Header:
- [ ] Upload de logo customizado
- [ ] Preview do logo antes de salvar
- [ ] Validação de formato e tamanho de imagem
- [ ] Manter ícones de pesquisa e menu fixos

### PromoBanner:
- [ ] Toggle mostrar/esconder banner
- [ ] Editor de texto do banner
- [ ] Seletor de cor de fundo
- [ ] Seletor de cor de texto
- [ ] Opção de gradiente animado
- [ ] Preview em tempo real

### Seções de Produtos:
- [ ] CRUD completo de seções
- [ ] Reordenação de seções (drag-and-drop)
- [ ] CRUD completo de produtos
- [ ] Upload de imagens de produtos
- [ ] Editor de preços (antes/depois)
- [ ] Associar produtos a seções
- [ ] Reordenação de produtos dentro de seções
- [ ] Interface de seleção de produtos por seção

---

## 📝 Notas Importantes

1. **Ícones Fixos**: Os ícones de pesquisa e menu NÃO devem ser alterados quando o logo for personalizado. Eles são elementos funcionais que devem permanecer consistentes.

2. **Cálculo de Desconto**: O `hasDiscount` é calculado automaticamente pela função `calculateHasDiscount()` baseado na comparação entre `oldPrice` e `newPrice`. Não precisa ser armazenado manualmente.

3. **Soft Delete**: Produtos e seções usam `is_active: false` para soft delete, mantendo histórico no banco de dados.

4. **Ordem de Exibição**: Tudo é ordenado por `display_order` (ascendente), permitindo controle total da ordem de exibição.

5. **Estrutura Hierárquica**: Produtos podem pertencer diretamente a um Set ou a um Subset dentro de um Set. Isso permite organização flexível.

---

**Última atualização**: Documento criado para referência futura do sistema de personalização.

