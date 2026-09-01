package com.aseuro.pms.service;

import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final EmployeeRepository employeeRepository;

    public ReportService(
            PmsAssignmentRepository pmsAssignmentRepository,
            PmsKpiRepository pmsKpiRepository,
            EmployeeKpiRatingRepository employeeKpiRatingRepository,
            EmployeeReviewRepository employeeReviewRepository,
            EmployeeRepository employeeRepository) {
        this.pmsAssignmentRepository = pmsAssignmentRepository;
        this.pmsKpiRepository = pmsKpiRepository;
        this.employeeKpiRatingRepository = employeeKpiRatingRepository;
        this.employeeReviewRepository = employeeReviewRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public byte[] generatePdfReport(Long employeeId, Long assignmentId) throws IOException {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        Employee reqUser = employeeRepository.findById(employeeId).orElse(null);
        boolean isHrOrManager = reqUser != null && (reqUser.getRole() == Role.ROLE_HR || reqUser.getRole() == Role.ROLE_MANAGER);

        if (!assignment.getEmployee().getId().equals(employeeId) && !isHrOrManager) {
            throw new AccessDeniedException("Unauthorized access to report");
        }

        List<PmsKpi> allKpis = pmsKpiRepository.findByAssignment(assignment);
        List<PmsKpi> roleKpis = allKpis.stream()
                .filter(k -> !"HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());
        List<PmsKpi> hrKpis = allKpis.stream()
                .filter(k -> "HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());

        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
        List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(assignment);

        double selfSum = 0.0;
        double mgrSum = 0.0;
        double hrSum = 0.0;
        for (PmsKpi kpi : roleKpis) {
            EmployeeKpiRating r = ratings.stream().filter(rt -> rt.getKpi().getId().equals(kpi.getId())).findFirst().orElse(null);
            double w = kpi.getWeightage() / 100.0;
            if (r != null) {
                if (r.getSelfRating() != null) selfSum += r.getSelfRating() * w;
                if (r.getManagerRating() != null) mgrSum += r.getManagerRating() * w;
            }
        }
        for (PmsKpi kpi : hrKpis) {
            EmployeeKpiRating r = ratings.stream().filter(rt -> rt.getKpi().getId().equals(kpi.getId())).findFirst().orElse(null);
            double w = kpi.getWeightage() / 100.0;
            if (r != null && r.getHrRating() != null) {
                hrSum += r.getHrRating() * w;
            } else if (assignment.getStatus() == PMSState.COMPLETED || assignment.getStatus() == PMSState.FINAL_RESULT_PUBLISHED) {
                hrSum += 5.0 * w;
            }
        }

        double selfScore = Math.round(selfSum * 100.0) / 100.0;
        double mgrScore = Math.round(mgrSum * 100.0) / 100.0;
        double hrScore = Math.round(hrSum * 100.0) / 100.0;

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontOblique = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            PDPageContentStream contentStream = new PDPageContentStream(document, page);
            int yPosition = 780;

            // Header
            contentStream.beginText();
            contentStream.setFont(fontBold, 15);
            contentStream.newLineAtOffset(50, yPosition);
            contentStream.showText("Performance Management System (PMS) - Final Report");
            contentStream.endText();
            yPosition -= 30;

            // Employee Info Box
            contentStream.beginText();
            contentStream.setFont(fontBold, 9);
            contentStream.newLineAtOffset(50, yPosition);
            contentStream.showText("Employee Name: " + assignment.getEmployee().getName() + " (EMP-" + assignment.getEmployee().getId() + ")");
            contentStream.newLineAtOffset(0, -14);
            contentStream.showText("Designation: " + (assignment.getEmployee().getDesignation() != null ? assignment.getEmployee().getDesignation() : "-") +
                    " | Department: " + (assignment.getEmployee().getDepartment() != null ? assignment.getEmployee().getDepartment() : "-"));
            contentStream.newLineAtOffset(0, -14);
            contentStream.showText("PMS Cycle: " + assignment.getCycleMonth() + " | Status: " + assignment.getStatus());
            contentStream.newLineAtOffset(0, -14);
            contentStream.showText("Scores: Self (" + selfScore + ") | Manager (" + mgrScore + ") | HR (" + hrScore + ")");
            contentStream.newLineAtOffset(0, -14);
            contentStream.showText("Final Performance Score: " + (assignment.getOverallScore() != null ? String.format("%.2f", assignment.getOverallScore()) : "N/A") +
                    " / 5.00 (" + (assignment.getPerformanceGrade() != null ? assignment.getPerformanceGrade() : "Pending") + ")");
            contentStream.endText();
            yPosition -= 80;

            // Section 1: Role / Employee KPIs
            contentStream.beginText();
            contentStream.setFont(fontBold, 11);
            contentStream.newLineAtOffset(50, yPosition);
            contentStream.showText("1. Employee KPI Performance Breakdown & Comments:");
            contentStream.endText();
            yPosition -= 20;

            for (PmsKpi kpi : roleKpis) {
                EmployeeKpiRating r = ratings.stream()
                        .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                        .findFirst().orElse(null);

                // Check remaining space for KPI title + ratings block
                if (yPosition < 120) {
                    contentStream.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    contentStream = new PDPageContentStream(document, page);
                    yPosition = 780;
                }

                contentStream.beginText();
                contentStream.setFont(fontBold, 9);
                contentStream.newLineAtOffset(50, yPosition);
                contentStream.showText("• " + sanitizeText(kpi.getKpiName()) + " (Weight: " + kpi.getWeightage() + "%)");
                contentStream.setFont(fontRegular, 8);
                contentStream.newLineAtOffset(0, -12);
                contentStream.showText("  Self Rating: " + (r != null && r.getSelfRating() != null ? r.getSelfRating() : "N/A") +
                        " | Manager Rating: " + (r != null && r.getManagerRating() != null ? r.getManagerRating() : "N/A") +
                        " | HR Rating: " + (r != null && r.getHrRating() != null ? r.getHrRating() : "N/A"));
                contentStream.endText();
                yPosition -= 26;

                // Employee Comment
                String empComment = r != null ? r.getEmployeeComment() : null;
                if (empComment != null && !empComment.trim().isEmpty()) {
                    yPosition = drawCommentBlock(contentStream, document, page, fontBold, fontOblique, "Employee Comment:", empComment, yPosition);
                }

                // Manager Comment
                String mgrComment = r != null ? r.getManagerComment() : null;
                if (mgrComment != null && !mgrComment.trim().isEmpty()) {
                    yPosition = drawCommentBlock(contentStream, document, page, fontBold, fontOblique, "Manager Comment:", mgrComment, yPosition);
                }

                // HR Comment
                String hrComment = r != null ? r.getHrComment() : null;
                if (hrComment != null && !hrComment.trim().isEmpty()) {
                    yPosition = drawCommentBlock(contentStream, document, page, fontBold, fontOblique, "HR Comment:", hrComment, yPosition);
                }

                yPosition -= 10;
            }

            // Section 2: HR Review KPIs
            if (!hrKpis.isEmpty()) {
                if (yPosition < 140) {
                    contentStream.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    contentStream = new PDPageContentStream(document, page);
                    yPosition = 780;
                }

                yPosition -= 10;
                contentStream.beginText();
                contentStream.setFont(fontBold, 11);
                contentStream.newLineAtOffset(50, yPosition);
                contentStream.showText("2. HR Review KPI Evaluation (Corporate Staff):");
                contentStream.endText();
                yPosition -= 20;

                for (PmsKpi kpi : hrKpis) {
                    EmployeeKpiRating r = ratings.stream()
                            .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                            .findFirst().orElse(null);
                    Double hrRat = r != null && r.getHrRating() != null ? r.getHrRating() : 5.0;

                    if (yPosition < 100) {
                        contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        contentStream = new PDPageContentStream(document, page);
                        yPosition = 780;
                    }

                    contentStream.beginText();
                    contentStream.setFont(fontBold, 9);
                    contentStream.newLineAtOffset(50, yPosition);
                    contentStream.showText("• " + sanitizeText(kpi.getKpiName()) + " (Weight: " + kpi.getWeightage() + "%) - HR Rating: " + hrRat + " / 5.00");
                    contentStream.endText();
                    yPosition -= 14;

                    String hrKpiComment = r != null ? r.getHrComment() : null;
                    if (hrKpiComment != null && !hrKpiComment.trim().isEmpty()) {
                        yPosition = drawCommentBlock(contentStream, document, page, fontBold, fontOblique, "HR Comment:", hrKpiComment, yPosition);
                    }

                    yPosition -= 8;
                }
            }

            // Section 3: Overall Review Remarks
            if (!reviews.isEmpty()) {
                if (yPosition < 120) {
                    contentStream.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    contentStream = new PDPageContentStream(document, page);
                    yPosition = 780;
                }

                yPosition -= 10;
                contentStream.beginText();
                contentStream.setFont(fontBold, 11);
                contentStream.newLineAtOffset(50, yPosition);
                contentStream.showText("3. Overall Evaluator Reviews & Remarks:");
                contentStream.endText();
                yPosition -= 18;

                for (EmployeeReview rev : reviews) {
                    if (yPosition < 80) {
                        contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        contentStream = new PDPageContentStream(document, page);
                        yPosition = 780;
                    }

                    String roleName = rev.getReviewer().getRole().name().replace("ROLE_", "");
                    String label = roleName + " (" + sanitizeText(rev.getReviewer().getName()) + "):";
                    yPosition = drawCommentBlock(contentStream, document, page, fontBold, fontOblique, label, rev.getComments(), yPosition);
                    yPosition -= 6;
                }
            }

            contentStream.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private int drawCommentBlock(
            PDPageContentStream stream,
            PDDocument doc,
            PDPage page,
            PDType1Font labelFont,
            PDType1Font commentFont,
            String label,
            String commentText,
            int currentY) throws IOException {

        List<String> wrappedLines = wrapText(sanitizeText(commentText), 85);
        int neededHeight = 14 + (wrappedLines.size() * 10);

        if (currentY - neededHeight < 50) {
            stream.close();
            page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            stream = new PDPageContentStream(doc, page);
            currentY = 780;
        }

        stream.beginText();
        stream.setFont(labelFont, 8);
        stream.newLineAtOffset(65, currentY);
        stream.showText(label);
        stream.setFont(commentFont, 8);
        for (String line : wrappedLines) {
            stream.newLineAtOffset(0, -10);
            stream.showText("\"" + line + "\"");
        }
        stream.endText();

        return currentY - neededHeight - 4;
    }

    private String sanitizeText(String input) {
        if (input == null) return "";
        return input.replaceAll("[\\r\\n]+", " ").replaceAll("[^\\x00-\\x7F]", "");
    }

    private List<String> wrapText(String text, int maxCharsPerLine) {
        if (text == null || text.trim().isEmpty()) return Collections.emptyList();
        List<String> result = new ArrayList<>();
        String[] words = text.split("\\s+");
        StringBuilder sb = new StringBuilder();

        for (String w : words) {
            if (sb.length() + w.length() + 1 > maxCharsPerLine) {
                if (sb.length() > 0) {
                    result.add(sb.toString());
                    sb = new StringBuilder();
                }
            }
            if (sb.length() > 0) {
                sb.append(" ");
            }
            sb.append(w);
        }
        if (sb.length() > 0) {
            result.add(sb.toString());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public byte[] generateExcelReport(Long employeeId, Long assignmentId) throws IOException {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        Employee reqUser = employeeRepository.findById(employeeId).orElse(null);
        boolean isHrOrManager = reqUser != null && (reqUser.getRole() == Role.ROLE_HR || reqUser.getRole() == Role.ROLE_MANAGER);

        if (!assignment.getEmployee().getId().equals(employeeId) && !isHrOrManager) {
            throw new AccessDeniedException("Unauthorized access to report");
        }

        List<PmsKpi> allKpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        double mgrSum = 0.0;
        double hrSum = 0.0;
        for (PmsKpi kpi : allKpis) {
            EmployeeKpiRating r = ratings.stream().filter(rt -> rt.getKpi().getId().equals(kpi.getId())).findFirst().orElse(null);
            double w = kpi.getWeightage() / 100.0;
            if (r != null) {
                if (r.getManagerRating() != null) mgrSum += r.getManagerRating() * w;
                if (r.getHrRating() != null) hrSum += r.getHrRating() * w;
            }
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("PMS Report");

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.GREY_80_PERCENT.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Employee details
            int rowNum = 0;
            Row rInfo1 = sheet.createRow(rowNum++);
            rInfo1.createCell(0).setCellValue("Employee Name:");
            rInfo1.createCell(1).setCellValue(assignment.getEmployee().getName());
            
            Row rInfo2 = sheet.createRow(rowNum++);
            rInfo2.createCell(0).setCellValue("Employee ID:");
            rInfo2.createCell(1).setCellValue("EMP-" + assignment.getEmployee().getId());

            Row rInfo3 = sheet.createRow(rowNum++);
            rInfo3.createCell(0).setCellValue("PMS Cycle:");
            rInfo3.createCell(1).setCellValue(assignment.getCycleMonth());

            Row rInfo4 = sheet.createRow(rowNum++);
            rInfo4.createCell(0).setCellValue("Manager Weighted Score:");
            rInfo4.createCell(1).setCellValue(Math.round(mgrSum * 100.0) / 100.0);

            Row rInfo5 = sheet.createRow(rowNum++);
            rInfo5.createCell(0).setCellValue("HR Weighted Score:");
            rInfo5.createCell(1).setCellValue(Math.round(hrSum * 100.0) / 100.0);

            Row rInfo6 = sheet.createRow(rowNum++);
            rInfo6.createCell(0).setCellValue("Final Result:");
            rInfo6.createCell(1).setCellValue(assignment.getOverallScore() != null ? assignment.getOverallScore() : 0.0);

            Row rInfo7 = sheet.createRow(rowNum++);
            rInfo7.createCell(0).setCellValue("Performance Grade:");
            rInfo7.createCell(1).setCellValue(assignment.getPerformanceGrade() != null ? assignment.getPerformanceGrade() : "N/A");

            rowNum++; // Blank row

            // KPI Header row
            Row headerRow = sheet.createRow(rowNum++);
            String[] columns = {"Category", "KPI Name", "Measurement Criteria", "Weightage", "Self Rating", "Employee Comment", "Manager Rating", "Manager Comment", "HR Rating", "HR Comment"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Write KPI details
            for (PmsKpi kpi : allKpis) {
                EmployeeKpiRating r = ratings.stream()
                        .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                        .findFirst().orElse(null);

                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue("HR_REVIEW_KPI".equals(kpi.getKpiCategory()) ? "HR Review KPI" : "Role KPI");
                row.createCell(1).setCellValue(kpi.getKpiName());
                row.createCell(2).setCellValue(kpi.getDescription());
                row.createCell(3).setCellValue(kpi.getWeightage() + "%");
                row.createCell(4).setCellValue(r != null && r.getSelfRating() != null ? r.getSelfRating() : 0.0);
                row.createCell(5).setCellValue(r != null && r.getEmployeeComment() != null ? r.getEmployeeComment() : "");
                row.createCell(6).setCellValue(r != null && r.getManagerRating() != null ? r.getManagerRating() : 0.0);
                row.createCell(7).setCellValue(r != null && r.getManagerComment() != null ? r.getManagerComment() : "");
                row.createCell(8).setCellValue(r != null && r.getHrRating() != null ? r.getHrRating() : ("HR_REVIEW_KPI".equals(kpi.getKpiCategory()) ? 5.0 : 0.0));
                row.createCell(9).setCellValue(r != null && r.getHrComment() != null ? r.getHrComment() : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }
}
