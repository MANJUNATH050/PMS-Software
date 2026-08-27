package com.company.pms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/employee/pms")
public class EmployeePmsController {

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("currentCycle", "August 2026");
        data.put("pmsStatus", "SELF_ASSESSMENT_DRAFT");
        data.put("totalKpis", 12);
        data.put("completedKpis", 12);
        data.put("completedWeightage", 100);
        data.put("latestFinalizedScore", 4.50);
        data.put("latestFinalizedGrade", "Exceeds Expectations");
        data.put("managerReviewStatus", "PENDING");
        data.put("hrReviewStatus", "PENDING");
        data.put("actionRequired", "Complete and submit your monthly self-assessment.");
        return ResponseEntity.ok(data);
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentAssignment() {
        return ResponseEntity.ok(createMockAssignment(1L, "August 2026"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAssignmentDetail(@PathVariable Long id) {
        return ResponseEntity.ok(createMockAssignment(id, "August 2026"));
    }

    @PutMapping("/{id}/draft")
    public ResponseEntity<?> saveDraft(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(createMockAssignment(id, "August 2026"));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitAssessment(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Map<String, Object> assignment = createMockAssignment(id, "August 2026");
        assignment.put("status", "SELF_ASSESSMENT_SUBMITTED");
        return ResponseEntity.ok(assignment);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        List<Map<String, Object>> history = List.of(
            Map.of("id", 101, "assignmentId", 1, "cycleMonth", "July 2026", "finalScore", 4.45, "grade", "Exceeds Expectations", "finalizedDate", "2026-07-31", "filePath", null),
            Map.of("id", 102, "assignmentId", 2, "cycleMonth", "June 2026", "finalScore", 4.30, "grade", "Meets Expectations", "finalizedDate", "2026-06-30", "filePath", null)
        );
        return ResponseEntity.ok(history);
    }

    private Map<String, Object> createMockAssignment(Long id, String month) {
        Map<String, Object> emp = Map.of(
            "id", 1,
            "name", "Employee User",
            "email", "employee.demo@company.com",
            "department", "Engineering",
            "team", "Backend Team",
            "designation", "Software Engineer",
            "managerName", "Jane Manager",
            "joiningDate", "2026-01-15",
            "accountStatus", "ACTIVE"
        );

        List<Map<String, Object>> kpis = List.of(
            Map.of("kpiId", 1, "kpiName", "Sprint Task Completion", "description", "Tasks completed within assigned sprint timelines", "weightage", 10, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Good progress", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 2, "kpiName", "Deadline Adherence", "description", "Delivering assigned tasks on or before agreed deadlines", "weightage", 15, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "On time", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 3, "kpiName", "Task Quality with Defects", "description", "Code quality measured by low bug/defect count in QA", "weightage", 10, "selfRating", 4.5, "managerRating", 4.0, "hrRating", 4.5, "comments", "High quality", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 4, "kpiName", "Prompt Quality - AI tasks", "description", "Effectiveness and accuracy in AI tool prompt usage", "weightage", 15, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Great AI prompts", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 5, "kpiName", "Jira Time Logging", "description", "Timely logging of work hours on Jira tickets", "weightage", 10, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Daily log ok", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 6, "kpiName", "Jira Discipline", "description", "Maintaining ticket status accuracy and comments on Jira", "weightage", 5, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Clean ticket status", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 7, "kpiName", "Accountability & Ownership", "description", "Taking full ownership of assigned modules", "weightage", 10, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Good ownership", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 8, "kpiName", "Leave Pattern", "description", "Adherence to planned leave policy and notification", "weightage", 5, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Regular attendance", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 9, "kpiName", "Team Collaboration and Engagement", "description", "Active participation in team discussions and support", "weightage", 5, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Great team player", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 10, "kpiName", "Punctuality", "description", "On-time attendance in daily standups and meetings", "weightage", 5, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Punctual", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 11, "kpiName", "New Initiatives and Participation", "description", "Proactive participation in internal knowledge sharing", "weightage", 5, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Initiative taken", "ratingStatus", "COMPLETED"),
            Map.of("kpiId", 12, "kpiName", "Rewards", "description", "Recognition and awards received during period", "weightage", 5, "selfRating", 5.0, "managerRating", 4.0, "hrRating", 4.5, "comments", "Recognized", "ratingStatus", "COMPLETED")
        );

        Map<String, Object> res = new HashMap<>();
        res.put("assignmentId", id);
        res.put("cycleMonth", month);
        res.put("status", "SELF_ASSESSMENT_DRAFT");
        res.put("startDate", "2026-08-01");
        res.put("endDate", "2026-08-31");
        res.put("submissionDeadline", "2026-09-10");
        res.put("overallScore", 4.80);
        res.put("performanceGrade", "Exceeds Expectations");
        res.put("finalizedDate", null);
        res.put("employee", emp);
        res.put("kpis", kpis);
        res.put("reviews", List.of());
        return res;
    }
}
