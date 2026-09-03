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
        boolean isHrOrManager = reqUser != null
                && (reqUser.getRole() == Role.ROLE_HR || reqUser.getRole() == Role.ROLE_MANAGER);

        if (assignment.getEmployee() != null && !assignment.getEmployee().getId().equals(employeeId)
                && !isHrOrManager) {
            throw new AccessDeniedException("Unauthorized access to report");
        }

        List<PmsKpi> allKpis = pmsKpiRepository.findByAssignment(assignment);
        if (allKpis == null)
            allKpis = Collections.emptyList();

        List<PmsKpi> roleKpis = allKpis.stream()
                .filter(k -> k != null && !"HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());
        List<PmsKpi> hrKpis = allKpis.stream()
                .filter(k -> k != null && "HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());

        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
        if (ratings == null)
            ratings = Collections.emptyList();

        List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(assignment);
        if (reviews == null)
            reviews = Collections.emptyList();

        double selfSum = 0.0;
        double mgrSum = 0.0;
        double hrSum = 0.0;

        final List<EmployeeKpiRating> safeRatings = ratings;

        for (PmsKpi kpi : roleKpis) {
            if (kpi == null)
                continue;
            EmployeeKpiRating r = safeRatings.stream()
                    .filter(rt -> rt != null && rt.getKpi() != null && rt.getKpi().getId().equals(kpi.getId()))
                    .findFirst().orElse(null);
            double w = (kpi.getWeightage() != null ? kpi.getWeightage() : 0.0) / 100.0;
            if (r != null) {
                if (r.getSelfRating() != null)
                    selfSum += r.getSelfRating() * w;
                if (r.getManagerRating() != null)
                    mgrSum += r.getManagerRating() * w;
            }
        }

        for (PmsKpi kpi : hrKpis) {
            if (kpi == null)
                continue;
            EmployeeKpiRating r = safeRatings.stream()
                    .filter(rt -> rt != null && rt.getKpi() != null && rt.getKpi().getId().equals(kpi.getId()))
                    .findFirst().orElse(null);
            double w = (kpi.getWeightage() != null ? kpi.getWeightage() : 0.0) / 100.0;
            if (r != null && r.getHrRating() != null) {
                hrSum += r.getHrRating() * w;
            } else if (assignment.getStatus() == PMSState.COMPLETED
                    || assignment.getStatus() == PMSState.FINAL_RESULT_PUBLISHED) {
                hrSum += 5.0 * w;
            }
        }

        double selfScore = Math.round(selfSum * 100.0) / 100.0;
        double mgrScore = Math.round(mgrSum * 100.0) / 100.0;
        double hrScore = Math.round(hrSum * 100.0) / 100.0;

        Employee emp = assignment.getEmployee();
        String empName = emp != null && emp.getName() != null ? emp.getName() : "N/A";
        String empIdStr = emp != null && emp.getId() != null ? String.valueOf(emp.getId()) : "-";
        String empEmail = emp != null && emp.getEmail() != null ? emp.getEmail() : "-";
        String empDesignation = emp != null && emp.getDesignation() != null ? emp.getDesignation() : "-";
        String empDepartment = emp != null && emp.getDepartment() != null ? emp.getDepartment() : "-";
        String empManager = emp != null && emp.getManager() != null && emp.getManager().getName() != null
                ? emp.getManager().getName()
                : "-";
        String cycleMonth = assignment.getCycleMonth() != null ? assignment.getCycleMonth() : "N/A";
        String statusStr = assignment.getStatus() != null ? assignment.getStatus().name() : "N/A";

        try (PDDocument document = new PDDocument()) {
            PdfPageContext ctx = new PdfPageContext(document);

            // Header
            ctx.currentStream.beginText();
            ctx.currentStream.setFont(ctx.fontBold, 15);
            ctx.currentStream.newLineAtOffset(50, ctx.yPosition);
            ctx.currentStream.showText("Performance Management System (PMS) - Final Report");
            ctx.currentStream.endText();
            ctx.yPosition -= 30;

            // Employee Info Box
            ctx.currentStream.beginText();
            ctx.currentStream.setFont(ctx.fontBold, 9);
            ctx.currentStream.newLineAtOffset(50, ctx.yPosition);
            ctx.currentStream.showText("Employee Name: " + sanitizeText(empName) + " (EMP-" + empIdStr + ") | Email: "
                    + sanitizeText(empEmail));
            ctx.currentStream.newLineAtOffset(0, -14);
            ctx.currentStream.showText("Designation: " + sanitizeText(empDesignation) + " | Department: "
                    + sanitizeText(empDepartment) + " | Manager: " + sanitizeText(empManager));
            ctx.currentStream.newLineAtOffset(0, -14);
            ctx.currentStream.showText("PMS Cycle: " + sanitizeText(cycleMonth) + " | Status: " + statusStr);
            ctx.currentStream.newLineAtOffset(0, -14);
            ctx.currentStream
                    .showText("Scores: Self (" + selfScore + ") | Manager (" + mgrScore + ") | HR (" + hrScore + ")");
            ctx.currentStream.newLineAtOffset(0, -14);
            ctx.currentStream.showText("Final Performance Score: "
                    + (assignment.getOverallScore() != null ? String.format("%.2f", assignment.getOverallScore())
                            : "N/A")
                    +
                    " / 5.00 ("
                    + sanitizeText(
                            assignment.getPerformanceGrade() != null ? assignment.getPerformanceGrade() : "Pending")
                    + ")");
            ctx.currentStream.endText();
            ctx.yPosition -= 80;

            // Section 1: Role / Employee KPIs
            ctx.checkSpace(40);
            ctx.currentStream.beginText();
            ctx.currentStream.setFont(ctx.fontBold, 11);
            ctx.currentStream.newLineAtOffset(50, ctx.yPosition);
            ctx.currentStream.showText("1. Employee KPI Performance Breakdown & Comments:");
            ctx.currentStream.endText();
            ctx.yPosition -= 20;

            for (PmsKpi kpi : roleKpis) {
                if (kpi == null)
                    continue;
                EmployeeKpiRating r = safeRatings.stream()
                        .filter(rt -> rt != null && rt.getKpi() != null && rt.getKpi().getId().equals(kpi.getId()))
                        .findFirst().orElse(null);

                ctx.checkSpace(60);

                String kpiNameStr = kpi.getKpiName() != null ? kpi.getKpiName() : "KPI";
                double weightVal = kpi.getWeightage() != null ? kpi.getWeightage() : 0.0;

                ctx.currentStream.beginText();
                ctx.currentStream.setFont(ctx.fontBold, 9);
                ctx.currentStream.newLineAtOffset(50, ctx.yPosition);
                ctx.currentStream.showText("- " + sanitizeText(kpiNameStr) + " (Weight: " + weightVal + "%)");
                ctx.currentStream.setFont(ctx.fontRegular, 8);
                ctx.currentStream.newLineAtOffset(0, -12);
                ctx.currentStream.showText(
                        "  Self Rating: " + (r != null && r.getSelfRating() != null ? r.getSelfRating() : "N/A") +
                                " | Manager Rating: "
                                + (r != null && r.getManagerRating() != null ? r.getManagerRating() : "N/A") +
                                " | HR Rating: " + (r != null && r.getHrRating() != null ? r.getHrRating() : "N/A"));
                ctx.currentStream.endText();
                ctx.yPosition -= 26;

                // Employee Comment
                String empComment = r != null ? r.getEmployeeComment() : null;
                if (empComment != null && !empComment.trim().isEmpty()) {
                    drawCommentBlock(ctx, "Employee Comment:", empComment);
                }

                // Manager Comment
                String mgrComment = r != null ? r.getManagerComment() : null;
                if (mgrComment != null && !mgrComment.trim().isEmpty()) {
                    drawCommentBlock(ctx, "Manager Comment:", mgrComment);
                }

                // HR Comment
                String hrComment = r != null ? r.getHrComment() : null;
                if (hrComment != null && !hrComment.trim().isEmpty()) {
                    drawCommentBlock(ctx, "HR Comment:", hrComment);
                }

                ctx.yPosition -= 10;
            }

            // Section 2: HR Review KPIs
            if (!hrKpis.isEmpty()) {
                ctx.checkSpace(50);
                ctx.yPosition -= 10;
                ctx.currentStream.beginText();
                ctx.currentStream.setFont(ctx.fontBold, 11);
                ctx.currentStream.newLineAtOffset(50, ctx.yPosition);
                ctx.currentStream.showText("2. HR Review KPI Evaluation (Corporate Staff):");
                ctx.currentStream.endText();
                ctx.yPosition -= 20;

                for (PmsKpi kpi : hrKpis) {
                    if (kpi == null)
                        continue;
                    EmployeeKpiRating r = safeRatings.stream()
                            .filter(rt -> rt != null && rt.getKpi() != null && rt.getKpi().getId().equals(kpi.getId()))
                            .findFirst().orElse(null);
                    Double hrRat = r != null && r.getHrRating() != null ? r.getHrRating() : 5.0;

                    ctx.checkSpace(40);

                    String kpiNameStr = kpi.getKpiName() != null ? kpi.getKpiName() : "HR Review KPI";
                    double weightVal = kpi.getWeightage() != null ? kpi.getWeightage() : 0.0;

                    ctx.currentStream.beginText();
                    ctx.currentStream.setFont(ctx.fontBold, 9);
                    ctx.currentStream.newLineAtOffset(50, ctx.yPosition);
                    ctx.currentStream.showText("- " + sanitizeText(kpiNameStr) + " (Weight: " + weightVal
                            + "%) - HR Rating: " + hrRat + " / 5.00");
                    ctx.currentStream.endText();
                    ctx.yPosition -= 14;

                    String hrKpiComment = r != null ? r.getHrComment() : null;
                    if (hrKpiComment != null && !hrKpiComment.trim().isEmpty()) {
                        drawCommentBlock(ctx, "HR Comment:", hrKpiComment);
                    }

                    ctx.yPosition -= 8;
                }
            }

            // Section 3: Overall Review Remarks
            if (!reviews.isEmpty()) {
                ctx.checkSpace(50);
                ctx.yPosition -= 10;
                ctx.currentStream.beginText();
                ctx.currentStream.setFont(ctx.fontBold, 11);
                ctx.currentStream.newLineAtOffset(50, ctx.yPosition);
                ctx.currentStream.showText("3. Overall Evaluator Reviews & Remarks:");
                ctx.currentStream.endText();
                ctx.yPosition -= 18;

                for (EmployeeReview rev : reviews) {
                    if (rev == null)
                        continue;
                    ctx.checkSpace(40);

                    String roleName = rev.getReviewer() != null && rev.getReviewer().getRole() != null
                            ? rev.getReviewer().getRole().name().replace("ROLE_", "")
                            : "REVIEWER";
                    String revName = rev.getReviewer() != null && rev.getReviewer().getName() != null
                            ? rev.getReviewer().getName()
                            : "Evaluator";
                    String label = roleName + " (" + sanitizeText(revName) + "):";
                    drawCommentBlock(ctx, label, rev.getComments());
                    ctx.yPosition -= 6;
                }
            }

            ctx.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private static class PdfPageContext {
        final PDDocument document;
        final PDType1Font fontBold;
        final PDType1Font fontRegular;
        final PDType1Font fontOblique;
        PDPage currentPage;
        PDPageContentStream currentStream;
        int yPosition;

        PdfPageContext(PDDocument document) throws IOException {
            this.document = document;
            this.fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            this.fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            this.fontOblique = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);
            newPage();
        }

        void newPage() throws IOException {
            if (currentStream != null) {
                currentStream.close();
            }
            currentPage = new PDPage(PDRectangle.A4);
            document.addPage(currentPage);
            currentStream = new PDPageContentStream(document, currentPage);
            yPosition = 780;
        }

        void checkSpace(int neededHeight) throws IOException {
            if (yPosition - neededHeight < 50) {
                newPage();
            }
        }

        void close() throws IOException {
            if (currentStream != null) {
                currentStream.close();
            }
        }
    }

    private void drawCommentBlock(
            PdfPageContext ctx,
            String label,
            String commentText) throws IOException {

        if (commentText == null || commentText.trim().isEmpty()) {
            return;
        }

        List<String> wrappedLines = wrapText(sanitizeText(commentText), 85);
        if (wrappedLines.isEmpty()) {
            return;
        }

        int neededHeight = 14 + (wrappedLines.size() * 10);
        ctx.checkSpace(neededHeight);

        ctx.currentStream.beginText();
        ctx.currentStream.setFont(ctx.fontBold, 8);
        ctx.currentStream.newLineAtOffset(65, ctx.yPosition);
        ctx.currentStream.showText(sanitizeText(label));
        ctx.currentStream.setFont(ctx.fontOblique, 8);
        for (String line : wrappedLines) {
            ctx.currentStream.newLineAtOffset(0, -10);
            ctx.currentStream.showText("\"" + line + "\"");
        }
        ctx.currentStream.endText();

        ctx.yPosition -= (neededHeight + 4);
    }

    private String sanitizeText(String input) {
        if (input == null)
            return "";
        return input.replaceAll("[\\r\\n]+", " ").replaceAll("[^\\x20-\\x7E]", "");
    }

    private List<String> wrapText(String text, int maxCharsPerLine) {
        if (text == null || text.trim().isEmpty())
            return Collections.emptyList();
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
        boolean isHrOrManager = reqUser != null
                && (reqUser.getRole() == Role.ROLE_HR || reqUser.getRole() == Role.ROLE_MANAGER);

        if (!assignment.getEmployee().getId().equals(employeeId) && !isHrOrManager) {
            throw new AccessDeniedException("Unauthorized access to report");
        }

        List<PmsKpi> allKpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        double mgrSum = 0.0;
        double hrSum = 0.0;
        for (PmsKpi kpi : allKpis) {
            EmployeeKpiRating r = ratings.stream().filter(rt -> rt.getKpi().getId().equals(kpi.getId())).findFirst()
                    .orElse(null);
            double w = kpi.getWeightage() / 100.0;
            if (r != null) {
                if (r.getManagerRating() != null)
                    mgrSum += r.getManagerRating() * w;
                if (r.getHrRating() != null)
                    hrSum += r.getHrRating() * w;
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
            rInfo6.createCell(1)
                    .setCellValue(assignment.getOverallScore() != null ? assignment.getOverallScore() : 0.0);

            Row rInfo7 = sheet.createRow(rowNum++);
            rInfo7.createCell(0).setCellValue("Performance Grade:");
            rInfo7.createCell(1)
                    .setCellValue(assignment.getPerformanceGrade() != null ? assignment.getPerformanceGrade() : "N/A");

            rowNum++; // Blank row

            // KPI Header row
            Row headerRow = sheet.createRow(rowNum++);
            String[] columns = { "Category", "KPI Name", "Measurement Criteria", "Weightage", "Self Rating",
                    "Employee Comment", "Manager Rating", "Manager Comment", "HR Rating", "HR Comment" };
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
                row.createCell(0)
                        .setCellValue("HR_REVIEW_KPI".equals(kpi.getKpiCategory()) ? "HR Review KPI" : "Role KPI");
                row.createCell(1).setCellValue(kpi.getKpiName());
                row.createCell(2).setCellValue(kpi.getDescription());
                row.createCell(3).setCellValue(kpi.getWeightage() + "%");
                row.createCell(4).setCellValue(r != null && r.getSelfRating() != null ? r.getSelfRating() : 0.0);
                row.createCell(5)
                        .setCellValue(r != null && r.getEmployeeComment() != null ? r.getEmployeeComment() : "");
                row.createCell(6).setCellValue(r != null && r.getManagerRating() != null ? r.getManagerRating() : 0.0);
                row.createCell(7).setCellValue(r != null && r.getManagerComment() != null ? r.getManagerComment() : "");
                row.createCell(8).setCellValue(r != null && r.getHrRating() != null ? r.getHrRating()
                        : ("HR_REVIEW_KPI".equals(kpi.getKpiCategory()) ? 5.0 : 0.0));
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
