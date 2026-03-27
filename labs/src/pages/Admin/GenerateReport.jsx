import React, { useContext, useEffect, useMemo, useState } from 'react'
import logoPng from '../../assets/Logo.png'
import html2pdf from 'html2pdf.js'
import { LabsContext } from '../../context/LabsContext'
import { toast } from 'react-toastify'

const GenerateReport = () => {
  const { getLabAssignments, updateLabAssignment } = useContext(LabsContext)
  const [assignments, setAssignments] = useState([])
  const [search, setSearch] = useState('')
  const [reportModal, setReportModal] = useState(null)
  const [reportSteps, setReportSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  const baseReport = (assignment, testName = '') => ({
    patient_info: {
      patient_id: assignment.patientId || '',
      name: assignment.patientName || '',
      age: assignment.patientAge || '',
      gender: assignment.patientGender || '',
      contact: assignment.patientPhone || '',
      height: assignment.patientHeight ?? '',
      weight: assignment.patientWeight ?? ''
    },
    doctor_info: {
      doctor_id: assignment.doctorId || '',
      doctor_name: assignment.doctorName || ''
    },
    test_info: {
      test_name: testName || '',
      category: '',
      date: new Date().toISOString().slice(0, 10),
      lab_technician: ''
    },
    results: [],
    remarks: '',
    report_url: ''
  })

  const getTemplateForTest = (assignment, testName) => {
    const name = (testName || '').toLowerCase()
    const report = baseReport(assignment, testName)

    if (name === 'cbc') {
      return {
        ...report,
        test_info: { ...report.test_info, category: 'blood_tests' },
        results: [
          { parameter: 'Hemoglobin', value: '', unit: 'g/dL', normal_range: '13-17', status: '' },
          { parameter: 'RBC', value: '', unit: 'million/uL', normal_range: '4.5-5.9', status: '' },
          { parameter: 'WBC', value: '', unit: '/uL', normal_range: '4000-11000', status: '' },
          { parameter: 'Platelets', value: '', unit: 'lakhs/uL', normal_range: '1.5-4', status: '' },
          { parameter: 'Hematocrit', value: '', unit: '%', normal_range: '40-50', status: '' }
        ]
      }
    }

    if (name === 'hba1c') {
      return {
        ...report,
        test_info: { ...report.test_info, category: 'blood_tests' },
        results: [
          { parameter: 'HbA1c', value: '', unit: '%', normal_range: '4-5.6', status: '' },
          { parameter: 'Estimated Avg Glucose', value: '', unit: 'mg/dL', normal_range: '70-140', status: '' }
        ],
        remarks: 'Diabetes monitoring'
      }
    }

    if (name === 'ecg') {
      return {
        ...report,
        test_info: { ...report.test_info, category: 'cardiac_tests' },
        results: [
          { parameter: 'Heart Rate', value: '', unit: 'bpm', normal_range: '60-100', status: '' },
          { parameter: 'PR Interval', value: '', unit: 'ms', normal_range: '120-200', status: '' },
          { parameter: 'QRS Duration', value: '', unit: 'ms', normal_range: '80-120', status: '' }
        ],
        impression: ''
      }
    }

    if (name === 'chest x-ray') {
      return {
        ...report,
        test_info: { ...report.test_info, category: 'xray' },
        findings: '',
        impression: '',
        radiologist: '',
        image_url: ''
      }
    }

    if (name === 'mri brain') {
      return {
        ...report,
        test_info: { ...report.test_info, category: 'mri_scan' },
        technique: 'MRI performed with contrast',
        findings: '',
        impression: '',
        suggestion: '',
        radiologist: '',
        image_url: ''
      }
    }

    if (name === 'pregnancy scan') {
      return {
        ...report,
        test_info: { ...report.test_info, category: 'ultrasound' },
        results: [
          { parameter: 'Fetal Heart Rate', value: '', unit: 'bpm', normal_range: '110-160', status: '' },
          { parameter: 'Gestational Age', value: '', unit: 'weeks', normal_range: '', status: '' }
        ],
        findings: '',
        impression: ''
      }
    }

    if (name === 'urine routine') {
      return {
        ...report,
        test_info: { ...report.test_info, category: 'urine_tests' },
        results: [
          { parameter: 'Color', value: '', normal: 'Yellow' },
          { parameter: 'pH', value: '', normal_range: '4.5-8' },
          { parameter: 'Protein', value: '', normal: 'Negative' },
          { parameter: 'Sugar', value: '', normal: 'Negative' }
        ]
      }
    }

    if (name === 'dengue test') {
      return {
        ...report,
        test_info: { ...report.test_info, category: 'advanced_tests' },
        results: [
          { parameter: 'NS1 Antigen', value: '', normal: 'Negative' },
          { parameter: 'IgM', value: '', normal: 'Negative' },
          { parameter: 'IgG', value: '', normal: 'Negative' }
        ],
        remarks: ''
      }
    }

    if (name === 'full body checkup') {
      return {
        ...report,
        test_info: { ...report.test_info, category: 'packages' },
        included_tests: [
          'CBC',
          'LFT',
          'KFT',
          'Lipid Profile'
        ],
        reports: [{}, {}],
        overall_summary: '',
        doctor_remark: ''
      }
    }

    return report
  }

  const buildReportTemplate = (assignment) => {
    const tests = Array.isArray(assignment.items) && assignment.items.length
      ? assignment.items.map(i => i.name)
      : (assignment.tests || [])
    const testName = tests[0] || ''
    return getTemplateForTest(assignment, testName)
  }

  useEffect(() => {
    const fetchAssignments = async () => {
      const data = await getLabAssignments()
      if (data.success) {
        setAssignments(data.assignments || [])
      }
    }
    fetchAssignments()
  }, [])

  const inProcessAssignments = useMemo(
    () => assignments.filter(a => a.status === 'Sample Collected'),
    [assignments]
  )

  const sortByPriority = (list) => {
    const priorityRank = (p) => (p === 'Emergency' ? 0 : 1)
    return [...list].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
  }

  const filteredInProcess = useMemo(() => {
    if (!search.trim()) return sortByPriority(inProcessAssignments)
    const q = search.trim().toLowerCase()
    return sortByPriority(inProcessAssignments.filter(a =>
      (a.patientName || '').toLowerCase().includes(q) ||
      (a.patientId || '').toLowerCase().includes(q) ||
      (a.sampleId || '').toLowerCase().includes(q)
    ))
  }, [inProcessAssignments, search])

  const refreshAssignments = async () => {
    const data = await getLabAssignments()
    if (data.success) {
      setAssignments(data.assignments || [])
    }
  }

  const handleReport = async (assignmentId, reportText) => {
    if (!reportText.trim()) {
      toast.error('Enter report details')
      return
    }
    const data = await updateLabAssignment({ assignmentId, reportText })
    if (data.success) {
      toast.success('Report generated')
      refreshAssignments()
    } else {
      toast.error(data.message)
    }
  }

  const openReportModal = (assignment) => {
    const tests = Array.isArray(assignment.items) && assignment.items.length
      ? assignment.items.map(i => i.name)
      : (assignment.tests || [])

    const steps = tests.length
      ? tests.map((t) => getTemplateForTest(assignment, t))
      : [buildReportTemplate(assignment)]

    setReportModal(assignment)
    setReportSteps(steps)
    setCurrentStep(0)
    setShowPreview(false)
  }

  const closeReportModal = () => {
    setReportModal(null)
    setReportSteps([])
    setCurrentStep(0)
    setShowPreview(false)
  }

  const updateStepField = (path, value) => {
    setReportSteps(prev => {
      const next = [...prev]
      const current = { ...next[currentStep] }
      const segments = path.split('.')
      let obj = current
      while (segments.length > 1) {
        const key = segments.shift()
        obj[key] = { ...obj[key] }
        obj = obj[key]
      }
      obj[segments[0]] = value
      next[currentStep] = current
      return next
    })
  }

  const updateResultField = (index, key, value) => {
    setReportSteps(prev => {
      const next = [...prev]
      const current = { ...next[currentStep] }
      const results = Array.isArray(current.results) ? [...current.results] : []
      results[index] = { ...results[index], [key]: value }
      current.results = results
      next[currentStep] = current
      return next
    })
  }

  const goNext = () => {
    if (currentStep < reportSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setShowPreview(true)
    }
  }

  const goBack = () => {
    if (showPreview) {
      setShowPreview(false)
      return
    }
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  const submitReport = async () => {
    if (!reportModal?._id) return
    const finalReport = reportSteps.length === 1
      ? reportSteps[0]
      : {
          patient_info: reportSteps[0]?.patient_info || {},
          doctor_info: reportSteps[0]?.doctor_info || {},
          reports: reportSteps
        }
    await handleReport(reportModal._id, JSON.stringify(finalReport, null, 2))
    closeReportModal()
  }

  const buildReportPdfHtml = (assignment, reports) => {
    const createdAt = new Date()
    const reportId = assignment?.sampleId
      ? `LAB-${assignment.sampleId}`
      : assignment?._id
        ? `LAB-${assignment._id.slice(-6).toUpperCase()}`
        : `LAB-${createdAt.getTime()}`

    const pagesHtml = reports.map((step, index) => {
      const patient = step?.patient_info || {}
      const doctor = step?.doctor_info || {}
      const test = step?.test_info || {}
      const results = Array.isArray(step?.results) ? step.results : []
      const dateLabel = test.date || createdAt.toISOString().slice(0, 10)
      const pageLabel = `${index + 1} / ${reports.length}`

      const resultsHtml = results.length
        ? results.map((r, idx) => `
            <tr class="${idx % 2 === 1 ? 'alt' : ''}">
              <td class="num">${idx + 1}</td>
              <td class="tname"><strong>${r.parameter || '-'}</strong></td>
              <td class="cat">${r.value || '-'}</td>
              <td class="cat">${r.unit || '-'}</td>
              <td class="cat">${r.normal_range || r.normal || '-'}</td>
              <td class="amt">${r.status || '-'}</td>
            </tr>`).join('')
        : `
            <tr>
              <td class="num">1</td>
              <td class="tname"><strong>Result</strong></td>
              <td class="cat">-</td>
              <td class="cat">-</td>
              <td class="cat">-</td>
              <td class="amt">-</td>
            </tr>`

      return `
      <section class="page">
        <div class="content">
          <div class="header">
            <div class="header-logo"><img src="${logoPng}" alt="Hospitra" /></div>
            <div class="header-right">
              <div class="inv-title">Laboratory Report</div>
              <div class="inv-id">${reportId}</div>
              <div class="inv-date">Date: ${new Date(dateLabel).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <span class="status-pill">Issued</span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <div class="box-title">Patient Details</div>
              <div class="irow"><span class="ilabel">Name</span><span class="ivalue">${patient.name || '-'}</span></div>
              <div class="irow"><span class="ilabel">Patient ID</span><span class="ivalue">${patient.patient_id || '-'}</span></div>
              <div class="irow"><span class="ilabel">Age / Gender</span><span class="ivalue">${patient.age || '-'} / ${patient.gender || '-'}</span></div>
              <div class="irow"><span class="ilabel">Contact</span><span class="ivalue">${patient.contact || '-'}</span></div>
            </div>
            <div class="info-box">
              <div class="box-title">Doctor & Test</div>
              <div class="irow"><span class="ilabel">Doctor</span><span class="ivalue">${doctor.doctor_name || '-'}</span></div>
              <div class="irow"><span class="ilabel">Doctor ID</span><span class="ivalue">${doctor.doctor_id || '-'}</span></div>
              <div class="irow"><span class="ilabel">Test</span><span class="ivalue">${test.test_name || '-'}</span></div>
              <div class="irow"><span class="ilabel">Category</span><span class="ivalue">${test.category || '-'}</span></div>
            </div>
          </div>

          <div class="meta-strip">
            <div class="meta-item">Lab Technician: <strong>${test.lab_technician || '-'}</strong></div>
            <div class="meta-item">Report Date: <span class="meta-badge">${dateLabel}</span></div>
            <div class="meta-item">Page: <strong>${pageLabel}</strong></div>
          </div>

          <div class="table-label">Test Results</div>
          <table>
            <thead>
              <tr>
                <th style="width:26px">#</th>
                <th style="width:30%">Parameter</th>
                <th style="width:16%">Value</th>
                <th style="width:14%">Unit</th>
                <th style="width:20%">Normal</th>
                <th class="r" style="width:14%">Status</th>
              </tr>
            </thead>
            <tbody>
              ${resultsHtml}
            </tbody>
          </table>

          ${step?.findings !== undefined ? `<div class="note"><strong>Findings:</strong> ${step.findings || '-'}</div>` : ''}
          ${step?.impression !== undefined ? `<div class="note"><strong>Impression:</strong> ${step.impression || '-'}</div>` : ''}
          ${step?.remarks !== undefined ? `<div class="note"><strong>Remarks:</strong> ${step.remarks || '-'}</div>` : ''}
          ${step?.overall_summary !== undefined ? `<div class="note"><strong>Overall Summary:</strong> ${step.overall_summary || '-'}</div>` : ''}
          ${step?.doctor_remark !== undefined ? `<div class="note"><strong>Doctor Remark:</strong> ${step.doctor_remark || '-'}</div>` : ''}
          ${step?.suggestion !== undefined ? `<div class="note"><strong>Suggestion:</strong> ${step.suggestion || '-'}</div>` : ''}
          ${step?.technique !== undefined ? `<div class="note"><strong>Technique:</strong> ${step.technique || '-'}</div>` : ''}
          ${step?.radiologist !== undefined ? `<div class="note"><strong>Radiologist:</strong> ${step.radiologist || '-'}</div>` : ''}
          ${step?.image_url ? `<div class="note"><strong>Image URL:</strong> ${step.image_url}</div>` : ''}
        </div>

        <div class="footer">
          <div class="footer-left"><strong>Hospitra Digital Health Systems</strong> &nbsp;&middot;&nbsp; Laboratory Report</div>
          <div class="footer-right">Computer Generated Report<br/>No Physical Signature Required</div>
        </div>
      </section>`
    }).join('')

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Lab Report</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; line-height: 1.35; }
      .report-pages { width: 210mm; }
      .page { width: 210mm; height: 296mm; display: flex; flex-direction: column; padding: 8mm 10mm; overflow: hidden; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      .content { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }

      .header { display: flex; justify-content: space-between; align-items: center; width: 100%; padding-bottom: 8px; border-bottom: 2px solid #1e3a5f; margin-bottom: 8px; }
      .header-logo img { height: 42px; object-fit: contain; }
      .header-right { text-align: right; }
      .inv-title { font-size: 18px; font-weight: 700; color: #1e3a5f; }
      .inv-id { font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px; }
      .inv-date { font-size: 11px; color: #64748b; margin-top: 2px; }
      .status-pill { display: inline-block; background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }

      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
      .info-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; }
      .box-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0; }
      .irow { display: flex; gap: 6px; margin-bottom: 4px; }
      .ilabel { min-width: 100px; color: #64748b; font-size: 11px; flex-shrink: 0; }
      .ivalue { color: #0f172a; font-weight: 600; font-size: 11px; word-break: break-word; }

      .meta-strip { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; flex-wrap: wrap; margin-bottom: 8px; }
      .meta-item { font-size: 11px; color: #475569; display: flex; align-items: center; gap: 5px; }
      .meta-badge { display: inline-block; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 700; background: #eff6ff; color: #1d4ed8; }

      .table-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; }
      thead tr { background: #1e3a5f; }
      th { padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #93c5fd; text-align: left; }
      th.r { text-align: right; }
      td { padding: 8px 10px; font-size: 11px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      tr.alt td { background: #f8fafc; }
      td.num { color: #cbd5e1; font-size: 11px; width: 26px; }
      td.tname strong { font-size: 12px; }
      td.cat { color: #64748b; font-size: 11px; }
      td.amt { font-weight: 700; color: #0f172a; text-align: right; }

      .note { margin-top: 6px; font-size: 11px; color: #334155; }
      .footer { border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
      .footer-left { font-size: 10px; color: #64748b; }
      .footer-left strong { color: #1e3a5f; }
      .footer-right { font-size: 10px; color: #94a3b8; text-align: right; }
    </style>
  </head>
  <body>
    <div class="report-pages">
      ${pagesHtml}
    </div>
  </body>
</html>`
  }

  const downloadReportPdf = () => {
    if (!reportModal || reportSteps.length === 0) {
      toast.error('No report to download')
      return
    }
    const html = buildReportPdfHtml(reportModal, reportSteps)
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-10000px'
    container.style.top = '0'
    container.innerHTML = html
    const target = container.querySelector('.report-pages')
    if (!target) {
      toast.error('Unable to generate report')
      return
    }
    document.body.appendChild(container)
    const fileName = `lab_report_${reportModal?.sampleId || reportModal?._id || Date.now()}.pdf`
    const options = {
      margin: [0, 0, 0, 0],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'avoid-all'] }
    }

    html2pdf()
      .set(options)
      .from(target)
      .save()
      .finally(() => {
        container.remove()
      })
  }

  return (
    <div className='m-5 w-full'>
      <div className='flex items-center justify-between gap-3 mb-4'>
        <p className='text-xl font-semibold text-gray-700'>Generate Report</p>
      </div>

      <div className='bg-white border rounded-xl'>
        <div className='p-4'>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full mb-4 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
            placeholder='Search by patient or sample ID'
          />
          {filteredInProcess.length === 0 ? (
            <p className='text-sm text-gray-400'>No in-process samples.</p>
          ) : (
            <div className='space-y-3'>
              {filteredInProcess.map((a) => (
                <div key={a._id} className='border rounded-lg p-3 text-sm text-gray-600'>
                  <p className='font-semibold text-gray-800'>{a.patientName || a.patientId}</p>
                  <p className='text-xs text-gray-400'>Sample ID: {a.sampleId || '-'}</p>
                  <p className='text-xs text-gray-400'>Collected: {a.sampleCollectedAt ? new Date(a.sampleCollectedAt).toLocaleString() : '-'}</p>
                  {Array.isArray(a.items) && a.items.length > 0 && (
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {a.items.map((it, idx) => (
                        <span key={idx} className='text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700'>{it.name}</span>
                      ))}
                    </div>
                  )}

                  <div className='mt-3 flex gap-2 flex-wrap'>
                    <button
                      onClick={() => openReportModal(a)}
                      className='px-3 py-1 rounded-lg text-xs bg-violet-50 text-violet-700'
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {reportModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white w-full max-w-4xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-lg font-semibold text-gray-800'>Generate Report</p>
                <p className='text-xs text-gray-500'>Step {currentStep + 1} of {reportSteps.length}</p>
              </div>
              <button onClick={closeReportModal} className='text-gray-400 hover:text-gray-600'>✕</button>
            </div>

            {showPreview ? (
              <div>
                <p className='text-sm font-semibold text-gray-700 mb-4'>Preview</p>
                <div className='space-y-6'>
                  {reportSteps.map((step, idx) => (
                    <div key={idx} className='border rounded-xl p-4'>
                      <p className='text-sm font-semibold text-gray-700 mb-3'>{step?.test_info?.test_name || `Test ${idx + 1}`}</p>

                      <div className='overflow-x-auto'>
                        <table className='w-full text-xs border'>
                          <tbody>
                            <tr className='bg-gray-50'>
                              <th className='text-left p-2 border'>Patient ID</th>
                              <td className='p-2 border'>{step?.patient_info?.patient_id || '-'}</td>
                              <th className='text-left p-2 border'>Patient Name</th>
                              <td className='p-2 border'>{step?.patient_info?.name || '-'}</td>
                            </tr>
                            <tr>
                              <th className='text-left p-2 border'>Age</th>
                              <td className='p-2 border'>{step?.patient_info?.age || '-'}</td>
                              <th className='text-left p-2 border'>Gender</th>
                              <td className='p-2 border'>{step?.patient_info?.gender || '-'}</td>
                            </tr>
                            <tr className='bg-gray-50'>
                              <th className='text-left p-2 border'>Contact</th>
                              <td className='p-2 border'>{step?.patient_info?.contact || '-'}</td>
                              <th className='text-left p-2 border'>Height / Weight</th>
                              <td className='p-2 border'>{`${step?.patient_info?.height || '-'} / ${step?.patient_info?.weight || '-'}`}</td>
                            </tr>
                            <tr>
                              <th className='text-left p-2 border'>Doctor</th>
                              <td className='p-2 border'>{step?.doctor_info?.doctor_name || '-'}</td>
                              <th className='text-left p-2 border'>Doctor ID</th>
                              <td className='p-2 border'>{step?.doctor_info?.doctor_id || '-'}</td>
                            </tr>
                            <tr className='bg-gray-50'>
                              <th className='text-left p-2 border'>Test</th>
                              <td className='p-2 border'>{step?.test_info?.test_name || '-'}</td>
                              <th className='text-left p-2 border'>Category</th>
                              <td className='p-2 border'>{step?.test_info?.category || '-'}</td>
                            </tr>
                            <tr>
                              <th className='text-left p-2 border'>Date</th>
                              <td className='p-2 border'>{step?.test_info?.date || '-'}</td>
                              <th className='text-left p-2 border'>Lab Technician</th>
                              <td className='p-2 border'>{step?.test_info?.lab_technician || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {Array.isArray(step?.results) && step.results.length > 0 && (
                        <div className='mt-4 overflow-x-auto'>
                          <table className='w-full text-xs border'>
                            <thead>
                              <tr className='bg-gray-50'>
                                <th className='p-2 border text-left'>Parameter</th>
                                <th className='p-2 border text-left'>Value</th>
                                <th className='p-2 border text-left'>Unit</th>
                                <th className='p-2 border text-left'>Normal</th>
                                <th className='p-2 border text-left'>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {step.results.map((r, rIdx) => (
                                <tr key={rIdx}>
                                  <td className='p-2 border'>{r.parameter || '-'}</td>
                                  <td className='p-2 border'>{r.value || '-'}</td>
                                  <td className='p-2 border'>{r.unit || '-'}</td>
                                  <td className='p-2 border'>{r.normal_range || r.normal || '-'}</td>
                                  <td className='p-2 border'>{r.status || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {step?.findings !== undefined && (
                        <div className='mt-3 text-xs'><strong>Findings:</strong> {step.findings || '-'}</div>
                      )}
                      {step?.impression !== undefined && (
                        <div className='mt-2 text-xs'><strong>Impression:</strong> {step.impression || '-'}</div>
                      )}
                      {step?.remarks !== undefined && (
                        <div className='mt-2 text-xs'><strong>Remarks:</strong> {step.remarks || '-'}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-xs text-gray-500'>Patient ID</label>
                    <input
                      value={reportSteps[currentStep]?.patient_info?.patient_id || ''}
                      onChange={(e) => updateStepField('patient_info.patient_id', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Patient Name</label>
                    <input
                      value={reportSteps[currentStep]?.patient_info?.name || ''}
                      onChange={(e) => updateStepField('patient_info.name', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Age</label>
                    <input
                      value={reportSteps[currentStep]?.patient_info?.age || ''}
                      onChange={(e) => updateStepField('patient_info.age', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Gender</label>
                    <input
                      value={reportSteps[currentStep]?.patient_info?.gender || ''}
                      onChange={(e) => updateStepField('patient_info.gender', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Contact</label>
                    <input
                      value={reportSteps[currentStep]?.patient_info?.contact || ''}
                      onChange={(e) => updateStepField('patient_info.contact', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Height</label>
                    <input
                      value={reportSteps[currentStep]?.patient_info?.height || ''}
                      onChange={(e) => updateStepField('patient_info.height', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Weight</label>
                    <input
                      value={reportSteps[currentStep]?.patient_info?.weight || ''}
                      onChange={(e) => updateStepField('patient_info.weight', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Doctor ID</label>
                    <input
                      value={reportSteps[currentStep]?.doctor_info?.doctor_id || ''}
                      onChange={(e) => updateStepField('doctor_info.doctor_id', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Doctor Name</label>
                    <input
                      value={reportSteps[currentStep]?.doctor_info?.doctor_name || ''}
                      onChange={(e) => updateStepField('doctor_info.doctor_name', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Test Name</label>
                    <input
                      value={reportSteps[currentStep]?.test_info?.test_name || ''}
                      onChange={(e) => updateStepField('test_info.test_name', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Category</label>
                    <input
                      value={reportSteps[currentStep]?.test_info?.category || ''}
                      onChange={(e) => updateStepField('test_info.category', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Date</label>
                    <input
                      value={reportSteps[currentStep]?.test_info?.date || ''}
                      onChange={(e) => updateStepField('test_info.date', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-gray-500'>Lab Technician</label>
                    <input
                      value={reportSteps[currentStep]?.test_info?.lab_technician || ''}
                      onChange={(e) => updateStepField('test_info.lab_technician', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                </div>

                {Array.isArray(reportSteps[currentStep]?.results) && (
                  <div>
                    <p className='text-sm font-semibold text-gray-700 mb-2'>Results</p>
                    <div className='space-y-2'>
                      {reportSteps[currentStep].results.map((r, idx) => (
                        <div key={idx} className='grid grid-cols-1 md:grid-cols-5 gap-2 items-center'>
                          <input
                            value={r.parameter || ''}
                            onChange={(e) => updateResultField(idx, 'parameter', e.target.value)}
                            className='border rounded-lg px-3 py-2 text-xs'
                            placeholder='Parameter'
                          />
                          <input
                            value={r.value || ''}
                            onChange={(e) => updateResultField(idx, 'value', e.target.value)}
                            className='border rounded-lg px-3 py-2 text-xs'
                            placeholder='Value'
                          />
                          <input
                            value={r.unit || ''}
                            onChange={(e) => updateResultField(idx, 'unit', e.target.value)}
                            className='border rounded-lg px-3 py-2 text-xs'
                            placeholder='Unit'
                          />
                          <input
                            value={r.normal_range || r.normal || ''}
                            onChange={(e) => updateResultField(idx, r.normal ? 'normal' : 'normal_range', e.target.value)}
                            className='border rounded-lg px-3 py-2 text-xs'
                            placeholder='Normal Range'
                          />
                          <input
                            value={r.status || ''}
                            onChange={(e) => updateResultField(idx, 'status', e.target.value)}
                            className='border rounded-lg px-3 py-2 text-xs'
                            placeholder='Status'
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportSteps[currentStep]?.findings !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Findings</label>
                    <textarea
                      rows={3}
                      value={reportSteps[currentStep]?.findings || ''}
                      onChange={(e) => updateStepField('findings', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
                {reportSteps[currentStep]?.impression !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Impression</label>
                    <textarea
                      rows={3}
                      value={reportSteps[currentStep]?.impression || ''}
                      onChange={(e) => updateStepField('impression', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
                {reportSteps[currentStep]?.technique !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Technique</label>
                    <textarea
                      rows={2}
                      value={reportSteps[currentStep]?.technique || ''}
                      onChange={(e) => updateStepField('technique', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
                {reportSteps[currentStep]?.suggestion !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Suggestion</label>
                    <textarea
                      rows={2}
                      value={reportSteps[currentStep]?.suggestion || ''}
                      onChange={(e) => updateStepField('suggestion', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
                {reportSteps[currentStep]?.radiologist !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Radiologist</label>
                    <input
                      value={reportSteps[currentStep]?.radiologist || ''}
                      onChange={(e) => updateStepField('radiologist', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
                {reportSteps[currentStep]?.image_url !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Image URL</label>
                    <input
                      value={reportSteps[currentStep]?.image_url || ''}
                      onChange={(e) => updateStepField('image_url', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
                {reportSteps[currentStep]?.remarks !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Remarks</label>
                    <textarea
                      rows={2}
                      value={reportSteps[currentStep]?.remarks || ''}
                      onChange={(e) => updateStepField('remarks', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
                {reportSteps[currentStep]?.overall_summary !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Overall Summary</label>
                    <textarea
                      rows={2}
                      value={reportSteps[currentStep]?.overall_summary || ''}
                      onChange={(e) => updateStepField('overall_summary', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
                {reportSteps[currentStep]?.doctor_remark !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Doctor Remark</label>
                    <textarea
                      rows={2}
                      value={reportSteps[currentStep]?.doctor_remark || ''}
                      onChange={(e) => updateStepField('doctor_remark', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
                {reportSteps[currentStep]?.report_url !== undefined && (
                  <div>
                    <label className='text-xs text-gray-500'>Report URL</label>
                    <input
                      value={reportSteps[currentStep]?.report_url || ''}
                      onChange={(e) => updateStepField('report_url', e.target.value)}
                      className='w-full border rounded-lg px-3 py-2 text-sm'
                    />
                  </div>
                )}
              </div>
            )}

            <div className='flex justify-between mt-6'>
              <button
                onClick={goBack}
                className='px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700'
              >
                {showPreview ? 'Back' : 'Previous'}
              </button>
              <div className='flex gap-2'>
                {showPreview ? (
                  <>
                    <button
                      onClick={downloadReportPdf}
                      className='px-4 py-2 rounded-lg text-sm bg-violet-600 text-white'
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={submitReport}
                      className='px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white'
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <button
                    onClick={goNext}
                    className='px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white'
                  >
                    {currentStep === reportSteps.length - 1 ? 'Preview' : 'Next'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GenerateReport
