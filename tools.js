(function () {
    const chatbox = document.getElementById("chatbox");
    const text = () => [...chatbox.querySelectorAll(".message")]
        .map((node) => `${node.classList.contains("user-message") ? "You" : "StudyMate AI"}: ${node.childNodes[0]?.textContent?.trim() || ""}`)
        .filter(Boolean).join("\n\n");
    const download = (blob, name) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob); link.download = name; link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    };
    const safeName = () => `studymate-chat-${new Date().toISOString().slice(0, 10)}`;

    document.getElementById("download-txt").onclick = () => download(new Blob([text()], { type: "text/plain" }), `${safeName()}.txt`);
    document.getElementById("download-pdf").onclick = () => {
        if (!window.jspdf) return alert("PDF exporter is still loading. Check your internet connection and try again.");
        const { jsPDF } = window.jspdf; const pdf = new jsPDF({ unit: "pt", format: "a4" });
        const lines = pdf.splitTextToSize(text() || "No chat messages yet.", 500);
        pdf.setFontSize(16); pdf.text("StudyMate AI Conversation", 48, 50);
        pdf.setFontSize(10); let y = 78;
        lines.forEach((line) => { if (y > 780) { pdf.addPage(); y = 50; } pdf.text(line, 48, y); y += 15; });
        pdf.save(`${safeName()}.pdf`);
    };
    document.getElementById("download-docx").onclick = async () => {
        if (!window.docx) return alert("DOCX exporter is still loading. Check your internet connection and try again.");
        const { Document, Packer, Paragraph, TextRun } = window.docx;
        const paragraphs = (text() || "No chat messages yet.").split("\n").map((line) => new Paragraph({ children: [new TextRun(line)] }));
        const documentFile = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: "StudyMate AI Conversation", heading: "Title" }), ...paragraphs] }] });
        download(await Packer.toBlob(documentFile), `${safeName()}.docx`);
    };

    const input = document.getElementById("image-input"), editor = document.getElementById("image-editor"), canvas = document.getElementById("image-canvas"), context = canvas.getContext("2d");
    const controls = ["brightness", "contrast", "saturation", "grayscale"].map((name) => document.getElementById(`image-${name}`));
    let source = null;
    const draw = () => {
        if (!source) return;
        const [brightness, contrast, saturation, grayscale] = controls.map((control) => control.value);
        context.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        context.filter = "none";
    };
    input.onchange = () => {
        const file = input.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { source = new Image(); source.onload = () => { const scale = Math.min(1, 1400 / source.width, 1000 / source.height); canvas.width = Math.round(source.width * scale); canvas.height = Math.round(source.height * scale); editor.hidden = false; draw(); }; source.src = reader.result; };
        reader.readAsDataURL(file);
    };
    controls.forEach((control) => control.oninput = draw);
    document.getElementById("image-reset").onclick = () => { controls.forEach((control) => control.value = control.id === "image-grayscale" ? 0 : 100); draw(); };
    const imageDownload = (type, extension) => canvas.toBlob((blob) => download(blob, `studymate-edited-image.${extension}`), type, .92);
    document.getElementById("download-png").onclick = () => imageDownload("image/png", "png");
    document.getElementById("download-jpg").onclick = () => imageDownload("image/jpeg", "jpg");
}());
