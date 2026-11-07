import jsPDF from 'jspdf';

interface InstallationEntry {
  id: string;
  customer_name: string;
  phone_number: string;
  site_survey: string;
  site_survey_comments: string;
  installation_status: string;
  site_handed_over: string;
  handover_comments: string;
  created_at: string;
}

interface ServiceEntry {
  id: string;
  customer_name: string;
  phone_number: string;
  service_status: string;
  complaint_status: string;
  complaint_resolution_status: string;
  comments: string;
  vendor_comments: string;
  created_at: string;
}

export function generateInstallationPDF(entry: InstallationEntry) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TALWIN AQUARAY', 15, yPos);

  yPos += 6;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Talwin AquaRay (formerly known as "Skanda Agencies")', 15, yPos);
  yPos += 4;
  pdf.text('N0 34, Ground Floor, Nyanappanhalli, 80 Feet Road,', 15, yPos);
  yPos += 4;
  pdf.text('BDA Layout BTM 4th Stage, Bengaluru, Karnataka 560076', 15, yPos);
  yPos += 4;
  pdf.text('Phone: 70224 58515 | Email: info@talwin.in', 15, yPos);

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INSTALLATION REPORT', pageWidth - 15, 20, { align: 'right' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date: ${new Date(entry.created_at).toLocaleDateString()}`, pageWidth - 15, 32, { align: 'right' });

  yPos = 50;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 18, 'F');
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(2);
  pdf.line(15, yPos, 15, yPos + 18);

  yPos += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('CUSTOMER INFORMATION', 20, yPos);
  yPos += 5;
  pdf.setFontSize(10);
  pdf.text(entry.customer_name, 20, yPos);
  yPos += 5;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Phone: ${entry.phone_number || 'N/A'}`, 20, yPos);

  yPos = 75;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Installation Details', 15, yPos);
  yPos += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Site Survey Status:', 15, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(entry.site_survey, 60, yPos);
  yPos += 7;

  if (entry.site_survey_comments) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Technician Comment:', 15, yPos);
    yPos += 5;
    pdf.setFont('helvetica', 'normal');
    const surveyLines = pdf.splitTextToSize(entry.site_survey_comments, pageWidth - 30);
    surveyLines.forEach((line: string) => {
      pdf.text(line, 15, yPos);
      yPos += 5;
    });
    yPos += 2;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.text('Installation Status:', 15, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(entry.installation_status, 60, yPos);
  yPos += 7;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Site Handed Over:', 15, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(entry.site_handed_over, 60, yPos);
  yPos += 7;

  if (entry.handover_comments) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Handover Comments:', 15, yPos);
    yPos += 5;
    pdf.setFont('helvetica', 'normal');
    const handoverLines = pdf.splitTextToSize(entry.handover_comments, pageWidth - 30);
    handoverLines.forEach((line: string) => {
      pdf.text(line, 15, yPos);
      yPos += 5;
    });
  }

  yPos += 20;
  pdf.text('For: TALWIN AQUARAY', pageWidth - 15, yPos, { align: 'right' });
  yPos += 15;
  pdf.line(pageWidth - 60, yPos, pageWidth - 15, yPos);
  yPos += 4;
  pdf.text('Authorized Signatory', pageWidth - 15, yPos, { align: 'right' });

  pdf.save(`Installation-${entry.customer_name.replace(/\s+/g, '-')}.pdf`);
}

export function generateServicePDF(entry: ServiceEntry) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TALWIN AQUARAY', 15, yPos);

  yPos += 6;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Talwin AquaRay (formerly known as "Skanda Agencies")', 15, yPos);
  yPos += 4;
  pdf.text('N0 34, Ground Floor, Nyanappanhalli, 80 Feet Road,', 15, yPos);
  yPos += 4;
  pdf.text('BDA Layout BTM 4th Stage, Bengaluru, Karnataka 560076', 15, yPos);
  yPos += 4;
  pdf.text('Phone: 70224 58515 | Email: info@talwin.in', 15, yPos);

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SERVICE REPORT', pageWidth - 15, 20, { align: 'right' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date: ${new Date(entry.created_at).toLocaleDateString()}`, pageWidth - 15, 32, { align: 'right' });

  yPos = 50;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 18, 'F');
  pdf.setDrawColor(220, 38, 38);
  pdf.setLineWidth(2);
  pdf.line(15, yPos, 15, yPos + 18);

  yPos += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('CUSTOMER INFORMATION', 20, yPos);
  yPos += 5;
  pdf.setFontSize(10);
  pdf.text(entry.customer_name, 20, yPos);
  yPos += 5;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Phone: ${entry.phone_number || 'N/A'}`, 20, yPos);

  yPos = 75;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Service Details', 15, yPos);
  yPos += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Service Status:', 15, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(entry.service_status, 60, yPos);
  yPos += 7;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Complaint Status:', 15, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(entry.complaint_status, 60, yPos);
  yPos += 7;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Resolution Status:', 15, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(entry.complaint_resolution_status, 60, yPos);
  yPos += 7;

  if (entry.comments) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Service Comments:', 15, yPos);
    yPos += 5;
    pdf.setFont('helvetica', 'normal');
    const commentLines = pdf.splitTextToSize(entry.comments, pageWidth - 30);
    commentLines.forEach((line: string) => {
      pdf.text(line, 15, yPos);
      yPos += 5;
    });
    yPos += 2;
  }

  if (entry.vendor_comments) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Technician Comment:', 15, yPos);
    yPos += 5;
    pdf.setFont('helvetica', 'normal');
    const vendorLines = pdf.splitTextToSize(entry.vendor_comments, pageWidth - 30);
    vendorLines.forEach((line: string) => {
      pdf.text(line, 15, yPos);
      yPos += 5;
    });
  }

  yPos += 20;
  pdf.text('For: TALWIN AQUARAY', pageWidth - 15, yPos, { align: 'right' });
  yPos += 15;
  pdf.line(pageWidth - 60, yPos, pageWidth - 15, yPos);
  yPos += 4;
  pdf.text('Authorized Signatory', pageWidth - 15, yPos, { align: 'right' });

  pdf.save(`Service-${entry.customer_name.replace(/\s+/g, '-')}.pdf`);
}
