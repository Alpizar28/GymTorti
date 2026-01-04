package com.mastergym.backend.measurement.report;

import com.mastergym.backend.client.model.ClientEntity;
import com.mastergym.backend.measurement.model.MeasurementEntity;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import javax.imageio.ImageIO;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

public final class MeasurementReportHtmlBuilder {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_SHORT = DateTimeFormatter.ofPattern("dd/MM");
    private static final DecimalFormat NUMBER_FORMAT = new DecimalFormat("0.##");

    private MeasurementReportHtmlBuilder() {
    }

    public static String build(ClientEntity client, List<MeasurementEntity> measurements) {
        MeasurementEntity latest = measurements.isEmpty() ? null : measurements.get(0);
        String nombre = escape(client.getNombre());
        String apellido = escape(client.getApellido());
        String clientName = apellido.isEmpty() ? nombre : (nombre + " " + apellido);
        String lastDate = latest == null ? "-" : DATE_FORMAT.format(latest.getFecha());
        String logoData = buildLogoDataUri();

        StringBuilder html = new StringBuilder(8000);
        html.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        html.append("<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"es\">");
        html.append("<head>");
        html.append("<meta charset=\"utf-8\"/>");
        html.append("<style>");
        html.append("@page{size:A4;margin:12mm;}");
        html.append("body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;margin:0;padding:12px;color:#111827;background:#f7f1f4;font-size:11px;}");
        html.append(".container{max-width:780px;margin:0 auto;}");
        html.append(".header{background:#ff6b7a;border-radius:14px;padding:14px 16px;color:#fff;box-shadow:0 10px 18px rgba(255,107,122,0.35);border:1px solid #ff9aa8;}");
        html.append(".title{font-size:17px;font-weight:800;margin:0 0 2px 0;}");
        html.append(".subtitle{font-size:10px;color:#ffe1e6;margin:0;}");
        html.append(".card{background:#fff;border-radius:10px;padding:9px;box-shadow:0 6px 12px rgba(0,0,0,0.05);}");
        html.append(".card-soft{background:#fff0f2;border-radius:10px;padding:9px;border:1px solid #ffd7dd;}");
        html.append(".row{display:flex;gap:16px;flex-wrap:wrap;}");
        html.append(".col{flex:1;min-width:240px;}");
        html.append(".label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;}");
        html.append(".value{font-size:13px;font-weight:600;color:#111827;}");
        html.append(".badge{display:inline-block;background:#ff5e62;color:#fff;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;}");
        html.append(".pill{display:inline-block;background:#fff;color:#111827;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;border:1px solid #ffe1d0;}");
        html.append(".summary{display:flex;gap:9px;flex-wrap:wrap;margin-top:9px;}");
        html.append(".summary-card{flex:1;min-width:115px;background:#fff7f2;border-radius:8px;padding:6px 7px;border:1px solid #ffe6da;}");
        html.append(".summary-card .value{font-size:12px;}");
        html.append(".table{width:100%;border-collapse:separate;border-spacing:0 4px;margin-top:10px;font-size:11px;}");
        html.append(".table th{font-size:11px;color:#6b7280;text-align:left;padding:6px 8px;}");
        html.append(".table tr{background:#f9fafb;}");
        html.append(".table td{padding:6px 8px;font-size:11px;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;}");
        html.append(".table tr td:first-child{border-left:1px solid #f3f4f6;border-top-left-radius:10px;border-bottom-left-radius:10px;}");
        html.append(".table tr td:last-child{border-right:1px solid #f3f4f6;border-top-right-radius:10px;border-bottom-right-radius:10px;}");
        html.append(".chart-card{background:#fff;border-radius:10px;padding:9px;box-shadow:0 6px 12px rgba(0,0,0,0.05);}");
        html.append(".chart-title{font-size:11px;font-weight:600;color:#111827;margin:0 0 3px 0;}");
        html.append(".chart-sub{font-size:9px;color:#6b7280;margin:0 0 4px 0;}");
        html.append(".chart-grid{width:100%;border-collapse:separate;border-spacing:0 0;}");
        html.append(".chart-grid td{width:100%;vertical-align:top;padding:0 0 12px 0;}");
        html.append(".chart-wrap{page-break-inside:avoid;}");
        html.append(".chart-meta{margin-top:4px;color:#6b7280;font-size:9px;}");
        html.append(".muted{color:#6b7280;font-size:10px;}");
        html.append(".section-title{font-size:12px;font-weight:800;margin:11px 0 6px 0;color:#111827;}");
        html.append(".brand{width:100%;border-collapse:collapse;}");
        html.append(".brand td{vertical-align:middle;}");
        html.append(".brand-logo{width:36px;height:36px;border-radius:12px;display:block;background:#fff;}");
        html.append(".brand-name{font-size:18px;font-weight:800;color:#fff;margin:0;}");
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        html.append("<div class=\"container\">");
        html.append("<div class=\"header\">");
        html.append("<table class=\"brand\"><tr>");
        if (!logoData.isEmpty()) {
            html.append("<td style=\"width:42px;\"><img class=\"brand-logo\" src=\"").append(logoData).append("\" alt=\"MasterGym\"/></td>");
        }
        html.append("<td>");
        html.append("<div class=\"brand-name\">MasterGym</div>");
        html.append("<div class=\"subtitle\">Reporte de mediciones del cliente</div>");
        html.append("</td>");
        html.append("</tr></table>");
        html.append("</div>");

        html.append("<div style=\"height:10px;\"></div>");
        html.append("<div class=\"card\">");
        html.append("<div class=\"card-soft\">");
        html.append("<div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;\">");
        html.append("<div>");
        html.append("<div style=\"font-size:20px;font-weight:800;\">").append(clientName).append("</div>");
        html.append("<div class=\"muted\">Reporte de progreso</div>");
        html.append("</div>");
        html.append("</div>");
        html.append("<div class=\"muted\" style=\"margin-top:8px;\">Ultima medicion: ").append(lastDate).append("</div>");
        if (latest != null) {
            html.append("<div class=\"summary\">");
            html.append("<div class=\"summary-card\"><div class=\"label\">Peso</div><div class=\"value\">")
                    .append(formatNumber(latest.getPeso())).append(" kg</div></div>");
            html.append("<div class=\"summary-card\"><div class=\"label\">Altura</div><div class=\"value\">")
                    .append(formatNumber(latest.getAltura())).append(" cm</div></div>");
            html.append("<div class=\"summary-card\"><div class=\"label\">IMC</div><div class=\"value\">")
                    .append(formatImc(latest.getPeso(), latest.getAltura())).append("</div></div>");
            html.append("<div class=\"summary-card\"><div class=\"label\">Grasa</div><div class=\"value\">")
                    .append(formatNullable(latest.getGrasaCorporal())).append(" %</div></div>");
            html.append("</div>");
        }
        html.append("</div>");
        html.append("</div>");

        html.append("<div class=\"section-title\">Graficas</div>");
        html.append("<div class=\"chart-wrap\">");
        html.append("<table class=\"chart-grid\">");
        html.append("<tr><td>");
        html.append("<div class=\"chart-card\">");
        html.append("<div class=\"chart-title\">Peso</div>");
        html.append("<div class=\"chart-sub\">Evolucion por fecha</div>");
        html.append(buildChartImage(measurements, ChartValueType.PESO, "#ef6a6e", "kg"));
        html.append(buildChartMeta(measurements, ChartValueType.PESO, "kg"));
        html.append("</div>");
        html.append("</td></tr>");
        html.append("<tr><td>");
        html.append("<div class=\"chart-card\">");
        html.append("<div class=\"chart-title\">% Grasa Corporal</div>");
        html.append("<div class=\"chart-sub\">Evolucion por fecha</div>");
        html.append(buildChartImage(measurements, ChartValueType.GRASA, "#f59e7a", "%"));
        html.append(buildChartMeta(measurements, ChartValueType.GRASA, "%"));
        html.append("</div>");
        html.append("</td></tr>");
        html.append("</table>");
        html.append("</div>");

        html.append("<div class=\"muted\" style=\"margin-top:16px;\">Generado: ").append(formatDate(LocalDate.now())).append("</div>");
        html.append("</div>");
        html.append("</body>");
        html.append("</html>");
        return html.toString();
    }

