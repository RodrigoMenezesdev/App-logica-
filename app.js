const STORAGE_KEY = "logica_na_pratica_progresso_v1";

function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { completed: [], bestStreak: 0 };
        const parsed = JSON.parse(raw);
        return {
            completed: Array.isArray(parsed.completed) ? parsed.completed : [],
            bestStreak: typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0
        };
    } catch (e) {
        return { completed: [], bestStreak: 0 };
    }
}

function saveProgress() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                completed: Array.from(completedStages),
                bestStreak
            })
        );
    } catch (e) {
        // Ignora caso o armazenamento local esteja indisponível
    }
}

const savedData = loadProgress();
let currentStageIndex = 0;
let currentRowIndex = 0;
let currentStepIndex = 0;
let streak = 0;
let bestStreak = savedData.bestStreak;
const completedStages = new Set(savedData.completed);
let activeQuizQuestions = [];

function shuffleArray(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

const elHomeView = document.getElementById("home-view");
const elGameView = document.getElementById("game-view");
const elStagesList = document.getElementById("stages-list");
const elHomeBestStreak = document.getElementById("home-best-streak");
const btnStartRecommended = document.getElementById("btn-start-recommended");
const btnResetProgress = document.getElementById("btn-reset-progress");
const btnBackHome = document.getElementById("btn-back-home");

const elProgressFill = document.getElementById("progress-fill");
const elStreakBadge = document.getElementById("streak-badge");
const elLevelBadge = document.getElementById("level-badge");
const elConnectiveTag = document.getElementById("connective-tag");
const elLessonTitle = document.getElementById("lesson-title");
const elRuleText = document.getElementById("rule-text");
const elPropP = document.getElementById("prop-p-text");
const elPropQ = document.getElementById("prop-q-text");
const elTableSection = document.querySelector(".table-section");
const elFeedback = document.getElementById("feedback-banner");
const elControls = document.getElementById("controls-area");
const elNextStageArea = document.getElementById("next-stage-area");
const btnNextStage = document.getElementById("btn-next-stage");

const STAGES = [
    {
        type: "table",
        tag: "CONECTIVO E (∧)",
        title: "Conjunção: P e Q",
        columns: ["P", "Q", "P ∧ Q"],
        rule: 'No conectivo <strong>E</strong>, o resultado só é <strong>V</strong> quando <em>as duas</em> afirmações são verdadeiras.',
        propP: '"O edital foi publicado."',
        propQ: '"Fiz a minha inscrição."',
        rows: [
            {
                given: ["V", "V"],
                steps: [
                    {
                        ans: "V",
                        hintOk: "Isso! Como P e Q são verdadeiras, P ∧ Q é V.",
                        hintErr: "Como tanto P quanto Q são V, no conectivo E o resultado é V."
                    }
                ]
            },
            {
                given: ["V", "F"],
                steps: [
                    {
                        ans: "F",
                        hintOk: "Perfeito! Bastou Q ser falso para o conectivo E ficar falso.",
                        hintErr: "Atenção: no conectivo E, basta uma das partes ser F para tudo virar F."
                    }
                ]
            },
            {
                given: ["F", "V"],
                steps: [
                    {
                        ans: "F",
                        hintOk: "Boa! P é falso, então a frase composta com E também é falsa.",
                        hintErr: "Como P é F, as duas não são verdadeiras ao mesmo tempo. Logo, é F."
                    }
                ]
            },
            {
                given: ["F", "F"],
                steps: [
                    {
                        ans: "F",
                        hintOk: "Tabela do E concluída! Tudo falso resulta em F.",
                        hintErr: "Se nenhuma das duas é verdadeira, P ∧ Q só pode ser F."
                    }
                ]
            }
        ]
    },
    {
        type: "table",
        tag: "CONECTIVO OU (∨)",
        title: "Disjunção: P ou Q",
        columns: ["P", "Q", "P ∨ Q"],
        rule: 'No conectivo <strong>OU</strong>, basta <em>pelo menos uma</em> afirmação ser verdadeira para o resultado ser <strong>V</strong>.',
        propP: '"Estudo de manhã."',
        propQ: '"Estudo à noite."',
        rows: [
            {
                given: ["V", "V"],
                steps: [
                    {
                        ans: "V",
                        hintOk: "Certo! No OU inclusivo da lógica, duas verdadeiras também dão V.",
                        hintErr: "Cuidado: na lógica, o OU não exige exclusividade. Se ambas são V, dá V!"
                    }
                ]
            },
            {
                given: ["V", "F"],
                steps: [
                    {
                        ans: "V",
                        hintOk: "Mandou bem! Como P já é verdadeiro, o OU fica verdadeiro.",
                        hintErr: "No conectivo OU, basta uma afirmação ser V para o resultado ser V."
                    }
                ]
            },
            {
                given: ["F", "V"],
                steps: [
                    {
                        ans: "V",
                        hintOk: "Exato! Q garantiu o verdadeiro da expressão.",
                        hintErr: "Olhe para Q: ele é V. No conectivo OU, um V já basta!"
                    }
                ]
            },
            {
                given: ["F", "F"],
                steps: [
                    {
                        ans: "F",
                        hintOk: "Tabela do OU concluída! É o único caso em que o OU dá F.",
                        hintErr: "Quando nenhuma das duas acontece (F e F), o OU é F."
                    }
                ]
            }
        ]
    },
    {
        type: "table",
        tag: "CONDICIONAL (→)",
        title: "Se P, então Q",
        columns: ["P", "Q", "P → Q"],
        rule: 'Regra da promessa: <strong>Se P, então Q</strong> só é <strong>F</strong> quando P é <strong>V</strong> e Q é <strong>F</strong> (a famosa "Vera Fischer").',
        propP: '"Choveu na rua."',
        propQ: '"A calçada ficou molhada."',
        rows: [
            {
                given: ["V", "V"],
                steps: [
                    {
                        ans: "V",
                        hintOk: "Correto! Promessa cumprida: P aconteceu e Q também.",
                        hintErr: "Se P foi V e Q também foi V, a condicional é verdadeira (V)."
                    }
                ]
            },
            {
                given: ["V", "F"],
                steps: [
                    {
                        ans: "F",
                        hintOk: "Na mosca! V antes e F depois quebra a condicional (único caso F).",
                        hintErr: "Esse é o único caso falso da condicional: P é V, mas Q falhou (F)."
                    }
                ]
            },
            {
                given: ["F", "V"],
                steps: [
                    {
                        ans: "V",
                        hintOk: "Boa! Quando P é falso, a condicional nunca é quebrada — sempre dá V.",
                        hintErr: "Pegadinha clássica: se P é F, a condicional não foi descumprida. O resultado é V!"
                    }
                ]
            },
            {
                given: ["F", "F"],
                steps: [
                    {
                        ans: "V",
                        hintOk: "Excelente! Você dominou as 3 tabelas-verdade principais!",
                        hintErr: "Lembre-se: P → Q só dá F no caso V com F. Em F com F, o valor lógico é V."
                    }
                ]
            }
        ]
    },
    {
        type: "table",
        tag: "TABELA COMPLETA (¬ E ∧)",
        title: "Negação e Conjunção: P ∧ ¬Q",
        columns: ["P", "Q", "¬Q", "P ∧ ¬Q"],
        rule: 'Passo a passo: primeiro inverta <strong>Q</strong> para achar <strong>¬Q</strong>. Depois, aplique o <strong>E</strong> entre <strong>P</strong> e <strong>¬Q</strong>.',
        propP: '"A prova é hoje."',
        propQ: '"Estou atrasado."',
        rows: [
            {
                given: ["V", "V"],
                steps: [
                    {
                        ans: "F",
                        hintOk: "Boa! Se Q é V, então ¬Q vira F. Agora calcule P ∧ ¬Q.",
                        hintErr: "Negar (¬) inverte o valor: se Q é V, ¬Q fica F."
                    },
                    {
                        ans: "F",
                        hintOk: "Certo! Temos P = V e ¬Q = F. No conectivo E, V com F dá F.",
                        hintErr: "Use P (V) e a coluna ¬Q que você acabou de achar (F) no conectivo E."
                    }
                ]
            },
            {
                given: ["V", "F"],
                steps: [
                    {
                        ans: "V",
                        hintOk: "Isso! Negando F, ¬Q vira V. Agora resolva P ∧ ¬Q.",
                        hintErr: "Se Q é F, a negação ¬Q inverte para V."
                    },
                    {
                        ans: "V",
                        hintOk: "Perfeito! Agora P é V e ¬Q também é V — no conectivo E, dá V!",
                        hintErr: "Como P é V e ¬Q é V, ambos são verdadeiros no conectivo E."
                    }
                ]
            },
            {
                given: ["F", "V"],
                steps: [
                    {
                        ans: "F",
                        hintOk: "Correto! Q é V, então ¬Q é F. Agora aplique o E com P.",
                        hintErr: "Inverta Q (V) para encontrar ¬Q (F)."
                    },
                    {
                        ans: "F",
                        hintOk: "Mandou bem! P é F e ¬Q é F — no conectivo E, fica F.",
                        hintErr: "P é F e ¬Q é F. No conectivo E, o resultado é F."
                    }
                ]
            },
            {
                given: ["F", "F"],
                steps: [
                    {
                        ans: "V",
                        hintOk: "Exato! Negando F, obtemos ¬Q = V. Falta só o resultado final.",
                        hintErr: "Se Q é F, o valor de ¬Q é V."
                    },
                    {
                        ans: "F",
                        hintOk: "Show! Mesmo com ¬Q sendo V, P é F — e no conectivo E basta um F para dar F!",
                        hintErr: "Olhe para P: ele é F. No conectivo E, V com F resulta em F."
                    }
                ]
            }
        ]
    },
    {
        type: "quiz",
        tag: "DESAFIO DE PROVA",
        title: "Aplicação em Questões",
        rule: 'Leia o cenário da questão e decida se o valor lógico pedido é <strong>V</strong> (Verdadeiro) ou <strong>F</strong> (Falso).',
        propP: '"O candidato estudou a lei seca."',
        propQ: '"Acertou as questões de direito."',
        questions: [
            {
                scenario: 'Considere P = <strong>V</strong> e Q = <strong>F</strong>.',
                question: 'A proposição composta <strong>"P e Q"</strong> é:',
                ans: "F",
                hintOk: "Exato! No conectivo E, se Q é F, a conjunção inteira é F.",
                hintErr: "No conectivo E, ambos precisam ser V. Como Q é F, o resultado é F."
            },
            {
                scenario: 'Considere P = <strong>F</strong> e Q = <strong>V</strong>.',
                question: 'A condicional <strong>"Se P, então Q"</strong> é:',
                ans: "V",
                hintOk: "Isso mesmo! Quando o antecedente P é F, a condicional não é violada e vale V.",
                hintErr: "Lembre-se: Se P, então Q só é F quando P é V e Q é F. Aqui P é F, logo vale V."
            },
            {
                scenario: 'Considere P = <strong>V</strong> e Q = <strong>V</strong>.',
                question: 'A expressão <strong>"P ∧ ¬Q"</strong> é:',
                ans: "F",
                hintOk: "Na mosca! Se Q é V, então ¬Q é F — e V ∧ F resulta em F.",
                hintErr: "Primeiro ache ¬Q: como Q é V, ¬Q vira F. Depois faça V ∧ F, que dá F."
            },
            {
                scenario: 'Considere P = <strong>F</strong> e Q = <strong>F</strong>.',
                question: 'A disjunção <strong>"P ou Q"</strong> é:',
                ans: "F",
                hintOk: "Perfeito! Quando ambas as partes são F, o OU resulta em F.",
                hintErr: "No conectivo OU, só dá F quando todas as partes são falsas."
            },
            {
                scenario: 'Considere P = <strong>V</strong> e Q = <strong>F</strong>.',
                question: 'A bicondicional <strong>"P ↔ Q"</strong> (P se, e somente se, Q) é:',
                ans: "F",
                hintOk: "Perfeito! Na bicondicional (↔), só dá V quando P e Q têm o mesmo valor lógico.",
                hintErr: "A bicondicional exige valores iguais (V com V ou F com F) para ser V. Aqui P é V e Q é F, logo é F."
            },
            {
                scenario: 'Considere P = <strong>F</strong> e Q = <strong>F</strong>.',
                question: 'A bicondicional <strong>"P ↔ Q"</strong> é:',
                ans: "V",
                hintOk: "Isso! Como P e Q têm o mesmo valor lógico (ambos F), a bicondicional vale V.",
                hintErr: "Mesmo sendo ambos F, eles são iguais — e na bicondicional valores iguais dão V."
            },
            {
                scenario: 'Considere P = <strong>V</strong> e Q = <strong>F</strong>.',
                question: 'A expressão <strong>"¬(P ∧ Q)"</strong> (não é verdade que P e Q) é:',
                ans: "V",
                hintOk: "Boa! P ∧ Q seria F, e negando esse resultado (¬F) obtemos V.",
                hintErr: "Primeiro resolva dentro do parêntese: P ∧ Q dá F. Depois negue: ¬F vira V."
            }
        ]
    }
];

function getStageTotalSteps(stage) {
    if (stage.type === "quiz") {
        return activeQuizQuestions.length;
    }
    return stage.rows.reduce((acc, row) => acc + row.steps.length, 0);
}

function getStageCompletedSteps(stage) {
    if (stage.type === "quiz") {
        return currentRowIndex;
    }
    let done = 0;
    for (let r = 0; r < stage.rows.length; r++) {
        if (r < currentRowIndex) {
            done += stage.rows[r].steps.length;
        } else if (r === currentRowIndex) {
            done += currentStepIndex;
        }
    }
    return done;
}

function renderHomeMenu() {
    elStagesList.innerHTML = "";

    STAGES.forEach((stage, idx) => {
        const isDone = completedStages.has(idx);
        const card = document.createElement("button");
        card.type = "button";
        card.className = isDone ? "stage-card is-completed" : "stage-card";

        const statusLabel = isDone ? "✓ Concluída" : "Jogar →";

        card.innerHTML = `
            <div class="stage-meta">
                <span class="stage-num">Fase ${idx + 1} • ${stage.tag}</span>
                <span class="stage-name">${stage.title}</span>
            </div>
            <span class="stage-status">${statusLabel}</span>
        `;

        card.addEventListener("click", () => {
            openStage(idx);
        });

        elStagesList.appendChild(card);
    });

    const nextUnfinished = STAGES.findIndex((_, idx) => !completedStages.has(idx));
    const targetIdx = nextUnfinished === -1 ? 0 : nextUnfinished;
    btnStartRecommended.textContent =
        nextUnfinished === 0
            ? "Começar pela Fase 1 →"
            : nextUnfinished === -1
                ? "Treinar novamente (Fase 1) ↻"
                : `Continuar da Fase ${targetIdx + 1} →`;
    btnStartRecommended.dataset.targetStage = targetIdx;

    if (elHomeBestStreak) {
        elHomeBestStreak.textContent = bestStreak;
    }
}

function showHome() {
    renderHomeMenu();
    elGameView.classList.add("hidden");
    elHomeView.classList.remove("hidden");
}

function openStage(stageIdx) {
    currentStageIndex = stageIdx;
    currentRowIndex = 0;
    currentStepIndex = 0;
    elHomeView.classList.add("hidden");
    elGameView.classList.remove("hidden");
    renderStage();
}

function ensureTableStructure() {
    if (!document.getElementById("table-body")) {
        elTableSection.innerHTML = `
            <table class="truth-table" aria-label="Tabela-Verdade">
                <thead>
                    <tr></tr>
                </thead>
                <tbody id="table-body"></tbody>
            </table>
        `;
    }
}

function renderTableHeader(columns) {
    ensureTableStructure();
    const headRow = document.querySelector(".truth-table thead tr");
    if (headRow) {
        headRow.innerHTML = columns.map((col) => `<th>${col}</th>`).join("");
    }
}

function renderStage() {
    const stage = STAGES[currentStageIndex];
    currentRowIndex = 0;
    currentStepIndex = 0;

    elLevelBadge.textContent = `Fase ${currentStageIndex + 1}/${STAGES.length}`;
    elConnectiveTag.textContent = stage.tag;
    elLessonTitle.textContent = stage.title;
    elRuleText.innerHTML = stage.rule;
    elPropP.textContent = stage.propP;
    elPropQ.textContent = stage.propQ;

    elControls.classList.remove("hidden");
    elNextStageArea.classList.add("hidden");
    setFeedback("Toque em&nbsp;<strong>V</strong>&nbsp;ou&nbsp;<strong>F</strong>&nbsp;abaixo para responder.", "neutral");

    if (stage.type === "quiz") {
        activeQuizQuestions = shuffleArray(stage.questions);
        updateStats();
        renderQuizQuestion();
    } else {
        activeQuizQuestions = [];
        updateStats();
        renderTableHeader(stage.columns);
        renderTableRows();
    }
}

function renderQuizQuestion() {
    const q = activeQuizQuestions[currentRowIndex];
    if (!q) return;

    elTableSection.innerHTML = `
        <div class="challenge-card">
            <span class="challenge-counter">Questão ${currentRowIndex + 1} de ${activeQuizQuestions.length}</span>
            <div class="challenge-scenario">${q.scenario}</div>
            <p class="challenge-question">${q.question}</p>
        </div>
    `;

    setFeedback("Toque em&nbsp;<strong>V</strong>&nbsp;ou&nbsp;<strong>F</strong>&nbsp;para responder.", "neutral");
}

function renderTableRows() {
    ensureTableStructure();
    const tableBody = document.getElementById("table-body");
    if (!tableBody) return;

    const stage = STAGES[currentStageIndex];
    tableBody.innerHTML = "";

    stage.rows.forEach((row, rIdx) => {
        const tr = document.createElement("tr");

        if (rIdx < currentRowIndex) {
            tr.className = "row-done";
        } else if (rIdx === currentRowIndex) {
            tr.className = "row-active";
        } else {
            tr.className = "row-pending";
        }

        const givenCells = row.given.map((val) => `<td>${val}</td>`).join("");

        const targetCells = row.steps
            .map((step, sIdx) => {
                const isRowDone = rIdx < currentRowIndex;
                const isRowActive = rIdx === currentRowIndex;
                const isStepDone = isRowDone || (isRowActive && sIdx < currentStepIndex);
                const isStepActive = isRowActive && sIdx === currentStepIndex;

                const displayVal = isStepDone ? step.ans : "?";
                const extraClass = isStepActive ? "cell-target is-current-cell" : "cell-target";

                return `<td><span class="${extraClass}">${displayVal}</span></td>`;
            })
            .join("");

        tr.innerHTML = givenCells + targetCells;
        tableBody.appendChild(tr);
    });
}

function setFeedback(htmlMessage, type) {
    elFeedback.innerHTML = htmlMessage;
    elFeedback.className = "feedback-banner";
    if (type === "success") elFeedback.classList.add("is-success");
    if (type === "error") elFeedback.classList.add("is-error");
}

function updateStats() {
    const stage = STAGES[currentStageIndex];
    const total = getStageTotalSteps(stage);
    const done = getStageCompletedSteps(stage);

    elStreakBadge.textContent = `🔥 ${streak}`;
    const calcPct = total > 0 ? Math.round((done / total) * 100) : 0;
    const pct = done === 0 ? 8 : calcPct;
    elProgressFill.style.width = `${pct}%`;
}

function handleAnswer(userChoice) {
    const stage = STAGES[currentStageIndex];

    if (stage.type === "quiz") {
        const q = activeQuizQuestions[currentRowIndex];
        if (!q) return;

        if (userChoice === q.ans) {
            streak++;
            if (streak > bestStreak) {
                bestStreak = streak;
            }
            setFeedback(`✅ ${q.hintOk}`, "success");
            currentRowIndex++;
            updateStats();

            if (currentRowIndex >= activeQuizQuestions.length) {
                completedStages.add(currentStageIndex);
                saveProgress();
                elControls.classList.add("hidden");
                btnNextStage.textContent =
                    currentStageIndex < STAGES.length - 1
                        ? "Continuar para a próxima fase →"
                        : "Voltar ao menu de fases ✓";
                elNextStageArea.classList.remove("hidden");
            } else {
                renderQuizQuestion();
            }
        } else {
            streak = 0;
            updateStats();
            elFeedback.classList.remove("is-error");
            void elFeedback.offsetWidth;
            setFeedback(`❌ ${q.hintErr}`, "error");
        }
        return;
    }

    const currentRow = stage.rows[currentRowIndex];
    if (!currentRow) return;

    const currentStep = currentRow.steps[currentStepIndex];
    if (!currentStep) return;

    if (userChoice === currentStep.ans) {
        streak++;
        if (streak > bestStreak) {
            bestStreak = streak;
        }

        setFeedback(`✅ ${currentStep.hintOk}`, "success");

        currentStepIndex++;
        if (currentStepIndex >= currentRow.steps.length) {
            currentStepIndex = 0;
            currentRowIndex++;
        }

        updateStats();
        renderTableRows();

        if (currentRowIndex >= stage.rows.length) {
            completedStages.add(currentStageIndex);
            saveProgress();
            elControls.classList.add("hidden");
            if (currentStageIndex < STAGES.length - 1) {
                btnNextStage.textContent = "Continuar para a próxima fase →";
            } else {
                btnNextStage.textContent = "Voltar ao menu de fases ✓";
            }
            elNextStageArea.classList.remove("hidden");
        }
    } else {
        streak = 0;
        updateStats();
        elFeedback.classList.remove("is-error");
        void elFeedback.offsetWidth;
        setFeedback(`❌ ${currentStep.hintErr}`, "error");
    }
}

document.querySelectorAll(".controls .btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        handleAnswer(btn.dataset.value);
    });
});

