(() => {
  "use strict";

  /* ---------- Menu do celular (<details>): fecha ao escolher um link ou com Esc ---------- */
  const menu = document.querySelector("[data-menu-mobile]");
  if (menu) {
    const resumo = menu.querySelector("summary");
    menu.addEventListener("toggle", () => resumo.setAttribute("aria-label", menu.open ? "Fechar menu" : "Abrir menu"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) menu.open = false; });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.open) { menu.open = false; resumo.focus(); }
    });
  }

  /* ---------- Sombra do cabeçalho ao rolar ---------- */
  const cabecalho = document.querySelector("[data-cabecalho]");
  if (cabecalho) {
    const aoRolar = () => cabecalho.classList.toggle("com-sombra", window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
  }

  /* ---------- Botão flutuante: no celular, só depois dos botões do hero ---------- */
  const flutuante = document.querySelector(".whatsapp-flutuante");
  const acoesHero = document.querySelector(".hero-acoes");
  if (flutuante && acoesHero) {
    // oculto enquanto os botões do hero ainda estão na tela (ou abaixo dela)
    const atualizarFlutuante = () => flutuante.classList.toggle("no-hero", acoesHero.getBoundingClientRect().bottom > 0);
    atualizarFlutuante();
    window.addEventListener("scroll", atualizarFlutuante, { passive: true });
    window.addEventListener("resize", atualizarFlutuante);
  }

  /* ---------- Mapa do Google: só com consentimento ---------- */
  const MAPA_URL = "https://www.google.com/maps?q=Av.+do+Batel,+1550,+Batel,+Curitiba+-+PR&output=embed";
  const carregarMapa = () => {
    const area = document.querySelector("[data-mapa]");
    if (!area || area.dataset.carregado === "true") return;
    const frame = document.createElement("iframe");
    frame.src = MAPA_URL;
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    frame.title = "Localização do consultório Clara Mendes Nutrição";
    area.replaceChildren(frame);
    area.dataset.carregado = "true";
  };

  /* ---------- Cookies (LGPD, dois níveis) ---------- */
  const CHAVE = "cmn-consentimento";
  const CATEGORIAS = ["funcionais", "estatisticas", "marketing"];
  const aviso = document.querySelector("[data-cookies]");
  const barra = document.querySelector("[data-cookies-barra]");
  const painel = document.querySelector("[data-cookies-painel]");

  const ler = () => {
    try { return JSON.parse(window.localStorage.getItem(CHAVE)); } catch (_e) { return null; }
  };
  const gravar = (categorias) => {
    const registro = { data: new Date().toISOString(), categorias: Object.assign({ necessarios: true }, categorias) };
    try { window.localStorage.setItem(CHAVE, JSON.stringify(registro)); } catch (_e) { /* navegador bloqueou: vale só nesta visita */ }
    return registro;
  };
  const aplicar = (registro) => {
    const c = (registro && registro.categorias) || {};
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: c.estatisticas ? "granted" : "denied",
        ad_storage: c.marketing ? "granted" : "denied",
        ad_user_data: c.marketing ? "granted" : "denied",
        ad_personalization: c.marketing ? "granted" : "denied"
      });
    }
    if (c.funcionais) carregarMapa();
  };

  // Mede a altura do aviso para o botão flutuante do WhatsApp não ficar por baixo dele
  const medir = () => {
    const altura = aviso && !aviso.hidden ? aviso.offsetHeight : 0;
    document.documentElement.style.setProperty("--altura-cookies", altura + "px");
  };
  const abrir = (nivel) => {
    if (!aviso) return;
    const registro = ler();
    painel.querySelectorAll("[data-categoria]").forEach((caixa) => {
      caixa.checked = Boolean(registro && registro.categorias && registro.categorias[caixa.dataset.categoria]);
    });
    aviso.hidden = false;
    barra.hidden = nivel === 2;
    painel.hidden = nivel !== 2;
    medir();
    (nivel === 2 ? painel.querySelector("input:not([disabled])") : barra.querySelector("button")).focus();
  };
  const fechar = (registro) => {
    aviso.hidden = true;
    medir();
    aplicar(registro);
  };
  const todas = (valor) => Object.fromEntries(CATEGORIAS.map((c) => [c, valor]));

  if (aviso) {
    const salvo = ler();
    if (salvo && salvo.categorias) aplicar(salvo);
    else { aviso.hidden = false; barra.hidden = false; painel.hidden = true; medir(); }

    aviso.querySelectorAll("[data-cookies-aceitar]").forEach((b) => b.addEventListener("click", () => fechar(gravar(todas(true)))));
    aviso.querySelectorAll("[data-cookies-rejeitar]").forEach((b) => b.addEventListener("click", () => fechar(gravar(todas(false)))));
    aviso.querySelector("[data-cookies-personalizar]").addEventListener("click", () => abrir(2));
    aviso.querySelector("[data-cookies-salvar]").addEventListener("click", () => {
      const escolha = {};
      painel.querySelectorAll("[data-categoria]").forEach((caixa) => { escolha[caixa.dataset.categoria] = caixa.checked; });
      fechar(gravar(escolha));
    });
    document.querySelectorAll("[data-cookies-gerenciar]").forEach((b) => b.addEventListener("click", () => abrir(2)));
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(aviso);
    else window.addEventListener("resize", medir);
  }

  // O clique no botão do mapa vale como consentimento para a categoria Funcionais
  document.querySelectorAll("[data-mapa-carregar]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const salvo = ler();
      if (salvo && salvo.categorias) {
        salvo.categorias.funcionais = true;
        gravar(salvo.categorias);
      }
      carregarMapa();
    });
  });

  /* ---------- Carrossel de depoimentos (celular e tablet) ---------- */
  const trilho = document.querySelector("[data-carrossel]");
  const pontos = document.querySelector("[data-carrossel-pontos]");
  if (trilho && pontos) {
    const itens = Array.from(trilho.children);
    const botoes = itens.map((item, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Depoimento ${i + 1} de ${itens.length}`);
      b.addEventListener("click", () => {
        const t = trilho.getBoundingClientRect();
        const r = item.getBoundingClientRect();
        trilho.scrollBy({ left: (r.left + r.width / 2) - (t.left + t.width / 2), behavior: "smooth" });
      });
      pontos.appendChild(b);
      return b;
    });
    const marcar = () => {
      const t = trilho.getBoundingClientRect();
      const centro = t.left + t.width / 2;
      let ativo = 0;
      let menor = Infinity;
      itens.forEach((item, i) => {
        const r = item.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - centro);
        if (d < menor) { menor = d; ativo = i; }
      });
      botoes.forEach((b, i) => b.setAttribute("aria-current", String(i === ativo)));
    };
    marcar();
    trilho.addEventListener("scroll", () => window.requestAnimationFrame(marcar), { passive: true });
    window.addEventListener("resize", marcar);
  }

  /* ---------- Como funciona: foco do teclado só onde o cartão gira ---------- */
  const giro = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  const cartoes = document.querySelectorAll("[data-passo]");
  const ajustarFoco = () => {
    cartoes.forEach((cartao) => {
      if (giro.matches) {
        cartao.tabIndex = 0;
        cartao.setAttribute("role", "group");
        cartao.setAttribute("aria-label", cartao.querySelector("h3").textContent);
      } else {
        cartao.removeAttribute("tabindex");
        cartao.removeAttribute("role");
        cartao.removeAttribute("aria-label");
      }
    });
  };
  ajustarFoco();
  if (giro.addEventListener) giro.addEventListener("change", ajustarFoco);
})();
