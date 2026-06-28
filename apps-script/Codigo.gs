/**
 * Libro de ventas — backend (Google Apps Script)
 *
 * Recibe ventas por POST desde la app web y las agrega como filas a esta planilla.
 * Se ejecuta bajo TU cuenta de Google, así que tus socios NO necesitan loguearse
 * ni tener acceso a la planilla: solo abren la web y cargan la venta.
 *
 * Cómo instalarlo: ver README.md, sección "Configurar el backend (Apps Script)".
 */

// Token simple para frenar abuso casual. Poné EXACTAMENTE el mismo valor en la app (botón ⚙).
// Ojo: no es un secreto fuerte (viaja al navegador). Es solo un filtro básico.
// Si no querés token, dejalo en "" (vacío) acá y en la app.
var TOKEN = 'CAMBIA-ESTE-TOKEN';

// Nombre de la pestaña (hoja) donde se escriben las ventas.
var SHEET_NAME = 'Ventas';

// Encabezados esperados (se crean automáticamente si la hoja está vacía).
var HEADERS = ['Fecha', 'Producto', 'Cantidad', 'Precio', 'Cliente', 'Pago', 'Total', 'Vendedor', 'Registrado'];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (TOKEN && data.token !== TOKEN) {
      return json({ ok: false, error: 'Token inválido' });
    }

    var sheet = getSheet_();

    sheet.appendRow([
      data.fecha || '',
      data.producto || '',
      Number(data.cantidad) || 0,
      Number(data.precio) || 0,
      data.cliente || '',
      data.pago || '',
      Number(data.total) || 0,
      data.vendedor || '',
      new Date()
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Permite probar en el navegador que el backend está vivo.
function doGet() {
  return json({ ok: true, msg: 'Libro de ventas backend activo' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
