const form = document.forms.student;

var element_labs;


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

// 実行ボタンで呼び出される．呼び出しはui.jsから行われます
function assign() {
    let privacy_mode = document.getElementById('privacy_mode').checked;

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
        end_time = millis() + 2000; // アニメーション時間を2秒に設定
        canvas.show(); // canvasを表示
        sound_cals.play(); // 音を鳴らす
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
                        name: student.name,
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

            // tooltip（マウスホバーで見えるヒント情報）の設定
            let entry = '<h5>' + s.name + "の配属希望一覧</h5>";
            if (privacy_mode) {
                entry = entry + 'GPA:' + "--" + '<br>' + '取得単位:' + "--" + '<br>';
            } else {
                entry = entry + 'GPA:' + s.gpa + '<br>' + '取得単位:' + s.units + '<br>';
            }

            for (let i = 0; i < s.entry_original.length; i++) {
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



        displayElement = '';
        for (let i = 0; i < labs.length; ++i) {
            displayElement += '<tr>';
            displayElement += `<td>${i + 1}</td>`;
            displayElement += `<td>${statistics[i]}</td>`;
            displayElement += `<td>${statistics[i] * 100.0 / students.length}</td>`;
            displayElement += '</tr>';
        }
        statisticsElement.innerHTML = displayElement;



        // 各研究室に配属された学生(lab.member)を tooltipでまとめて見えるようにする．
        labs.forEach(lab => {
            let list = "";
            lab.member.forEach(m => {

                if (privacy_mode) {
                    list += "anonymous" + " : " + "--" + " : " + "--" + "<br>";
                } else {
                    list += m.name + " : " + m.gpa + " : " + m.units + "<br>";
                }
            });
            lab.element_td_assigned.attribute("data-html", "true");
            lab.element_td_assigned.attribute("data-toggle", "tooltip");
            lab.element_td_assigned.attribute("data-placement", "top");
            lab.element_td_assigned.attribute("title", list);
        });
        $('[data-toggle="tooltip"]').data('bs.tooltip', false).tooltip()
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