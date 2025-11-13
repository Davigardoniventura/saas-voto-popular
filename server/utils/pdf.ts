import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface ProposalData {
  id: number;
  title: string;
  description: string | null;
  status: string;
  voteCount: number | null;
  createdAt: Date;
  vereadorName?: string;
}

interface ReportOptions {
  title: string;
  subtitle?: string;
  municipalityName?: string;
  generatedBy?: string;
  generatedAt?: Date;
}

/**
 * Gera um relatório PDF com propostas
 */
export function generateProposalsReport(
  proposals: ProposalData[],
  options: ReportOptions
): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Configurar fontes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(options.title, margin, margin + 10);

  // Subtítulo
  if (options.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(options.subtitle, margin, margin + 20);
  }

  // Informações do relatório
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let yPosition = margin + 35;

  if (options.municipalityName) {
    doc.text(`Município: ${options.municipalityName}`, margin, yPosition);
    yPosition += 7;
  }

  if (options.generatedBy) {
    doc.text(`Gerado por: ${options.generatedBy}`, margin, yPosition);
    yPosition += 7;
  }

  if (options.generatedAt) {
    doc.text(
      `Data: ${options.generatedAt.toLocaleDateString("pt-BR")} às ${options.generatedAt.toLocaleTimeString("pt-BR")}`,
      margin,
      yPosition
    );
    yPosition += 7;
  }

  yPosition += 5;

  // Tabela de propostas
  const tableData = proposals.map((proposal) => [
    proposal.title,
    (proposal.description || "").substring(0, 50) + "...",
    proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1),
    (proposal.voteCount || 0).toString(),
    new Date(proposal.createdAt).toLocaleDateString("pt-BR"),
  ]);

  (doc as any).autoTable({
    head: [["Título", "Descrição", "Status", "Votos", "Data"]],
    body: tableData,
    startY: yPosition,
    margin: margin,
    headStyles: {
      fillColor: [0, 102, 204],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 25, halign: "center" },
    },
  });

  // Rodapé
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Este é um documento gerado automaticamente pelo sistema Voto Popular",
    margin,
    finalY
  );

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Gera um relatório PDF consolidado com estatísticas
 */
export function generateConsolidatedReport(
  proposals: ProposalData[],
  options: ReportOptions
): Buffer {
  const doc = new jsPDF();
  const margin = 20;

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(options.title, margin, margin + 10);

  // Subtítulo
  if (options.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(options.subtitle, margin, margin + 20);
  }

  let yPosition = margin + 35;

  // Estatísticas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Estatísticas Gerais", margin, yPosition);
  yPosition += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const stats = {
    total: proposals.length,
    approved: proposals.filter((p) => p.status === "approved").length,
    pending: proposals.filter((p) => p.status === "pending").length,
    rejected: proposals.filter((p) => p.status === "rejected").length,
    totalVotes: proposals.reduce((sum, p) => sum + (p.voteCount || 0), 0),
    averageVotes: Math.round(
      proposals.reduce((sum, p) => sum + (p.voteCount || 0), 0) / (proposals.length || 1)
    ),
  };

  doc.text(`Total de Propostas: ${stats.total}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Propostas Aprovadas: ${stats.approved}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Propostas Pendentes: ${stats.pending}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Propostas Rejeitadas: ${stats.rejected}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Total de Votos: ${stats.totalVotes}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Média de Votos por Proposta: ${stats.averageVotes}`, margin, yPosition);
  yPosition += 15;

  // Tabela de propostas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Detalhes das Propostas", margin, yPosition);
  yPosition += 10;

  const tableData = proposals.map((proposal) => [
    proposal.title,
    proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1),
    (proposal.voteCount || 0).toString(),
    new Date(proposal.createdAt).toLocaleDateString("pt-BR"),
  ]);

  (doc as any).autoTable({
    head: [["Título", "Status", "Votos", "Data"]],
    body: tableData,
    startY: yPosition,
    margin: margin,
    headStyles: {
      fillColor: [0, 102, 204],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
