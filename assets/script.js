const toggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
if (toggle && navLinks) {
  toggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll(".schedule-form, .contact-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (window.location.protocol !== "file:") {
      return;
    }

    event.preventDefault();
    const notice = form.querySelector("[data-file-warning]");
    if (notice) {
      notice.classList.add("show");
    }
  });
});

const faqItems = [
  {
    question: "Quais serviços a Solux Tecnologia oferece?",
    answer: "Oferecemos desenvolvimento de sistemas, suporte técnico remoto e presencial, manutenção de computadores e soluções para empresas.",
    tags: ["serviços", "sistemas", "suporte", "manutenção"],
  },
  {
    question: "Vocês atendem empresas ou pessoas físicas?",
    answer: "Atendemos principalmente empresas, mas também prestamos suporte para usuários domésticos.",
    tags: ["empresas", "pessoas físicas", "usuários domésticos"],
  },
  {
    question: "O suporte é remoto ou presencial?",
    answer: "Os dois. Atendemos remotamente para maior rapidez e também presencialmente quando necessário.",
    tags: ["remoto", "presencial", "suporte"],
  },
  {
    question: "Qual o tempo de resposta para atendimento?",
    answer: "Nosso atendimento é rápido. Normalmente iniciamos o suporte em poucos minutos após o contato, conforme disponibilidade e urgência.",
    tags: ["tempo", "resposta", "atendimento", "urgência"],
  },
  {
    question: "Vocês desenvolvem sistemas personalizados?",
    answer: "Sim, criamos sistemas sob medida para o seu negócio, de acordo com sua necessidade.",
    tags: ["sistemas", "personalizados", "sob medida"],
  },
  {
    question: "Posso testar o sistema antes de contratar?",
    answer: "Sim, oferecemos demonstração para você conhecer antes de fechar.",
    tags: ["teste", "demonstração", "contratar"],
  },
  {
    question: "O sistema funciona em celular e computador?",
    answer: "Sim, nossos sistemas são pensados para funcionar em diferentes dispositivos.",
    tags: ["celular", "computador", "responsivo"],
  },
  {
    question: "Vocês fazem manutenção de computadores?",
    answer: "Sim, realizamos manutenção, formatação, instalação de programas e otimização.",
    tags: ["manutenção", "computadores", "formatação", "programas"],
  },
  {
    question: "Resolvem problemas de sistema travando?",
    answer: "Sim, esse é um dos principais problemas que resolvemos. Nosso foco é deixar tudo rápido e estável.",
    tags: ["travando", "lento", "estável", "otimização"],
  },
  {
    question: "Trabalham com redes e internet?",
    answer: "Sim, fazemos configuração de redes, Wi-Fi, roteadores e melhorias de conexão.",
    tags: ["redes", "internet", "wifi", "roteadores"],
  },
  {
    question: "Qual o valor do serviço?",
    answer: "O valor varia conforme a necessidade. Fazemos uma análise e passamos um orçamento justo.",
    tags: ["valor", "preço", "orçamento", "serviço"],
  },
  {
    question: "Cobram visita técnica?",
    answer: "Depende do tipo de atendimento. Em alguns casos oferecemos diagnóstico gratuito.",
    tags: ["visita", "técnica", "diagnóstico"],
  },
  {
    question: "Como posso contratar o serviço?",
    answer: "Você pode entrar em contato pela página de contato ou solicitar um agendamento. A equipe retorna para entender a necessidade e orientar os próximos passos.",
    tags: ["contratar", "contato", "agendamento", "whatsapp"],
  },
  {
    question: "Qual o horário de atendimento?",
    answer: "Atendemos em horário comercial e também em caráter emergencial dependendo do caso.",
    tags: ["horário", "atendimento", "emergencial"],
  },
];