btnStartRecommended.addEventListener("click", () => {
    const targetIdx = Number(btnStartRecommended.dataset.targetStage || 0);
    openStage(targetIdx);
});

btnBackHome.addEventListener("click", () => {
    showHome();
});

btnNextStage.addEventListener("click", () => {
    if (currentStageIndex < STAGES.length - 1) {
        currentStageIndex++;
        renderStage();
    } else {
        showHome();
    }
});

if (btnResetProgress) {
    btnResetProgress.addEventListener("click", () => {
        const confirmed = window.confirm("Deseja apagar todo o progresso salvo e recomeçar do zero?");
        if (!confirmed) return;

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // Ignora caso o armazenamento local esteja indisponível
        }

        completedStages.clear();
        currentStageIndex = 0;
        currentRowIndex = 0;
        currentStepIndex = 0;
        streak = 0;
        bestStreak = 0;
        saveProgress();

        renderHomeMenu();
    });
}

renderHomeMenu();

// --- ACRÉSCIMO: MÓDULO 2 E SELETOR DE MÓDULOS ---
const MODULO_2_STAGES = [
    {
        type: "table",
        tag: "OU EXCLUSIVO (⊻)",
        title: "Disjunção Exclusiva: Ou P ou Q",
        columns: ["P", "Q", "P ⊻ Q"],
        rule: 'No <strong>OU exclusivo (⊻)</strong>, o resultado é <strong>V</strong> apenas quando <strong>P e Q têm valores diferentes</strong>. Iguais resultam em <strong>F</strong>.',
        propP: '"Vou para o Rio de Janeiro no feriado."',
        propQ: '"Vou para São Paulo no feriado."',
        rows: [
            {
                given: ["V", "V"],
                steps: [{ ans: "F", hintOk: "Ambos V: no OU exclusivo, valores iguais dão F.", hintErr: "No OU exclusivo, V com V dá F porque não é exclusivo." }]
            },
            {
                given: ["V", "F"],
                steps: [{ ans: "V", hintOk: "V e F são diferentes: OU exclusivo é V!", hintErr: "Aqui P é V e Q é F (diferentes): no OU exclusivo dá V." }]
            },
            {
                given: ["F", "V"],
                steps: [{ ans: "V", hintOk: "F e V são diferentes: OU exclusivo é V!", hintErr: "Aqui P é F e Q é V (diferentes): no OU exclusivo dá V." }]
            },
            {
                given: ["F", "F"],
                steps: [{ ans: "F", hintOk: "Ambos F: valores iguais no OU exclusivo dão F.", hintErr: "Com F e F, os valores são iguais: no OU exclusivo dá F." }]
            }
        ]
    },
    {
        type: "table",
        tag: "BICONDICIONAL (↔)",
        title: "Se e somente se: P ↔ Q",
        columns: ["P", "Q", "P ↔ Q"],
        rule: 'No <strong>bicondicional (↔)</strong>, o resultado é <strong>V</strong> quando <strong>P e Q têm o mesmo valor lógico</strong> (V e V, ou F e F).',
        propP: '"Serei aprovado no concurso."',
        propQ: '"Atingirei a nota de corte."',
        rows: [
            {
                given: ["V", "V"],
                steps: [{ ans: "V", hintOk: "Mesmo valor (V e V): bicondicional é V!", hintErr: "P e Q são ambos V (iguais): em ↔ dá V." }]
            },
            {
                given: ["V", "F"],
                steps: [{ ans: "F", hintOk: "Valores diferentes (V e F): bicondicional é F.", hintErr: "Como P é V e Q é F (diferentes), ↔ resulta em F." }]
            },
            {
                given: ["F", "V"],
                steps: [{ ans: "F", hintOk: "Valores diferentes (F e V): bicondicional é F.", hintErr: "Como P é F e Q é V (diferentes), ↔ resulta em F." }]
            },
            {
                given: ["F", "F"],
                steps: [{ ans: "V", hintOk: "Mesmo valor (F e F): bicondicional é V!", hintErr: "P e Q são ambos F (iguais): em ↔ dá V." }]
            }
        ]
    },
    {
        type: "table",
        tag: "CONTRAPOSITIVA (¬Q → ¬P)",
        title: "Equivalência da Condicional",
        columns: ["P", "Q", "¬Q", "¬P", "¬Q → ¬P"],
        rule: 'A contrapositiva <strong>¬Q → ¬P</strong> é equivalente a <strong>P → Q</strong>. Preencha <strong>¬Q</strong>, <strong>¬P</strong> e depois <strong>¬Q → ¬P</strong>.',
        propP: '"Estudo todos os dias."',
        propQ: '"Evoluo na matéria."',
        rows: [
            {
                given: ["V", "V"],
                steps: [
                    { ans: "F", hintOk: "Q é V, então ¬Q é F.", hintErr: "Se Q é V, a negação ¬Q é F." },
                    { ans: "F", hintOk: "P é V, então ¬P é F.", hintErr: "Se P é V, a negação ¬P é F." },
                    { ans: "V", hintOk: "F → F é V (não há V → F).", hintErr: "Na condicional, F → F é V." }
                ]
            },
            {
                given: ["V", "F"],
                steps: [
                    { ans: "V", hintOk: "Q é F, então ¬Q é V.", hintErr: "Se Q é F, a negação ¬Q é V." },
                    { ans: "F", hintOk: "P é V, então ¬P é F.", hintErr: "Se P é V, a negação ¬P é F." },
                    { ans: "F", hintOk: "Aqui ¬Q é V e ¬P é F: V → F é F!", hintErr: "Olhe ¬Q (V) e ¬P (F): V → F é F." }
                ]
            },
            {
                given: ["F", "V"],
                steps: [
                    { ans: "F", hintOk: "Q é V, então ¬Q é F.", hintErr: "Se Q é V, a negação ¬Q é F." },
                    { ans: "V", hintOk: "P é F, então ¬P é V.", hintErr: "Se P é F, a negação ¬P é V." },
                    { ans: "V", hintOk: "F → V é V.", hintErr: "Na condicional, F → V é V." }
                ]
            },
            {
                given: ["F", "F"],
                steps: [
                    { ans: "V", hintOk: "Q é F, então ¬Q é V.", hintErr: "Se Q é F, a negação ¬Q é V." },
                    { ans: "V", hintOk: "P é F, então ¬P é V.", hintErr: "Se P é F, a negação ¬P é V." },
                    { ans: "V", hintOk: "V → V é V.", hintErr: "Na condicional, V → V é V." }
                ]
            }
        ]
    },
    {
        type: "table",
        tag: "LEIS DE DE MORGAN (¬P ∨ ¬Q)",
        title: "Negando a Conjunção: ¬(P ∧ Q)",
        columns: ["P", "Q", "¬P", "¬Q", "¬P ∨ ¬Q"],
        rule: 'Negar <strong>(P ∧ Q)</strong> equivale a <strong>(¬P ∨ ¬Q)</strong>. Preencha <strong>¬P</strong>, <strong>¬Q</strong> e depois <strong>¬P ∨ ¬Q</strong>.',
        propP: '"Li o edital."',
        propQ: '"Paguei a inscrição."',
        rows: [
            {
                given: ["V", "V"],
                steps: [
                    { ans: "F", hintOk: "P é V → ¬P é F.", hintErr: "Negação de V é F." },
                    { ans: "F", hintOk: "Q é V → ¬Q é F.", hintErr: "Negação de V é F." },
                    { ans: "F", hintOk: "F ∨ F é F.", hintErr: "No OU (∨), F com F é F." }
                ]
            },
            {
                given: ["V", "F"],
                steps: [
                    { ans: "F", hintOk: "P é V → ¬P é F.", hintErr: "Negação de V é F." },
                    { ans: "V", hintOk: "Q é F → ¬Q é V.", hintErr: "Negação de F é V." },
                    { ans: "V", hintOk: "F ∨ V é V (basta um V no OU).", hintErr: "No OU (∨), basta um lado ser V para dar V." }
                ]
            },
            {
                given: ["F", "V"],
                steps: [
                    { ans: "V", hintOk: "P é F → ¬P é V.", hintErr: "Negação de F é V." },
                    { ans: "F", hintOk: "Q é V → ¬Q é F.", hintErr: "Negação de V é F." },
                    { ans: "V", hintOk: "V ∨ F é V.", hintErr: "No OU (∨), V com F é V." }
                ]
            },
            {
                given: ["F", "F"],
                steps: [
                    { ans: "V", hintOk: "P é F → ¬P é V.", hintErr: "Negação de F é V." },
                    { ans: "V", hintOk: "Q é F → ¬Q é V.", hintErr: "Negação de F é V." },
                    { ans: "V", hintOk: "V ∨ V é V.", hintErr: "No OU (∨), V com V é V." }
                ]
            }
        ]
    },
    {
        type: "quiz",
        tag: "DESAFIO DE PROVA",
        title: "Aplicação em Questões",
        rule: 'Leia a situação e responda <strong>V</strong> (Verdadeiro) ou <strong>F</strong> (Falso).',
        propP: '"Equivalências e conectivos avançados"',
        propQ: '"Leitura atenta ao enunciado"',
        questions: [
            {
                scenario: 'Proposição: <strong>"Se treino lógica, então acerto questões."</strong>',
                question: 'A frase <strong>"Se não acerto questões, então não treino lógica"</strong> é logicamente equivalente a ela?',
                ans: "V",
                hintOk: "Exato! É a contrapositiva (¬Q → ¬P), sempre equivalente a P → Q.",
                hintErr: "A contrapositiva inverte e nega as duas partes, mantendo a equivalência (V)."
            },
            {
                scenario: 'Proposição: <strong>"O candidato estudou e foi aprovado."</strong>',
                question: 'A negação correta dessa proposição é <strong>"O candidato não estudou e não foi aprovado"</strong>?',
                ans: "F",
                hintOk: "Correto, é F! Por De Morgan, negar 'E' vira 'OU': 'não estudou ou não foi aprovado'.",
                hintErr: "Falso: pela Lei de De Morgan, a negação de (P ∧ Q) troca 'E' por 'OU' (¬P ∨ ¬Q)."
            },
            {
                scenario: 'Sabe-se que <strong>(P ↔ Q)</strong> é Verdadeiro e que <strong>P</strong> é Falso.',
                question: 'Portanto, <strong>Q</strong> também é Falso?',
                ans: "V",
                hintOk: "Isso aí! No bicondicional (↔), para dar V, P e Q precisam ter o mesmo valor.",
                hintErr: "Verdadeiro: em P ↔ Q verdadeiro, P e Q têm o mesmo valor lógico (ambos F)."
            },
            {
                scenario: 'Afirmação: <strong>"Ou vou ao cinema ou vou ao teatro."</strong>',
                question: 'No sentido de OU exclusivo, se a pessoa foi aos dois lugares, a afirmação é Verdadeira?',
                ans: "F",
                hintOk: "Certo, é F! No OU exclusivo, ir aos dois quebra a exclusividade.",
                hintErr: "Falso: no OU exclusivo, valores iguais (V e V) resultam em F."
            }
        ]
    }
];

