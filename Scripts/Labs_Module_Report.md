# HOSPITRA: Labs Module Report

## 1. Module Overview
The **Labs Module** is the clinical heart of diagnostics within HOSPITRA. It manages the lifecycle of a medical test—from sample collection to template-driven reporting and patient notification.

---

## 2. Key Technical Features
### A. Template-Driven Reporting Engine
- **Test-Specific Templates**: Instead of generic text, the system uses a sophisticated matching algorithm to serve test-specific templates for `CBC`, `HbA1c`, `ECG`, `X-Ray`, and more.
- **Pre-filled Parameters**: Each template comes with pre-defined parameters, units (e.g., `mg/dL`), and "Normal Ranges." This reduces manual data entry and minimizes the risk of clinical errors.

### B. Sample & Workflow Lifecycle
- **Status Tracking**: Tracks the progression of an assignment through multiple stages: `Pending` -> `Sample Collected` -> `Report Generated` -> `Completed`.
- **Priority Sorting**: Uses a priority-based queueing system (`Emergency` vs `Routine`) to ensure critical cases are processed first on the Lab technician's dashboard.

### C. Multi-Page PDF Generation
- **Dynamic Content**: Uses `html2pdf.js` with advanced page-break management to handle reports that may span multiple pages (e.g., Comprehensive Body Checkups).
- **Professional Formatting**: Includes a professional "Laboratory Report" header, technician's digital signature placeholder, and automated "Issued" status pills.

---

## 3. Data Flow & Integration
### The "Result" Journey
1. **Trigger**: An assignment is created by the Reception portal.
2. **Action**: The Lab technician "Collects Sample," which updates the backend timestamp.
3. **Execution**: The technician enters parameters into the template.
4. **Resolution**: Upon "Submit," the report is stored as a JSON string in the `LabAssignment` model and is instantly available for the Patient and Doctor to view as a generated PDF.

---

## 4. Technical Highlights for Interviews
- **JSON Schema Flexibility**: By storing results as a JSON string, the system can handle an infinite variety of test types and reporting formats without requiring database schema migrations.
- **State-Driven Steps**: The report builder uses a multi-step component that validates each test's results before allowing the final submission.
- **Instant Availability**: As soon as the "Submit" API call succeeds, the data is pushed to the patient, achieving "Zero Lag" in medical reporting.

---

## 5. Labs Module Q&A

**Q: How do you handle a "Full Body Checkup" that contains multiple tests?**
> **A:** The system treats it as a "Package." The report builder detects multiple tests in the assignment and iterates through them, allowing the technician to fill in results for each test in sequence before generating a master multi-page report.

**Q: What happens if a value is outside the "Normal Range"?**
> **A:** The system is designed to provide "Status" flags (High/Low/Normal). Future iterations can include conditional formatting (red text) on the generated PDF for abnormal values to alert the doctor.

**Q: Can a Lab Technician delete a report?**
> **A:** For auditing purposes, reports are generally "Updated" rather than "Deleted." Once a report status is marked as `Completed`, it becomes an immutable record in the patient's digital health folder.
