# Desplegar en Netlify (móvil)

La app ya está configurada para funcionar bien en móvil. Sigue estos pasos para publicarla en Netlify.

## Opción A: Desde la web de Netlify (recomendado)

1. **Crear cuenta** en [netlify.com](https://netlify.com) si aún no tienes.
2. **Build local:**
   ```bash
   npm run build
   ```
3. **Desplegar:** Entra en [app.netlify.com](https://app.netlify.com) → "Add new site" → "Deploy manually" → arrastra la carpeta **`dist`**.
4. Listo: obtendrás una URL como `https://random-name-123.netlify.app` que funciona en móvil.

## Opción B: Conectar con Git (deploy automático)

1. Sube el repo a GitHub/GitLab/Bitbucket.
2. En Netlify: "Add new site" → "Import an existing project" → conecta el repositorio.
3. Netlify detectará el `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Cada push a `main` hará un deploy automático.

## Opción C: CLI de Netlify

```bash
# Primera vez: instalar CLI y login
npm i -g netlify-cli
netlify login

# Desplegar
npm run build
npx netlify deploy --prod --dir=dist
```

O usa el script:
```bash
./scripts/deploy-netlify.sh   # Linux/Mac
scripts\deploy-netlify.bat    # Windows
```

---

## Optimizaciones móvil ya aplicadas

- **Viewport** adaptado a pantallas pequeñas
- **theme-color** para la barra del navegador
- **apple-mobile-web-app-capable** para añadir a la pantalla de inicio en iOS
- **SPA redirects** para que cualquier URL cargue la app
- **Cache** de assets para cargas más rápidas

## Variables de entorno (Supabase)

Si usas Supabase, configura en Netlify:

**Site settings → Environment variables** y añade:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Luego vuelve a desplegar.
