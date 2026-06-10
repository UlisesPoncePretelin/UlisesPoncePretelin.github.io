# Portafolio — Ulises Antonio Ponce Pretelin

Sitio personal minimalista. Destaca **PoncePretelin**, gestor clínico open source para fisioterapia.

- **Sitio:** [poncepretelin.com](https://poncepretelin.com) (dominio en configuración)
- **GitHub Pages:** [ulisesponcepretelin.github.io](https://ulisesponcepretelin.github.io)
- **Demo PoncePretelin:** [poncepretelin-web.onrender.com](https://poncepretelin-web.onrender.com)

## GitHub Pages

1. Push a `main` en este repo
2. Settings → Pages → Source: branch `main`, folder `/ (root)`
3. Opcional: Settings → Pages → Custom domain → `poncepretelin.com`

## Dominio personalizado (poncepretelin.com)

En el registrador de dominio, crea estos registros DNS:

| Tipo | Host | Valor |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `UlisesPoncePretelin.github.io` |

Luego en GitHub: repo → Settings → Pages → Custom domain → `poncepretelin.com` → Save → Enable HTTPS.

## Vercel (alternativa)

Importa el repo en [vercel.com/new](https://vercel.com/new) → Framework: **Other** → añade dominio `poncepretelin.com`.

## Proyecto clínico

- [Poncepretelin v2](https://github.com/UlisesPoncePretelin/Poncepretelin)
