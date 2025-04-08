// Configuração do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Seletores
const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');
const photo1 = document.getElementById('photo1');
const photo2 = document.getElementById('photo2');
const pdfUpload = document.getElementById('pdfUpload');
const pdfCropContainer = document.getElementById('pdfCropContainer');
const pdfCropImage = document.getElementById('pdfCropImage');
const exportarBtn = document.getElementById('exportarRecorte');
let cropper;

// Upload de imagem comum
photo1.addEventListener('change', (e) => loadImage(e.target.files[0], img1));
photo2.addEventListener('change', (e) => loadImage(e.target.files[0], img2));

function loadImage(file, imgElement) {
  const reader = new FileReader();
  reader.onload = (e) => {
    imgElement.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// PDF para Foto 1
pdfUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || file.type !== "application/pdf") return alert("Por favor, envie um arquivo PDF válido.");

  const pdfData = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;

  const imageDataURL = canvas.toDataURL("image/jpeg");

  // Espera imagem carregar para aplicar o cropper
  pdfCropImage.onload = () => {
    pdfCropContainer.style.display = "block";

    if (cropper) cropper.destroy();

    cropper = new Cropper(pdfCropImage, {
      aspectRatio: NaN,
      viewMode: 1,
      zoomable: true,
      movable: true,
      dragMode: 'move',
      cropBoxMovable: true,
      cropBoxResizable: true,
      responsive: true,
      background: false
    });
  };

  pdfCropImage.src = imageDataURL;
});

exportarBtn.addEventListener("click", () => {
  if (!cropper) return alert("Faça o upload de um PDF e selecione uma área.");

  const croppedCanvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: false });

  if (!croppedCanvas || croppedCanvas.width === 0 || croppedCanvas.height === 0) {
    return alert("Selecione uma área válida para o recorte.");
  }

  croppedCanvas.toBlob((blob) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageDataURL = reader.result;

      // Define no campo de imagem 1
      img1.src = imageDataURL;
      img1.style.display = "block";

      // Limpa campos
      photo1.value = "";
      pdfUpload.value = "";
      pdfCropImage.src = "";
      pdfCropContainer.style.display = "none";

      if (cropper) {
        cropper.destroy();
        cropper = null;
      }

      alert("Recorte enviado para o campo Foto 1.");
    };
    reader.readAsDataURL(blob);
  }, 'image/jpeg');
});

function gerarPDF() {
  const tamanhoSelecionado = document.getElementById("tamanho").value;
  const [largura, altura] = tamanhoSelecionado.split("x").map(Number);

  const doc = new window.jspdf.jsPDF({
    orientation: "landscape",
    unit: "cm",
    format: [largura, altura]
  });

  Promise.all([
    loadImageToCanvas(img1),
    loadImageToCanvas(img2)
  ]).then(([canvas1, canvas2]) => {
    const imgWidth = 10;
    const imgHeight = 15;
    const borderSize = 0.1;
    const spacing = 1;

    const startX1 = 2;
    const startX2 = startX1 + imgWidth + spacing + borderSize * 2;
    const startY = 2.5;

    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.setLineDashPattern([0.2, 0.1]);

    doc.rect(startX1 - borderSize, startY - borderSize, imgWidth + borderSize * 2, imgHeight + borderSize * 2);
    doc.rect(startX2 - borderSize, startY - borderSize, imgWidth + borderSize * 2, imgHeight + borderSize * 2);

    doc.addImage(canvas1.toDataURL("image/jpeg"), "JPEG", startX1, startY, imgWidth, imgHeight);
    doc.addImage(canvas2.toDataURL("image/jpeg"), "JPEG", startX2, startY, imgWidth, imgHeight);

    doc.save(`montagem_${largura}x${altura}.pdf`);
  });
}

function loadImageToCanvas(imgElement) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    ctx.drawImage(imgElement, 0, 0);

    resolve(canvas);
  });
}
