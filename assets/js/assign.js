// 配属ループ修了判定ヘルパー
function checkTerminal(students) {
    for (let s = 0; s < students.length; ++s) {
        if (students[s].status == 0) {
            return false;
        }
    }
    return true;
}

// 以降、しばらくファイルまわりのアレコレ
const form = document.forms.student;
const resultElement = document.getElementById('result');
form.student.addEventListener('change', function (event) {
    const fileInfo = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(fileInfo);

    reader.addEventListener('load', function () {
        // 研究室リスト
        const labs = {
            "Editorial": { slots:  3, applicants: [] },
            "EquipmentService": { slots:  5, applicants: [] },
            "Ergonomics": { slots:  3, applicants: [] },
            "Interactive": { slots:  5, applicants: [] },
            "Interface": { slots:  3, applicants: [] },
            "Interior": { slots:  5, applicants: [] },
            "Kinematograph": { slots:  3, applicants: [] },
            "Network": { slots:  5, applicants: [] },
            "Software": { slots:  3, applicants: [] },
            "Spatial": { slots:  5, applicants: [] },
            "Transportation": { slots:  3, applicants: [] },
            "VisualCommunication": { slots:  5, applicants: [] }
        };
        
        let numSlots = 0;
        for (let [name, data] of Object.entries(labs)) {
        	numSlots += data.slots;
        }
        
        // 配属アルゴリズム本体
        // エクセルファイルを読み込んで，読み込み成功なら処理をすすめる
        readXlsxFile(fileInfo).then(function (rows) {
            // エクセルテーブルを連想配列に準備
            let students = []
            let entriedStudents = [];
            for (let i = 1; i < rows.length; i++) {                
                const elements = rows[i];
                let student = {
                    id: entriedStudents.length, // エントリーID
                    name: elements[6], // 氏名
                    gpa: elements[7], // GPA
                    units: elements[8], // 取得単位数
                    status: 0, // 仮配属ステータス
                    entry: [] // 志望研究室
                }
                let entriedLab = new Set();
                for (let e = 9; e < elements.length - 2; e += 2) {
                    const pref = {
                        lab: elements[e],    // 研究室名
                        point: elements[e + 1] // ポイント
                    };
                    if (entriedLab.has(elements[e])) {
                        alert(elements[6] + "は" + elements[e] + "に重複してエントリーしています");
                    }
                    student.entry.push(pref);
                    entriedLab.add(elements[e]);
                }
                // 複数回応募している場合は既登録内容を上書き
                const esid = entriedStudents.findIndex((name) => name == student.name);
                if (esid >= 0) {
                    student.id = esid;
                    students[esid] = student;
                }
                else { // 初回レコードはそのまま追加
                    students.push(student);
                    entriedStudents.push(student.name);
                }
            }
            
            if (numSlots < students.length) {
            	alert("定員数が学生数を下回っています");
            	throw new Error("定員数不足");
            }

            // 全員が仮配属か未決定になるまでループ
            while (!checkTerminal(students)) {
                // 現時点で希望するスタジオにエントリー
                students.forEach(student => {
                    let name;
                    if (student.entry.length > 0) {
                        name = student.entry[0].lab;
                    }
                    else {
                        window.confirm(student.id);
                    }
                    labs[name].applicants.push({
                        id: student.id,
                        point: student.entry[0].point,
                        gpa: student.gpa,
                        units: student.units
                    });
                });
                for (let [name, data] of Object.entries(labs)) {
                    // ポイント&GPA&取得単位数順に降順ソート
                    data.applicants.sort(function (x, y) {
                        if (y.point != x.point) {
                            return y.point - x.point;
                        }
                        if (y.gpa != x.gpa) {
                            return y.gpa - x.gpa;
                        }
                        if (y.units == x.units) {
                            alert("同率のため比較不可: " + name + " / "
                                + students[x.id].name + " - "
                                + students[y.id].name);
                            throw new Error("同率のため比較不可");
                        }
                        return y.units - x.units;
                    });
                    // 仮配属処理
                    const numApplicants = data.applicants.length;
                    let a = 0;
                    for (; a < data.slots && a < numApplicants; ++a) {
                        const sid = data.applicants[a].id;
                        students[sid].status = name;
                    }
                    // 落選者処理
                    for (; a < numApplicants; ++a) {
                        // 志望を繰り下げ
                        const sid = data.applicants[a].id;
                        students[sid].status = 0;
                        students[sid].entry.shift();
                        // 志望先がなくなったら未決定状態に
                        if (students[sid].entry.length <= 0) {
                            students[sid].status = -1;
                        }
                    }
                    data.applicants = [] // 志望者リストのクリア
                }
            }
            let displayElement = '';
            students.forEach(s => {
                displayElement += '<tr>';
                displayElement += `<td>${s.name}</td>`;
                displayElement += `<td>${s.status}</td>`;
                displayElement += `<td>${13-s.entry.length}</td>`;
                displayElement += '</tr>';
            });
            resultElement.innerHTML = displayElement;
        });


    });
});