function createAiChat() {
  const widget = document.createElement("section");
  widget.className = "ai-chat";
  widget.setAttribute("aria-label", "Assistente de perguntas frequentes");
  widget.innerHTML = `
    <div class="ai-chat-label">FAQ</div>
    <button class="ai-chat-button" type="button" aria-label="Abrir assistente" aria-expanded="false">
      <img src="assets/Personagem-solux.png" alt="Assistente Solux" class="ai-chat-avatar">
    </button>
    <div class="ai-chat-panel" aria-live="polite">
      <div class="ai-chat-header">
        <div>
          <span class="eyebrow">Solux IA</span>
          <strong>Assistente rápido</strong>
        </div>
        <button class="ai-chat-close" type="button" aria-label="Fechar assistente">×</button>
      </div>
      <div class="ai-chat-body">
        <div class="ai-message bot-message ai-intro">Olá. Escolha uma pergunta abaixo para ver a resposta.</div>
        <div class="ai-answer" data-ai-answer></div>
        <button class="ai-back-button" type="button" data-ai-back>Ver outras perguntas</button>
        <div class="ai-question-list">
          ${faqItems.map((item, index) => `<button type="button" data-faq-index="${index}">${index + 1}. ${item.question}</button>`).join("")}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  const toggleButton = widget.querySelector(".ai-chat-button");
  const closeButton = widget.querySelector(".ai-chat-close");
  const answerBox = widget.querySelector("[data-ai-answer]");
  const questionList = widget.querySelector(".ai-question-list");
  const backButton = widget.querySelector("[data-ai-back]");
  const introMessage = widget.querySelector(".ai-intro");

  function setOpen(isOpen) {
    widget.classList.toggle("open", isOpen);
    toggleButton.setAttribute("aria-expanded", String(isOpen));
  }

  function showAnswer(item) {
    widget.classList.add("answer-mode");
    questionList.setAttribute("hidden", "");
    introMessage.setAttribute("hidden", "");
    answerBox.innerHTML = `<div class="ai-message user-message">${item.question}</div><div class="ai-message bot-message">${item.answer}</div>`;
  }

  function showQuestionList() {
    widget.classList.remove("answer-mode");
    questionList.removeAttribute("hidden");
    introMessage.removeAttribute("hidden");
    answerBox.innerHTML = "";
  }

  toggleButton.addEventListener("click", () => setOpen(!widget.classList.contains("open")));
  closeButton.addEventListener("click", () => setOpen(false));
  backButton.addEventListener("click", showQuestionList);

  widget.querySelectorAll("[data-faq-index]").forEach((button) => {
    button.addEventListener("click", () => {
      showAnswer(faqItems[Number(button.dataset.faqIndex)]);
    });
  });

}

createAiChat();

// Efeito de hover com brilho seguindo o mouse em todos os cards
function initCardEffect() {
  const cards = document.querySelectorAll(".card");
  
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calcular percentuais
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      
      card.style.setProperty("--mouse-x", `${xPercent}%`);
      card.style.setProperty("--mouse-y", `${yPercent}%`);
    });
    
    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCardEffect);
} else {
  initCardEffect();
}

// Efeito de digitação
function initTypingEffect() {
  const typingElements = document.querySelectorAll(".typing-text");
  
  typingElements.forEach((element) => {
    const text = element.getAttribute("data-text");
    if (!text) return;
    
    // Decodificar entidades HTML (&#10; para quebra de linha)
    const decodedText = text
      .replace(/&#10;/g, "\n")
      .replace(/&#13;/g, "\r")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    
    let currentIndex = 0;
    let displayedText = "";
    
    function type() {
      if (currentIndex < decodedText.length) {
        displayedText += decodedText[currentIndex];
        element.textContent = displayedText;
        currentIndex++;
        setTimeout(type, 50); // Velocidade da digitação
      }
    }
    
    // Usar Intersection Observer para iniciar quando o elemento ficar visível
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && currentIndex === 0) {
          type();
          observer.unobserve(element);
        }
      });
    });
    
    observer.observe(element);
  });
}

// Executar quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTypingEffect);
} else {
  initTypingEffect();
}

// Preencher selects de país
const countries = [
  { name: "Brasil", code: "BR", ddi: "+55", flag: "🇧🇷" },
  { name: "Estados Unidos", code: "US", ddi: "+1", flag: "🇺🇸" },
  { name: "Argentina", code: "AR", ddi: "+54", flag: "🇦🇷" },
  { name: "México", code: "MX", ddi: "+52", flag: "🇲🇽" },
  { name: "Colômbia", code: "CO", ddi: "+57", flag: "🇨🇴" },
  { name: "Peru", code: "PE", ddi: "+51", flag: "🇵🇪" },
  { name: "Chile", code: "CL", ddi: "+56", flag: "🇨🇱" },
  { name: "Venezuela", code: "VE", ddi: "+58", flag: "🇻🇪" },
  { name: "Canadá", code: "CA", ddi: "+1", flag: "🇨🇦" },
  { name: "Portugal", code: "PT", ddi: "+351", flag: "🇵🇹" },
  { name: "Espanha", code: "ES", ddi: "+34", flag: "🇪🇸" },
  { name: "França", code: "FR", ddi: "+33", flag: "🇫🇷" },
  { name: "Alemanha", code: "DE", ddi: "+49", flag: "🇩🇪" },
  { name: "Itália", code: "IT", ddi: "+39", flag: "🇮🇹" },
  { name: "Reino Unido", code: "GB", ddi: "+44", flag: "🇬🇧" },
  { name: "Austrália", code: "AU", ddi: "+61", flag: "🇦🇺" },
  { name: "Japão", code: "JP", ddi: "+81", flag: "🇯🇵" },
  { name: "China", code: "CN", ddi: "+86", flag: "🇨🇳" },
  { name: "Índia", code: "IN", ddi: "+91", flag: "🇮🇳" },
  { name: "Singapura", code: "SG", ddi: "+65", flag: "🇸🇬" },
];

function populateCountrySelects() {
  const selects = document.querySelectorAll(".country-select");
  
  selects.forEach((select) => {
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.ddi;
      option.textContent = `${country.flag} ${country.name} (${country.ddi})`;
      if (country.code === select.getAttribute("data-country-code")) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", populateCountrySelects);
} else {
  populateCountrySelects();
}
