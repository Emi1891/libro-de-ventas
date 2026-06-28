# Libro de ventas

App web estática (un solo `index.html`, sin build) para registrar ventas. Cada venta se manda a
un **Google Apps Script** que la agrega como fila a una **Google Sheet**.

La gracia de este diseño: **tus socios NO se loguean ni comparten contraseña**. El Apps Script
corre bajo **tu** cuenta de Google y es el único que escribe en la planilla. Tus socios solo abren
la web y cargan la venta. No hay secretos en el navegador (la credencial vive del lado de Google).

```
Cualquiera abre la web  →  carga la venta  →  POST al Apps Script
                                                    │  (corre como VOS)
                                                    ▼
                                         agrega la fila a tu Google Sheet
```

## Campos de la venta

| Campo     | Detalle                                            |
|-----------|----------------------------------------------------|
| Fecha     | Fecha de la venta (por defecto, hoy)               |
| Producto  | Descripción del producto                           |
| Cantidad  | Unidades vendidas                                  |
| Precio    | Precio **unitario**                                |
| Cliente   | Nombre del cliente (opcional)                      |
| Pago      | Opcional: **"Seña"** o **"Pago completo"**         |
| Vendedor  | Quién hizo la venta (cada uno pone su nombre)      |

La app calcula además el **Total** (Cantidad × Precio) y el Apps Script guarda la fecha/hora en que
se registró. La planilla termina con columnas:
`Fecha | Producto | Cantidad | Precio | Cliente | Pago | Total | Vendedor | Registrado`.

---

## 1. Crear la Google Sheet y el backend (Apps Script)

1. Entrá a <https://sheets.google.com> y creá una planilla nueva, ej. **"Libro de ventas"**.
2. En el menú: **Extensiones › Apps Script**. Se abre el editor.
3. Borrá el contenido de `Código.gs` y pegá el contenido de [`apps-script/Codigo.gs`](apps-script/Codigo.gs).
4. Cambiá la línea `var TOKEN = 'CAMBIA-ESTE-TOKEN';` por un texto tuyo, ej. `var TOKEN = 'ventas-semsa-2026';`
   (lo vas a usar igual en la app). Guardá (💾).
5. Botón **Implementar › Nueva implementación**.
   - Tipo (engranaje ⚙): **Aplicación web**.
   - **Ejecutar como**: *Yo (tu cuenta)*.
   - **Quién tiene acceso**: *Cualquier persona* (¡importante! así no piden login).
   - **Implementar**. Autorizá los permisos cuando te lo pida (es tu propia planilla).
6. Copiá la **URL de la aplicación web** (termina en `/exec`). Esa URL va en la app.

> Si después editás el código del Apps Script, tenés que hacer **Implementar › Administrar
> implementaciones › Editar (lápiz) › Versión: Nueva versión › Implementar** para que los cambios
> tomen efecto en la misma URL.

---

## 2. Configurar la app (botón ⚙)

Abrí la app y tocá **⚙** (arriba a la derecha). Completá:

- **URL del servidor**: la URL `/exec` que copiaste del Apps Script.
- **Token**: el mismo texto que pusiste en `var TOKEN` del Apps Script.
- **Tu nombre**: tu nombre como vendedor (se autocompleta en el formulario).

Se guarda en el `localStorage` de tu navegador. Guardá y ya podés registrar ventas.

### Para tus socios

Cada socio, en su celular/compu, abre la misma URL de la app, toca ⚙ y pega **la misma URL del
servidor y el mismo token**, y pone **su propio nombre**. Listo: cargan ventas sin loguearse ni
tener acceso a la planilla. Pasales esos dos datos (URL + token) por WhatsApp.

---

## 3. Deploy de la app a GitHub Pages

```bash
git add .
git commit -m "Libro de ventas con backend en Google Apps Script"
git push
```

Si todavía no conectaste el repo remoto:

```bash
git remote add origin https://github.com/<usuario>/libro-de-ventas.git
git push -u origin main
```

Activar Pages: en el repo, **Settings › Pages › Source = `main` / root** › Save.
La app queda en `https://<usuario>.github.io/libro-de-ventas/`.

> A diferencia del enfoque con Microsoft, acá **no** hay que registrar ninguna URL de redirección
> en ningún lado: no hay login.

---

## Probar que el backend anda

Pegá la URL `/exec` en el navegador (un GET): deberías ver
`{"ok":true,"msg":"Libro de ventas backend activo"}`. Si ves eso, está vivo.

## Notas / seguridad

- El **token** no es un secreto fuerte (viaja al navegador). Sirve como filtro básico para que no
  cualquiera que adivine la URL pueda cargar basura. No publiques la URL del Apps Script.
- Toda la lógica de escritura vive en el Apps Script (tu cuenta). La web es solo el formulario.
- La Google Sheet la podés descargar como Excel `.xlsx` cuando quieras: **Archivo › Descargar ›
  Microsoft Excel (.xlsx)**.

## Stack / restricciones

- Sin frameworks, sin bundler, sin dependencias: **HTML + CSS + JS vanilla**.
- Backend: **Google Apps Script** (gratis, sin servidor que mantener).
- En el repo no hay secretos ni claves.

## Licencia

[MIT](LICENSE)
