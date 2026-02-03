# Exportación de Datos - Alternativas Recomendadas

## 🎯 Objetivo
Cuando necesites exportar datos de clientes, pagos o mediciones a formatos como Excel o PDF.

## ❌ NO Usar: `xlsx` 
- Tiene vulnerabilidad de seguridad (Prototype Pollution)
- No se está usando en el proyecto actualmente
- **Desinstalada** para mantener la seguridad

---

## ✅ Alternativas Recomendadas

### Opción 1: **ExcelJS** (Recomendado para Excel)

**Por qué:**
- ✅ Activamente mantenido
- ✅ Sin vulnerabilidades conocidas
- ✅ Soporte completo de Excel (.xlsx)
- ✅ Permite estilos, fórmulas y múltiples hojas
- ✅ Funciona en Node.js y navegador

**Instalación:**
```bash
npm install exceljs
```

**Ejemplo de uso:**
```typescript
import ExcelJS from 'exceljs';

export async function exportClientsToExcel(clients: Client[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clientes');

  // Definir columnas
  worksheet.columns = [
    { header: 'Nombre', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Teléfono', key: 'phone', width: 15 },
    { header: 'Estado', key: 'status', width: 15 },
  ];

  // Agregar datos
  clients.forEach(client => {
    worksheet.addRow({
      name: `${client.first_name} ${client.last_name}`,
      email: client.email,
      phone: client.phone,
      status: client.status,
    });
  });

  // Estilizar encabezados
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };

  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// En un API route
export async function GET() {
  const clients = await fetchClients();
  const buffer = await exportClientsToExcel(clients);
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="clientes.xlsx"',
    },
  });
}
```

---

### Opción 2: **CSV Simple** (Más ligero)

**Por qué:**
- ✅ No requiere dependencias externas
- ✅ Compatible con Excel, Google Sheets, etc.
- ✅ Muy ligero y rápido
- ✅ Fácil de implementar

**Ejemplo de uso:**
```typescript
export function convertToCSV(data: any[], headers: string[]) {
  const csvRows = [];
  
  // Agregar encabezados
  csvRows.push(headers.join(','));
  
  // Agregar datos
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escapar comillas y comas
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// En un API route
export async function GET() {
  const clients = await fetchClients();
  
  const csv = convertToCSV(
    clients.map(c => ({
      nombre: `${c.first_name} ${c.last_name}`,
      email: c.email,
      telefono: c.phone,
      estado: c.status,
    })),
    ['nombre', 'email', 'telefono', 'estado']
  );
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="clientes.csv"',
    },
  });
}
```

---

### Opción 3: **jsPDF** (Para PDFs)

**Por qué:**
- ✅ Genera PDFs de alta calidad
- ✅ Soporte de tablas con `jspdf-autotable`
- ✅ Personalización completa (logos, colores, fuentes)
- ✅ Funciona en navegador y servidor

**Instalación:**
```bash
npm install jspdf jspdf-autotable
```

**Ejemplo de uso:**
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportClientsToPDF(clients: Client[]) {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.text('Lista de Clientes - Gym Azul', 14, 20);
  
  // Tabla
  autoTable(doc, {
    head: [['Nombre', 'Email', 'Teléfono', 'Estado']],
    body: clients.map(c => [
      `${c.first_name} ${c.last_name}`,
      c.email,
      c.phone,
      c.status,
    ]),
    startY: 30,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [68, 114, 196] },
  });
  
  return doc.output('arraybuffer');
}

// En un API route
export async function GET() {
  const clients = await fetchClients();
  const pdf = exportClientsToPDF(clients);
  
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="clientes.pdf"',
    },
  });
}
```

---

## 🎨 Opción 4: **Componente de UI con botón de descarga**

Para el lado del cliente (Next.js):

```typescript
'use client';

import { useState } from 'react';

export function ExportButton({ data }: { data: any[] }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/export/clients?format=${format}`);
      const blob = await response.blob();
      
      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => handleExport('excel')}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Exportando...' : 'Exportar a Excel'}
      </button>
      <button 
        onClick={() => handleExport('csv')}
        disabled={loading}
        className="btn-secondary"
      >
        Exportar a CSV
      </button>
      <button 
        onClick={() => handleExport('pdf')}
        disabled={loading}
        className="btn-secondary"
      >
        Exportar a PDF
      </button>
    </div>
  );
}
```

---

## 📊 Comparación

| Librería | Tamaño | Complejidad | Formato | Recomendado para |
|----------|--------|-------------|---------|------------------|
| **ExcelJS** | ~1.5MB | Media | `.xlsx` | Reportes complejos con estilos |
| **CSV nativo** | 0KB | Baja | `.csv` | Exportaciones simples y rápidas |
| **jsPDF + autoTable** | ~500KB | Media | `.pdf` | Reportes formales e imprimibles |

---

## 💡 Recomendación para JokemGym

Para tu caso de uso (exportar clientes, pagos, mediciones):

1. **Usa CSV** para exportaciones rápidas y sencillas
2. **Usa ExcelJS** si necesitas múltiples hojas o estilos
3. **Usa jsPDF** para reportes mensuales formales

---

## ⚠️ Notas de Seguridad

- ✅ Todas estas librerías están libres de vulnerabilidades conocidas
- ✅ Valida siempre los datos antes de exportar
- ✅ Limita el tamaño de exportación (max 10,000 registros)
- ✅ Usa streaming para archivos grandes

## 🚀 Implementación Recomendada

Crear un endpoint genérico:

```typescript
// src/app/api/export/[resource]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { resource: string } }
) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';
  
  // Fetch data según el recurso
  const data = await fetchData(params.resource);
  
  switch (format) {
    case 'excel':
      return exportToExcel(data);
    case 'pdf':
      return exportToPDF(data);
    default:
      return exportToCSV(data);
  }
}
```

---

**Fecha de última actualización:** 2026-02-03
**Estado de seguridad:** ✅ Todas las alternativas están libres de vulnerabilidades
