let questions = [];
let currentIndex = 0;
let results = {}; // クイズ番号:正誤
let correctCnt = 0;
let quizKey = "lastProgress"; // localStorage key

document.getElementById("startBtn").addEventListener("click", () => {
    const year = document.getElementById("yearSelect").value;
    const type = document.getElementById("typeSelect").value;
    if (!year || !type) {
        alert("年と試験を選択してください");
        return;
    }
    localStorage.removeItem(quizKey); // データをクリア
    correctCnt = 0;
    fetch(`data/${type}/${year}_${type}.csv`)
        .then(res => res.text())
        .then(text => {
            questions = parseCSV(text);
            currentIndex = 0;
            results = {};
            showQuestion();
        });
});

function parseCSV(text) {
    const lines = text.trim().split("\n");
    const list = [];
    for (let i = 0; i < lines.length; i++) { // 跳过表头
        const [year, type, time, id, answer] = lines[i].split(",");
        list.push({ year:year, type:type, time:time, id:id, answer:answer.trim() });
    }
    return list;
}

function showQuestion() {
    const container = document.getElementById("quizContainer");
    document.getElementById("title").style.display = "none";
    container.innerHTML = "";
    if (currentIndex >= questions.length) {
        showResult();
        return;
    }

    const q = questions[currentIndex];
    const div = document.createElement("div");
    div.className = "question";

    // 图片题目
    const img = document.createElement("img");
    img.src = `images/${q.type}/${q.year}/${q.year}_${q.type}_${q.time}_${q.id}.png`;
    div.appendChild(img);

    const buttons = [];
    ["ア", "イ", "ウ", "エ"].forEach(opt => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        btn.onclick = () => {
            // 冻结所有按钮
            buttons.forEach(b => b.disabled = true);

            if (q.answer === opt) {
                btn.style.background = "lightgreen";
                results[q.id] = "correct";
                correctCnt += 1;
            } else {
                btn.style.background = "salmon";
                results[q.id] = "wrong";
                // 高亮正确答案
                const correctBtn = buttons.find(b => b.innerText === q.answer);
                if (correctBtn) correctBtn.style.background = "lightgreen";
            }

            const latestProg = {
                year: document.getElementById("yearSelect").value,
                type: document.getElementById("typeSelect").value,
                currentIndex: currentIndex,
                correctCnt: correctCnt,
                results: results
            };
            localStorage.setItem(quizKey, JSON.stringify(latestProg));

            // 显示“下一题”按钮
            const nextBtn = document.createElement("button");
            nextBtn.innerText = "次の問題";
            nextBtn.style.marginTop = "10px";
            nextBtn.onclick = () => {
                currentIndex++;
                showQuestion();
            };
            div.appendChild(document.createElement("br"));
            div.appendChild(nextBtn);
        };
        buttons.push(btn);
        div.appendChild(btn);
    });

    container.appendChild(div);
    updateProgress();
}

function updateProgress() {
    const progress = document.getElementById("progress");
    progress.innerText = `現在 ${currentIndex +1 } / ${questions.length} 問 \n 正解数 ${correctCnt} / ${currentIndex}`;
}

function showResult() {
    const container = document.getElementById("quizContainer");
    document.getElementById("title").style.display = "block";
    container.innerHTML = "<h2>結果</h2>";

    const correct = Object.values(results).filter(v => v === "correct").length;
    const wrong = Object.values(results).filter(v => v === "wrong").length;
    const wrongIds = Object.keys(results).filter(k => results[k] === "wrong");

    container.innerHTML += `<p>問題数：${questions.length}</p>`;
    container.innerHTML += `<p>正解数：${correct}</p>`;
    container.innerHTML += `<p>間違い数：${wrong}</p>`;
    container.innerHTML += `<p>間違った問題：${wrongIds.join(", ") || "全問正解"}</p>`;
}

function loadLastProgess() {
    let data = localStorage.getItem(quizKey);
    return data ? JSON.parse(data) :null;
}

window.addEventListener("DOMContentLoaded", () => {
    const progress = loadLastProgess();
    if (progress) {
        if (confirm(`前回は ${progress.year} 年の ${progress.type} 試験の第 ${progress.currentIndex + 1} 問を進行中、復帰しますか？`)) {
            currentYear = progress.year;
            currentType = progress.type;
            document.getElementById("yearSelect").value = currentYear;
            document.getElementById("typeSelect").value = currentType;
            currentIndex = progress.currentIndex;
            correctCnt = correctCnt
            results = progress.results;

            fetch(`data/${currentType}/${currentYear}_${currentType}.csv`)
                .then(res => res.text())
                .then(text => {
                    questions = parseCSV(text);
                    showQuestion();
                });
        } else {
            localStorage.removeItem(quizKey);
        }   
    }
});