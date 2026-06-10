# Portafolio — Ulises Ponce Pretelin

Sitio para concurso MiduDev / revisión de proyectos. Destaca **PoncePretelin** con el detalle clínico-técnico que no se ve solo mirando la UI.

## Deploy en Vercel (recomendado para el concurso)

1. Sube este repo a GitHub (`poncepretelin.github.io` o `portfolio-midudev`)
2. Entra a [vercel.com/new](https://vercel.com/new)
3. Importa el repo → Framework: **Other** → Deploy
4. URL tipo: `https://tu-proyecto.vercel.app`

## GitHub Pages

Settings → Pages → Source: branch `main`, folder `/ (root)`.

## Enlace al código del proyecto

- [clinical-system](https://github.com/poncepretelin/clinical-system) — gestor clínico completo

## Autenticación GitHub CLI

El login en github.com **no** autentica `gh` en terminal. Ejecuta:

```powershell
gh auth login
```

Luego, desde el proyecto clínico:

```powershell
.\scripts\publish-github.ps1
```
