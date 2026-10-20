# Skate Tricks

App mobile-first, só front-end (HTML, CSS e JS puro), pra skatistas registrarem as manobras que já sabem.

**App no ar:** https://ronyabreu.github.io/skate-tricks/

## O que faz

- Cadastra manobras por categoria: **Base, Nollie, Fakie, Switch** (uma manobra pode ter várias ao mesmo tempo)
- Filtra por estilo de obstáculo: **Solo, Corrimão, Borda**
- Busca por nome
- Mostra quantas manobras você sabe no total e por categoria/estilo
- Lista ordenada da manobra mais antiga pra mais nova, pra acompanhar sua evolução
- Sem login — abre e já usa
- Exporta/importa um arquivo `.json` de backup (o nome do skatista vai junto)

## Persistência dos dados

Os dados ficam salvos no **IndexedDB do navegador**, local, sem servidor. Isso significa:

- Sobrevive a recarregar a página, fechar a aba ou o navegador
- **Não** sobrevive a: limpar dados de navegação do navegador, usar modo anônimo, trocar de navegador/aparelho, ou (no Safari/iOS) ficar muito tempo sem abrir o app
- Por isso tem **Exportar/Importar**: use de vez em quando pra ter um backup seguro

## Rodando localmente

Qualquer servidor estático serve. Exemplo:

```bash
python -m http.server 8420
```

Depois abre `http://localhost:8420`.

## Stack

HTML, CSS e JavaScript puro, sem build, sem framework. Persistência via IndexedDB (`db.js`). Deploy via GitHub Pages.