(function initModulo2Selector() {
    const homeHeader = document.querySelector(".home-header");
    if (!homeHeader || !elStagesList) return;

    const baseStages = [...STAGES];
    let ativo = 1; // 1 = Módulo 1, 2 = Módulo 2

    const bar = document.createElement("div");
    bar.className = "modules-bar";
    bar.style.cssText = "display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;";

    const btnMod1 = document.createElement("button");
    btnMod1.type = "button";
    btnMod1.textContent = "Módulo 1 • Base";

    const btnMod2 = document.createElement("button");
    btnMod2.type = "button";
    btnMod2.textContent = "Módulo 2 • Avançado";

    function estilizarAbas() {
        const estiloAtivo = "border:1px solid #2563eb;background:#2563eb;color:#fff;padding:6px 14px;border-radius:999px;font-weight:600;font-size:0.85rem;cursor:pointer;";
        const estiloInativo = "border:1px solid #cbd5e1;background:#f8fafc;color:#1e293b;padding:6px 14px;border-radius:999px;font-weight:600;font-size:0.85rem;cursor:pointer;";
        btnMod1.style.cssText = ativo === 1 ? estiloAtivo : estiloInativo;
        btnMod2.style.cssText = ativo === 2 ? estiloAtivo : estiloInativo;
    }

    function aplicarModulo(num) {
        ativo = num;
        estilizarAbas();

        const tagEl = homeHeader.querySelector(".tag");
        const subEl = homeHeader.querySelector(".home-subtitle");

        STAGES.length = 0;
        if (num === 1) {
            STAGES.push(...baseStages);
            if (tagEl) tagEl.textContent = "MÓDULO 1 • DO ZERO AO PRÁTICO";
            if (subEl) subEl.textContent = "Domine tabelas-verdade passo a passo com feedback imediato. Escolha uma fase para começar:";
        } else {
            STAGES.push(...MODULO_2_STAGES);
            if (tagEl) tagEl.textContent = "MÓDULO 2 • CONECTIVOS AVANÇADOS E EQUIVALÊNCIAS";
            if (subEl) subEl.textContent = "OU exclusivo, bicondicional, contrapositiva, Leis de De Morgan e questões de prova.";
        }

        renderHomeMenu();
    }

    btnMod1.addEventListener("click", () => aplicarModulo(1));
    btnMod2.addEventListener("click", () => aplicarModulo(2));

    bar.appendChild(btnMod1);
    bar.appendChild(btnMod2);
    homeHeader.prepend(bar);
    estilizarAbas();
})();
