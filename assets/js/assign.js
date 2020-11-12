const form = document.forms.student;

var element_labs;

$(function() {
    $('[data-toggle="tooltip"]').tooltip()
})

var canvas;
var noise_x = 0.0;
var noise_y = 0.0;
var end_time;
var img_iamatch;
var sound_calc;
var sound_done;


function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas');
    end_time = millis();
    canvas.hide();
    noLoop();
    frameRate(15);
    //canvas.hide();
    // labsのオブジェクト型配列に基づいてhtmlで一覧表示をする。
    for (let i = 0; i < labs.length; i++) {
        let tr = createElement('tr');
        tr.parent('studio_list')
        let td_lab_name = createElement('td', labs[i].name);
        td_lab_name.parent(tr);

        let td_capacity = createElement('td');
        let input_capacity = createInput(labs[i].slots, 'number');
        input_capacity.changed(changedCapacity);
        input_capacity.addClass('form-control form-control-sm');
        input_capacity.parent(td_capacity);
        td_capacity.parent(tr);

        let td_assigned = createElement('td');
        let input_assigned = createInput("0", 'text');
        input_assigned.addClass('form-control form-control-sm');
        input_assigned.attribute('readonly', 'readonly');
        input_assigned.parent(td_assigned);
        td_assigned.parent(tr);

        let td_search = createElement('td');
        let checkbox_search = createCheckbox("", false);
        input_assigned.addClass('form-control form-control-sm col-xs-4');
        checkbox_search.parent(td_search);
        checkbox_search.mouseClicked(proposeReduction);
        td_search.parent(tr);

        labs[i].element_tr = tr;
        labs[i].element_lab_name = td_lab_name;
        labs[i].element_slots = input_capacity;
        labs[i].element_assigned = input_assigned;
        labs[i].element_search = checkbox_search;
    }

    select('#button_execute').mouseClicked(assign);
    select('#min').changed(minChanged);
    select('#max').changed(minChanged);
    select('#toggle_all_checkboxes').changed(toggleAllCheckboxes);
    document.getElementById("sum_of_capacity").value = updateSlots();
    document.getElementById("sum_studio").value = labs.length;

}

function toggleAllCheckboxes() {
    labs.forEach(lab => {
        lab.element_search.checked(this.checked());
    });

}

function minChanged() {
    getAssignPatterns();
}

function maxChanged() {
    getAssignPatterns();

}

// Checkが入っている研究室の中から最もGPAが低い学生を探し，その学生が所属する研究室を見つける
function proposeReduction() {
    for (let i = 0; i < labs.length; i++) {
        if (labs[i].element_tr.hasClass("table-danger")) {
            labs[i].element_tr.removeClass("table-danger");
        }
    }

    // checkが入っている研究室の中からgpaが最も低い学生のgpa数値と所属研究室名を含む連想配列を準備する
    var array = [];
    labs.forEach(lab => {
        if (lab.element_search.checked()) {
            array.push({
                name: lab.name,
                gpa: lab.member[0].gpa,
                units: lab.member[0].units
            });
        }
    });

    // 出来上がったarrayをgpa順に昇順ソートする
    array.sort(function(x, y) {
        if (y.gpa != x.gpa) {
            return x.gpa - y.gpa;
        }
        if (y.units == x.units) {
            alert("同率のため比較不可: " + lab.name + " / " +
                students[x.id].name + " - " +
                students[y.id].name);
            throw new Error("同率のため比較不可");
        }
        return x.units - y.units;
        return 0;
    })

    // array[0]に入っている研究室が定員削減対象研究室になるため，わかるように表示する
    let lab = labs.find((l) => l.name === array[0].name);
    if (!lab.element_tr.hasClass("table-danger")) {
        lab.element_tr.addClass("table-danger");
    }

}

function preload() {
    img_iamatch = loadImage('assets/images/iamatch_medium.png')
    sound_cals = loadSound('assets/sounds/VSQSE_0504_spin1.mp3');
    sound_done = loadSound('assets/sounds/VSQSE_0528_kiran_3.mp3');
}


var is_animating = false;

