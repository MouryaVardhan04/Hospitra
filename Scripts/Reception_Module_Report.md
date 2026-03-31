# HOSPITRA: Reception Module Report

## 1. Module Overview
The **Reception Module** acts as the hospital's central nervous system for front-office operations. It handles patient onboarding, appointment management, and routing prescriptions to the Lab and Pharmacy departments.

---

## 2. Key Technical Features
### A. Multi-channel Patient Search
- **Unified Lookup**: Receptionists can find patients by `Name`, `Phone`, or `ID`. The system implements a debounced search (400ms) to reduce API load while maintaining a "snappy" user experience.
- **Contextual Selection**: Upon selecting a patient, the system automatically pulls their latest appointment, referring doctor, and insurance status from the backend.

### B. Lab & Billing Routing
- **Pre-filled Invoices**: Instead of manual entry, the receptionist can "Import Consultation" data. This automatically populates the Lab Assignment or Billing form with the doctor's exact recommendations, eliminating human error.
- **Priority Management**: Supports tagging assignments as `Routine`, `Urgent`, or `STAT`. This priority flag is then used to sort the worklist for Lab technicians.

### C. Financial Initialization
- **Department-based Billing**: Handles multiple billing categories (OPD, IPD, Lab, Surgery) with distinct price hooks from the `fees-catalog`.
- **Emailed Invoices**: Once billing is initiated, the system triggers a Nodemailer event to send a professional PDF invoice directly to the patient's registered email.

---

## 3. Data Flow & Integration
### The "Routing" Workflow
1. **Trigger**: Doctor saves a consultation with "CBC Test" and "Surgery: Appendectomy."
2. **Action**: Receptionist opens "Lab Assignment" and "Billing Initiation."
3. **Draft**: The system fetches these items. For the Lab, it generates a `LabAssignment` with status `Pending`. For Surgery, it generates a `BillingInvoice`.
4. **Conclusion**: Once the receptionist hits "Assign" or "Bill," the items move into the work queues of the respectively assigned departments.

---

## 4. Technical Highlights for Interviews
- **Efficient State Management**: Uses React's `useMemo` and `useCallback` to prevent unnecessary re-renders when managing large catalogs of tests and fees.
- **Inter-module Synergy**: Demonstrated how the Reception portal serves as a bridge, transforming clinical "intent" from the Doctor into operational "action" for the Lab and Pharmacy.
- **Clean PDF Templates**: Custom-designed CSS-in-HTML templates for invoices that include clinic branding and legally compliant itemized billing.

---

## 5. Reception Module Q&A

**Q: How do you prevent double-billing for a surgery?**
> **A:** When a surgery is invoiced, the system sends a `surgery-invoiced` POST request to the backend. This updates the consultation record with a flag, hiding that item from future billing searches in the Reception portal.

**Q: How is the patient search optimized?**
> **A:** We use a "Smart Search" on the backend that uses MongoDB regex indexing. On the frontend, we use `useEffect` with a cleanup function to cancel the previous timer if the user types quickly, preventing redundant API calls.

**Q: Can the receptionist override doctor's orders?**
> **A:** While the orders are pre-filled, the receptionist has the flexibility (with proper permissions) to add or remove items before finalizing the bill, ensuring operational flexibility in clinical practice.
