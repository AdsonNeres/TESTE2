const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');
const photo1 = document.getElementById('photo1');
const photo2 = document.getElementById('photo2');

photo1.addEventListener('change', (e) => loadImage(e.target.files[0], img1));
photo2.addEventListener('change', (e) => loadImage(e.target.files[0], img2));

function loadImage(file, imgElement) {
  const reader = new FileReader();
  reader.onload = (e) => {
    imgElement.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

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
