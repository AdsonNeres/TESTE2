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
const statusMsg = document.getElementById('statusMessage');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');

let cropper;

// Upload de imagem comum
photo1.addEventListener('change', (e) => loadImage(e.target.files[0], img1));
photo2.addEventListener('change', (e) => {
  loadImage(e.target.files[0], img2);
  img2.style.display = "none"; // Garante que imagem 2 nunca aparece
  showStatusMessage("📸 Imagem 2 importada! Agora você pode gerar o PDF final.");
});

function loadImage(file, imgElement) {
  const reader = new FileReader();
  reader.onload = (e) => {
    imgElement.src = e.target.result;
    imgElement.style.display = imgElement === img1 ? "block" : "none";
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

  const croppedCanvas = cropper.getCroppedCanvas({
    width: 1000,
    height: 1500,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high"
  });

  if (!croppedCanvas || croppedCanvas.width === 0 || croppedCanvas.height === 0) {
    return alert("Selecione uma área válida para o recorte.");
  }

  croppedCanvas.toBlob((blob) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageDataURL = reader.result;

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

      showStatusMessage("✅ Recorte salvo, agora importe a Foto 2");
    };
    reader.readAsDataURL(blob);
  }, 'image/jpeg', 1.0);
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
    const startX1 = 2;
    const startX2 = largura / 2 + 0.5;
    const startY = 2;

    const slotWidth = (largura / 2) - 2.5;
    const slotHeight = altura - 4;

    function addImage(canvas, x, y) {
      const imgAspect = canvas.width / canvas.height;
      const slotAspect = slotWidth / slotHeight;
    
      let drawWidth, drawHeight;
    
      if (imgAspect > slotAspect) {
        drawWidth = slotWidth;
        drawHeight = drawWidth / imgAspect;
      } else {
        drawHeight = slotHeight;
        drawWidth = drawHeight * imgAspect;
      }
    
      const offsetX = x + (slotWidth - drawWidth) / 2;
      const offsetY = y + (slotHeight - drawHeight) / 2;
    
      // Adiciona borda fina ao redor da imagem para facilitar corte
      doc.setLineWidth(0.2);
      doc.setDrawColor(0);
      doc.rect(offsetX, offsetY, drawWidth, drawHeight); // Borda da imagem
    
      doc.addImage(canvas.toDataURL("image/jpeg"), "JPEG", offsetX, offsetY, drawWidth, drawHeight);
    }
    
    addImage(canvas1, startX1, startY);
    addImage(canvas2, startX2, startY);

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

function showStatusMessage(texto = "✅ Recorte salvo, importe a Foto 2") {
  statusText.innerText = texto;
  statusMsg.style.display = "block";
  progressBar.style.width = "0%";

  let progress = 0;
  const interval = setInterval(() => {
    progress += 1;
    progressBar.style.width = `${progress}%`;
    if (progress >= 100) {
      clearInterval(interval);
      statusMsg.style.display = "none";
    }
  }, 30);
}
