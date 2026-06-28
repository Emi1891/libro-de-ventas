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

// ---- Formato (podés cambiar estos valores a gusto) ----
var FMT_MONEDA = '$#,##0.00';        // columnas Precio y Total
var FMT_FECHA  = 'dd/mm/yyyy';        // columna Fecha
var FMT_FECHAHORA = 'dd/mm/yyyy hh:mm'; // columna Registrado
var COLOR_ENCABEZADO = '#0ea5e9';     // fondo de la fila de encabezados
var COLOR_TEXTO_ENCABEZADO = '#ffffff';

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
  var creada = false;
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    creada = true;
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    creada = true;
  }
  if (creada) {
    formatearHoja();
  }
  return sheet;
}

/**
 * Da formato a la hoja: encabezado con color, moneda en Precio/Total, fechas, y
 * filas alternadas. Se aplica a COLUMNAS enteras, así las ventas nuevas heredan el formato.
 *
 * Se corre solo al crear la hoja, pero TAMBIÉN podés ejecutarla a mano cuando quieras:
 * elegí "formatearHoja" en el menú de funciones del editor y tocá Ejecutar (▶).
 */
function formatearHoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var nCols = HEADERS.length;

  var maxRows = sheet.getMaxRows() - 1;

  // Filas alternadas (colores) solo en los datos. Quito el banding anterior si existía.
  sheet.getBandings().forEach(function (b) { b.remove(); });
  sheet.getRange(2, 1, maxRows, nCols)
       .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);

  // Encabezado: color de fondo, texto blanco, negrita, centrado y fijo arriba.
  // (Va DESPUÉS del banding para que mi color tenga prioridad sobre la primera fila.)
  sheet.getRange(1, 1, 1, nCols)
       .setBackground(COLOR_ENCABEZADO)
       .setFontColor(COLOR_TEXTO_ENCABEZADO)
       .setFontWeight('bold')
       .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // Formatos por columna (desde la fila 2 hacia abajo, columna entera).
  // Fecha (col 1), Precio (col 4), Total (col 7), Registrado (col 9)
  sheet.getRange(2, 1, maxRows, 1).setNumberFormat(FMT_FECHA);      // Fecha
  sheet.getRange(2, 4, maxRows, 1).setNumberFormat(FMT_MONEDA);     // Precio
  sheet.getRange(2, 7, maxRows, 1).setNumberFormat(FMT_MONEDA);     // Total
  sheet.getRange(2, 9, maxRows, 1).setNumberFormat(FMT_FECHAHORA);  // Registrado

  // Ancho automático de columnas.
  for (var c = 1; c <= nCols; c++) sheet.autoResizeColumn(c);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
