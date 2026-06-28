# Libro de ventas

App web estática (un solo `index.html`, sin build ni backend) para registrar ventas y
agregarlas como filas a un archivo de **Excel en OneDrive** usando la **Microsoft Graph API**.
El login se hace con **MSAL.js** (OAuth en el navegador, flujo SPA con PKCE). No hay servidor
ni claves secretas: solo se usa el **Client ID público** de la app registrada en Azure.

## Campos de la venta

| Campo     | Detalle                                            |
|-----------|----------------------------------------------------|
| Fecha     | Fecha de la venta (por defecto, hoy)               |
| Producto  | Descripción del producto                           |
| Cantidad  | Unidades vendidas                                  |
| Precio    | Precio **unitario**                                |
| Cliente   | Nombre del cliente                                 |
| Pago      | Opcional: **"Seña"** o **"Pago completo"**         |

La app además calcula y guarda una columna **Total** (Cantidad × Precio), así que la tabla
de Excel debe tener las columnas en este orden:

```
Fecha | Producto | Cantidad | Precio | Cliente | Pago | Total
```

> Si no querés la columna Total, eliminá su valor en `index.html` (función `onSubmit`,
> el último elemento del array `row`) y la columna de la tabla.

---

## 1. Preparar el Excel en OneDrive

1. Creá un archivo de Excel en tu OneDrive, por ejemplo `libro-de-ventas.xlsx`.
2. Escribí los encabezados en la primera fila:
   `Fecha | Producto | Cantidad | Precio | Cliente | Pago | Total`.
3. Seleccioná esas celdas y convertilas en **Tabla** (Insertar › Tabla, con "La tabla tiene encabezados").
4. Ponele un **nombre a la tabla** (Diseño de tabla › Nombre de la tabla), por ejemplo `Ventas`.
   Ese nombre es el que vas a usar en la configuración de la app.
5. Anotá la **ruta del archivo** dentro de tu OneDrive (ej: `/Documentos/libro-de-ventas.xlsx`).

---

## 2. Registrar la app en Azure (Microsoft Entra ID)

1. Entrá a <https://portal.azure.com> › **Microsoft Entra ID** › **Registros de aplicaciones** › **Nuevo registro**.
2. Nombre: `Libro de ventas` (el que quieras).
3. Tipos de cuenta admitidos: **Cuentas en cualquier directorio organizativo y cuentas personales de Microsoft** (lo más flexible).
4. En **URI de redirección**, elegí plataforma **Single-page application (SPA)** y dejá la URL
   por ahora vacía o con `http://localhost:8000/` para pruebas locales (se ajusta luego, ver paso 5).
5. Creá el registro y copiá el **Client ID (ID de aplicación)** que aparece en la página de resumen.
6. Permisos de API: **Permisos de API › Agregar un permiso › Microsoft Graph › Permisos delegados**, y agregá:
   - `Files.ReadWrite.All`  ← necesario para que los socios escriban en el Excel del dueño (archivo compartido)
   - `User.Read`

   Estos permisos delegados **no** requieren consentimiento de administrador.

> Es una app **client-side**: el Client ID es público y va en el código. **No** se usa client secret.

---

## 3. Configurar la app (botón ⚙)

Abrí la app y tocá el botón **⚙** (arriba a la derecha). Completá:

- **Client ID**: el ID de aplicación copiado de Azure.
- **Ruta del Excel en OneDrive**: ej. `/Documentos/libro-de-ventas.xlsx` (relativa a la raíz de tu OneDrive).
- **Nombre de la tabla**: el que le pusiste en Excel, ej. `Ventas`.

La configuración se guarda en el `localStorage` de tu navegador (no se sube a ningún lado).
Al cambiar el Client ID la app se recarga para reinicializar el login.

Después, **Iniciar sesión con Microsoft**, aceptá los permisos, y ya podés registrar ventas.

---

