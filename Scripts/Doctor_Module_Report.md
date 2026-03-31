# HOSPITRA: Doctor Module Report

## 1. Module Overview
The **Doctor Module** is the professional workspace for medical practitioners. It focuses on clinical decision-making, real-time patient engagement, and seamless ordering of diagnostic and therapeutic interventions.

---

## 2. Key Technical Features
### A. Consultation Wizard (3-Step Workflow)
- **Step 1: Diagnosis & Notes**: Doctors record symptoms, clinical findings, and provisional diagnoses using a streamlined rich-text interface.
- **Step 2: Lab & Pharmacy Orders**: Integrated search for tests and medicines. Selecting an item automatically attaches its metadata (price, category) to the consultation record.
- **Step 3: Procedures & Surgery**: Specific scheduling for advanced interventions, which routes a "Billing Request" to the Reception and a "Surgery Schedule" to the surgical department.

### B. Real-Time Chat (Socket.io)
- **Persistent Connection**: Uses a unique `socketRef` to maintain a stable link between the doctor and the patient.
- **File Sharing**: Integrated with Cloudinary for clinical images and PDF sharing (prescriptions, reports) directly within the chat bubble.
- **Unread Message Tracking**: Backend logic tracks message status to ensure doctors never miss a patient's query.

### C. Unified Patient History (EHR)
- **Contextual Access**: While chatting or consulting, the doctor can pull the patient's entire profile—past appointments, lab history, and previous consultation notes—reducing the time spent switching between tabs.

---

## 3. Data Flow & Integration
### The "Ordering" Workflow
1. **Selection**: Doctor selects a test (e.g., "CBC") from the global `lab-catalog`.
2. **Submission**: On "Submit Consultation", the data is sent to `/api/admin/update-consultation`.
3. **Trigger**: The backend updates the `Appointment` status and creates a `Notification` for the Lab technician.
4. **Resolution**: Once the Lab technician uploads the report, it appears instantly on the Doctor's "Lab Results" dashboard.

---

## 4. Technical Highlights for Interviews
- **Structured JSON State**: The consultation state is managed as a complex JSON object, allowing for a single atomic update to the backend that covers diagnosis, lab tests, and prescriptions.
- **Responsive Layout**: Designed with a multi-pane layout (Chat on left, Profile on right) to maximize information density for the clinician.
- **Role-Based Security**: Access is restricted using custom JWT middleware (`doctorToken`), ensuring patient confidentiality.

---

## 5. Doctor Module Q&A

**Q: How does the system handle "Real-time" notifications for doctors?**
> **A:** We use Socket.io events. When a patient sends a message or a lab report is ready, the backend emits an event to the doctor's specific Room ID. The frontend listens for this and triggers a toast notification or a badge update.

**Q: How is the Consultation Wizard implemented?**
> **A:** It's a state-driven multi-step component. Each step validates its input before allowing the user to proceed. The final step aggregates all data into a single payload, ensuring data integrity across the `Consultation`, `Appointment`, and `LabAssignment` models.

**Q: How do you handle large medical images in the chat?**
> **A:** Images are uploaded to Cloudinary on the client-side. Only the URL is sent through the socket. This keeps the message payload light and ensures images are optimized for fast loading.