function draw() {
    imageMode(CENTER);
    clear(255);
    background(255, 0);
    if (millis() > end_time && is_animating == true) {
        sound_done.play();
        canvas.hide();
        noLoop();
        document.getElementById("iamatch").hidden = false;
        document.getElementById("list").hidden = false;
        is_animating = false;
    } else if (millis() <= end_time) {
        let r = 20.0;
        let x = r * noise(noise_x);
        let y = r * noise(noise_y);
        image(img_iamatch, width / 2 + x,
            height / 2 + y);
        textSize(100);
        noise_x += 10.1;
        noise_y += 10.1;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function changedCapacity() {
    let max = int(document.getElementById('max').value);
    let min = int(document.getElementById('min').value);
    if (this.value() > max) {
        alert("上限を超えて設定はできません");
        this.value(max);
        return;
    }
    if (this.value() < min) {
        alert("下限をより小さな値は設定はできません");
        this.value(min);
        return;
    }
    let sum_of_capacity = updateSlots();
    document.getElementById("sum_of_capacity").value = sum_of_capacity;
}

function updateSlots() {
    let sum_of_capacity = 0;
    // html上の配属人数でオブジェクトデータの配属人数を更新する
    for (let i = 0; i < labs.length; i++) {
        labs[i].slots = labs[i].element_slots.value();
        sum_of_capacity = sum_of_capacity + int(labs[i].slots);
    }
    return sum_of_capacity;
}

// 配属ループ終了判定ヘルパー
function checkTerminal(students) {
    for (let s = 0; s < students.length; ++s) {
        if (students[s].status == "") {
            return false;
        }
    }
    return true;
}

const resultElement = document.getElementById('result');
const statisticsElement = document.getElementById('result_statistics');
let fileInfo;
let reader;

function assign() {

    updateSlots();
    for (let i = 0; i < labs.length; i++) {
        labs[i].element_assigned.value(0);

    }
    if (!fileInfo) {
        window.alert("最初にファイルをアップロードしてください。");
        return;
    }

    // iamatchアニメーション設定
    if (document.getElementById('animation').checked) {
        end_time = millis() + 2000;
        canvas.show();
        sound_cals.play();
        document.getElementById("iamatch").hidden = true;
        document.getElementById("list").hidden = true;
        is_animating = true;
        loop();
    }

    // 配属アルゴリズム本体
    // エクセルファイルを読み込んで，読み込み成功なら処理をすすめる
    let numSlots = 0;
    labs.forEach(lab => {
        numSlots += int(lab.slots);
    });
    readXlsxFile(fileInfo).then(function(rows) {
        // エクセルテーブルをオブジェクトに準備
        // Google Spreadsheet format
        // 0: タイムスタンプ
        // 1: メールアドレス
        // 2: 学習番号
        // 3: 氏名
        // 4: GPA
        // 5: 単位取得数
        // 6+n*2: 研究室の希望数値（第何希望なのか？）
        // 6+n*2+1: 研究室履修ポイント

        let number_of_studio = 12;
        let data_position = {
            timestamp: 0,
            email: 1,
            number: 2,
            name: 3,
            gpa: 4,
            credits: 5,
            studio: 6,
            studio_score: 6 + 1
        };

        let students = []
        let entriedStudents = [];
        for (let i = 1; i < rows.length; i++) {
            const elements = rows[i];
            let student = {
                id: entriedStudents.length, // エントリーID
                name: elements[data_position.name], // 氏名
                gpa: parseFloat(elements[data_position.gpa]), // GPA
                units: parseInt(elements[data_position.credits]), // 取得単位数
                status: "", // 仮配属ステータス
                entry: [], // 志望研究室
                entry_original: [] // 志望研究室保存用
            }
            for (let l = 0; l < number_of_studio; ++l) {
                const pref = {
                    lab: labs[l].name, // 研究室名
                    priority: parseInt(elements[(l * 2) + 6]), // 志望順
                    point: parseInt(elements[(l * 2) + 6 + 1]), // ポイント
                };
                student.entry.push(pref);
                student.entry_original.push(pref);
            }
            // 志望順位でソート
            student.entry.sort(function(x, y) {
                return x.priority - y.priority;
            });
            // 志望順位でソート
            student.entry_original.sort(function(x, y) {
                return x.priority - y.priority;
            });
            // 複数回応募している場合は既登録内容を上書き
            const esid = entriedStudents.findIndex((name) => name == student.name);
            if (esid >= 0) {
                student.id = esid;
                students[esid] = student;
            } else { // 初回レコードはそのまま追加
                students.push(student);
                entriedStudents.push(student.name);
            }
        }

        if (numSlots < students.length) {
            alert("志望者数が研究室定員総数を上回っています");
            throw new Error("志望者数超過");
        }

        // 全員が仮配属か未決定になるまでループ
        while (!checkTerminal(students)) {
            // 現時点で希望するスタジオにエントリー
            students.forEach(student => {
                if (student.entry.length > 0) {
                    const name = student.entry[0].lab;
                    let lab = labs.find(l => l.name == name);
                    lab.applicants.push({
                        id: student.id,
                        point: student.entry[0].point,
                        gpa: student.gpa,
                        units: student.units
                    });
                }
            });
            labs.forEach(lab => {
                // ポイント&GPA&取得単位数順に降順ソート
                lab.applicants.sort(function(x, y) {
                    if (y.point != x.point) {
                        return y.point - x.point;
                    }
                    if (y.gpa != x.gpa) {
                        return y.gpa - x.gpa;
                    }
                    if (y.units == x.units) {
                        alert("同率のため比較不可: " + lab.name + " / " +
                            students[x.id].name + " - " +
                            students[y.id].name);
                        throw new Error("同率のため比較不可");
                    }
                    return y.units - x.units;
                });
                // 仮配属処理
                const numApplicants = lab.applicants.length;
                let a = 0;
                for (; a < lab.slots && a < numApplicants; ++a) {
                    const sid = lab.applicants[a].id;
                    students[sid].status = lab.name;
                }
                // 落選者処理
                for (; a < numApplicants; ++a) {
                    // 志望を繰り下げ
                    const sid = lab.applicants[a].id;
                    students[sid].status = "";
                    students[sid].entry.shift();
                    // 志望先がなくなったら未決定状態に
                    if (students[sid].entry.length <= 0) {
                        students[sid].status = "unassigned";
                    }

                    // 落選処理が行われた研究室は検索チェックをONに変更
                    // const target_namme = lab.name;
                    // let target = labs.find((l) => l.name === lab.name);
                    // target.element_search.checked(true);

                }
                lab.member = lab.applicants; // 配属されたメンバーを member として保存しておく
                // 配属者のgpaを昇順でソートする
                lab.member.sort(function(x, y) {
                    return x.gpa - y.gpa;
                });
                lab.applicants = [] // 志望者リストのクリア
            });
        }
        let sumRankn = 0;
        let statistics = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let displayElement = '';
        students.forEach(s => {
            let entry = '<h5>' + s.name + "の配属希望一覧</h5>";
            entry = entry + 'GPA:' + s.gpa + ', ' + '取得単位:' + s.units + '<br>';
            for (let i = 0; i < s.entry.length; i++) {
                entry =
                    entry + str(i + 1) + ":" +
                    s.entry_original[i].lab + "[" +
                    s.entry_original[i].point + "]" +
                    '<br>';
            }

            const rankn = 13 - s.entry.length;
            statistics[rankn - 1] += 1;
            sumRankn += rankn;

            if (rankn == 1) {
                displayElement += '<tr data-html=\"true\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"' + entry + '\">';
                displayElement += '<td>' + s.name + '</td>';
                displayElement += `<td>${s.status}</td>`;
                displayElement += `<td>${rankn}</td>`;
                displayElement += '</tr>';
            } else {
                displayElement += '<tr class=\"table-danger\" data-html=\"true\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"' + entry + '\">';
                displayElement += '<td>' + s.name + '</td>';
                displayElement += `<td>${s.status}</td>`;
                displayElement += `<td>${rankn}</td>`;
                displayElement += '</tr>';
            }

            // 配属された研究室の配属者数を増やす
            var lab_assigned = labs.filter(function(item, index) {
                if (item.name.indexOf(s.status) >= 0) {
                    return true;
                }
            });
            let num = lab_assigned[0].element_assigned.value();
            num++;
            lab_assigned[0].element_assigned.value(num);

        });
        resultElement.innerHTML = displayElement;
        $('[data-toggle="tooltip"]').tooltip()


        displayElement = '';
        for (let i = 0; i < 12; ++i) {
            displayElement += '<tr>';
            displayElement += `<td>${i + 1}</td>`;
            displayElement += `<td>${statistics[i]}</td>`;
            displayElement += `<td>${statistics[i] * 100.0 / students.length}</td>`;
            displayElement += '</tr>';
        }
        statisticsElement.innerHTML = displayElement;

        proposeReduction();
    });


    if (document.getElementById('animation').checked) {
        canvas.show();
    }

}

// ファイル読み込みがあったとき（ファイルに変更があったとき）
form.student.addEventListener('change', function(event) {
    fileInfo = event.target.files[0];
    let sum_of_row = 0;
    readXlsxFile(fileInfo).then(function(rows) {
        document.getElementById("sum_student").value = rows.length - 1;
        getAssignPatterns();
    });

});