## 3.b. Varios usuarios escribiendo en el mismo Excel (dueño + socios)

El archivo vive en el OneDrive del **dueño**. Para que los socios escriban en **ese mismo
archivo** (no en el suyo), la app lo direcciona por su **ID fijo** (`driveId` + `itemId`), no por
"mi OneDrive". El flujo es:

**Dueño (una sola vez):**
1. Compartí el Excel con cada socio dándole permiso de **edición** (en OneDrive: botón Compartir →
   agregá sus correos → "Puede editar"). Todos deben ser cuentas del mismo tenant (la ORT).
2. En la app: cargá el **Client ID**, **iniciá sesión**, abrí ⚙, escribí la **ruta del Excel** y
   el **nombre de la tabla**, y tocá **"Localizar"**. La app guarda el `driveId`/`itemId` del archivo.
3. Tocá **"Copiar código para mis socios"** y mandales ese código (WhatsApp, mail, etc.).

**Cada socio (una sola vez):**
1. Abrí la app (la URL de GitHub Pages), abrí ⚙, pegá el código en **"Código de configuración"**
   y tocá **"Importar"**. La app se recarga.
2. **Iniciá sesión** con tu cuenta de la ORT y aceptá los permisos. Listo: ya podés registrar
   ventas en el Excel del dueño.

> Nota: si un socio ve un error `403 / accessDenied` al guardar, es porque el dueño todavía no le
> compartió el archivo con permiso de edición (paso 1 del dueño).

---

## 4. Probar localmente (opcional)

Como MSAL necesita un origen real, serví la carpeta con un server estático:

```bash
# Python
python -m http.server 8000
# o Node
npx serve .
```

Entrá a `http://localhost:8000/` y **registrá esa misma URL** (`http://localhost:8000/`) como
URI de redirección SPA en Azure (paso 2.4).

---

## 5. Deploy a GitHub Pages

```bash
git init
git add .
git commit -m "App de registro de ventas con sync a Excel/OneDrive"
git branch -M main
```

Crear el repo y pushear:

- **Con GitHub CLI (`gh`):**
  ```bash
  gh repo create libro-de-ventas --public --source=. --push
  ```

- **Manual:** creá el repo `libro-de-ventas` en <https://github.com/new> (público, sin README), y:
  ```bash
  git remote add origin https://github.com/<usuario>/libro-de-ventas.git
  git push -u origin main
  ```

Activar Pages: en el repo, **Settings › Pages › Source = `main` / root** › Save.
A los pocos segundos tu app estará en:

```
https://<usuario>.github.io/libro-de-ventas/
```

---

## ⚠️ Detalle crítico del deploy: la URI de redirección

La app usa `redirectUri = origin + pathname`. En GitHub Pages eso resuelve a:

```
https://<usuario>.github.io/libro-de-ventas/
```

Esa **URL exacta, con la barra final `/`**, es la que tenés que registrar como **URI de
redirección (SPA)** en Azure (Registro de la app › Autenticación › Single-page application).

- Entrá **siempre** por la URL terminada en `/` para que el login funcione
  (`.../libro-de-ventas/`, no `.../libro-de-ventas`).
- Si Azure rechaza la redirección (`AADSTS50011` u otro error de redirect URI), verificá que la
  URI registrada coincida **carácter por carácter** con la barra de direcciones: protocolo
  `https`, mayúsculas/minúsculas, y la barra final.

Podés tener varias URIs de redirección registradas a la vez (ej. `http://localhost:8000/` para
desarrollo y la de GitHub Pages para producción).

---

## Stack / restricciones

- Sin frameworks, sin bundler, sin dependencias instaladas: **HTML + CSS + JS vanilla**.
- **MSAL.js por CDN** (`msal-browser` 2.x).
- App 100% client-side: en el repo solo va el **Client ID público**, nunca secretos ni backend.

## Licencia

[MIT](LICENSE)