    private static String formatDate(LocalDate date) {
        if (date == null) return "-";
        return DATE_FORMAT.format(date);
    }

    private static String formatNumber(Double value) {
        if (value == null) return "-";
        return NUMBER_FORMAT.format(value);
    }

    private static String formatNullable(Double value) {
        if (value == null) return "-";
        return NUMBER_FORMAT.format(value);
    }

    private static String formatImc(Double peso, Double alturaCm) {
        if (peso == null || alturaCm == null || alturaCm == 0) return "-";
        double alturaM = alturaCm / 100.0;
        double imc = peso / (alturaM * alturaM);
        return NUMBER_FORMAT.format(imc);
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private enum ChartValueType {
        PESO,
        GRASA
    }

    private static String buildChartSvg(List<MeasurementEntity> measurements, ChartValueType type, String color, String unit) {
        int width = 470;
        int height = 190;
        int leftPadding = 64;
        int rightPadding = 18;
        int topPadding = 16;
        int bottomPadding = 32;

        List<MeasurementEntity> orderedAll = measurements.stream()
                .filter(m -> m.getFecha() != null)
                .sorted((a, b) -> a.getFecha().compareTo(b.getFecha()))
                .filter(m -> (type == ChartValueType.PESO ? m.getPeso() : m.getGrasaCorporal()) != null)
                .toList();
        List<MeasurementEntity> ordered = orderedAll.size() <= 5
                ? orderedAll
                : orderedAll.subList(orderedAll.size() - 5, orderedAll.size());

        if (ordered.isEmpty()) {
            return "<div class=\"muted\">No hay datos para graficar.</div>";
        }

        List<Double> values = ordered.stream()
                .map(m -> type == ChartValueType.PESO ? m.getPeso() : m.getGrasaCorporal())
                .toList();

        double min = values.stream().min(Double::compareTo).orElse(0.0);
        double max = values.stream().max(Double::compareTo).orElse(0.0);
        if (max - min < 0.1) {
            max = min + 0.1;
        }

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        g.setColor(Color.decode("#f9fafb"));
        g.fillRoundRect(0, 0, width, height, 10, 10);
        g.setColor(Color.decode("#f1f2f5"));
        g.setStroke(new BasicStroke(1f));
        g.drawRoundRect(0, 0, width - 1, height - 1, 10, 10);

        int left = leftPadding;
        int right = width - rightPadding;
        int top = topPadding;
        int bottom = height - bottomPadding;

        g.setColor(Color.decode("#e5e7eb"));
        g.drawLine(left, bottom, right, bottom);
        g.drawLine(left, top, left, bottom);

        Color lineColor = Color.decode(color);
        g.setColor(lineColor);
        g.setStroke(new BasicStroke(2.5f));

        int pointCount = values.size();
        double xStep = pointCount == 1 ? 0 : (double) (right - left) / (pointCount - 1);
        int lastX = -1;
        int lastY = -1;
        for (int idx = 0; idx < values.size(); idx++) {
            Double value = values.get(idx);
            double normalized = (value - min) / (max - min);
            int x = pointCount == 1 ? (left + right) / 2 : (int) Math.round(left + (xStep * idx));
            int y = (pointCount == 1) ? (top + bottom) / 2 : (int) Math.round(bottom - (normalized * (bottom - top)));
            if (lastX >= 0) {
                g.drawLine(lastX, lastY, x, y);
            }
            g.fillOval(x - 3, y - 3, 6, 6);
            lastX = x;
            lastY = y;
        }

        g.setColor(Color.decode("#9ca3af"));
        g.setFont(g.getFont().deriveFont(Font.PLAIN, 9f));
        var metrics = g.getFontMetrics();
        for (int idx = 0; idx < ordered.size(); idx++) {
            String dateLabel = DATE_SHORT.format(ordered.get(idx).getFecha());
            Double value = values.get(idx);
            double normalized = (value - min) / (max - min);
            int x = pointCount == 1 ? (left + right) / 2 : (int) Math.round(left + (xStep * idx));
            int y = (pointCount == 1) ? (top + bottom) / 2 : (int) Math.round(bottom - (normalized * (bottom - top)));
            int dateWidth = metrics.stringWidth(dateLabel);
            int dateX = Math.max(left, Math.min(x - (dateWidth / 2), right - dateWidth));
            g.drawString(dateLabel, dateX, bottom + 22);
            String valueLabel = formatNumber(value);
            int labelWidth = metrics.stringWidth(valueLabel);
            int valueX = Math.max(left, Math.min(x - (labelWidth / 2), right - labelWidth));
            int valueY = y - ((idx % 2 == 0) ? 8 : 18);
            g.drawString(valueLabel, valueX, Math.max(top + 10, valueY));
        }
        g.drawString(unit, right - 12, top + 10);

        g.dispose();

        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", output);
            return Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (Exception ex) {
            return "<div class=\"muted\">No se pudo generar la grafica.</div>";
        }
    }

    private static String buildChartImage(List<MeasurementEntity> measurements, ChartValueType type, String color, String unit) {
        String pngBase64 = buildChartSvg(measurements, type, color, unit);
        if (pngBase64.startsWith("<div")) {
            return pngBase64;
        }
        return "<img alt=\"grafica\" src=\"data:image/png;base64," + pngBase64 + "\" style=\"width:100%;height:auto;\"/>";
    }

    private static String buildChartMeta(List<MeasurementEntity> measurements, ChartValueType type, String unit) {
        List<Double> values = measurements.stream()
                .filter(m -> m.getFecha() != null)
                .sorted((a, b) -> a.getFecha().compareTo(b.getFecha()))
                .map(m -> type == ChartValueType.PESO ? m.getPeso() : m.getGrasaCorporal())
                .filter(v -> v != null)
                .toList();
        if (values.size() > 5) {
            values = values.subList(values.size() - 5, values.size());
        }
        if (values.isEmpty()) {
            return "<div class=\"chart-meta\">Sin datos.</div>";
        }
        double min = values.stream().min(Double::compareTo).orElse(0.0);
        double max = values.stream().max(Double::compareTo).orElse(0.0);
        double last = values.get(values.size() - 1);
        return "<div class=\"chart-meta\">Min: " + formatNumber(min) + " " + unit
                + " | Max: " + formatNumber(max) + " " + unit
                + " | Ultimo: " + formatNumber(last) + " " + unit + "</div>";
    }

    private static String buildLogoDataUri() {
        Path[] candidates = new Path[] {
                Paths.get("ui", "recursos", "logo.jpg"),
                Paths.get("..", "ui", "recursos", "logo.jpg")
        };
        for (Path candidate : candidates) {
            try {
                if (Files.exists(candidate)) {
                    byte[] bytes = Files.readAllBytes(candidate);
                    return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes);
                }
            } catch (Exception ex) {
                return "";
            }
        }
        return "";
    }

}
