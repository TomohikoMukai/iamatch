// 配属ループ修了判定ヘルパー
function checkTerminal(students) {
    for (let s = 0; s < students.length; ++s) {
        if (students[s].status == "") {
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
        const labs = [
            { name: "Ergonomics", slots: 3, applicants: [] },
            { name: "Transportation",  slots: 3, applicants: [] },
            { name: "EquipmentService",  slots: 3, applicants: [] },
            { name: "Interior",  slots: 3, applicants: [] },
            { name: "Spatial",  slots: 2, applicants: [] },
            { name: "Interface",  slots: 2, applicants: [] },
            { name: "Interactive",  slots: 2, applicants: [] },
            { name: "Software",  slots: 2, applicants: [] },
            { name: "Kinematograph",  slots: 2, applicants: [] },
            { name: "Network",  slots: 2, applicants: [] },
            { name: "VisualCommunication",  slots: 2, applicants: [] },
            { name: "Editorial",  slots: 2, applicants: [] }
        ];
        
        let numSlots = 0;
        labs.forEach(lab => {
            numSlots += lab.slots;
        });
        
        // 配属アルゴリズム本体
        // エクセルファイルを読み込んで，読み込み成功なら処理をすすめる
        readXlsxFile(fileInfo).then(function(rows) {
            // エクセルテーブルを連想配列に準備
            let students = []
            let entriedStudents = [];
            for (let i = 1; i < rows.length; i++) {                
                const elements = rows[i];
                let student = {
                    id: entriedStudents.length, // エントリーID
                    name: elements[6], // 氏名
                    gpa: elements[8], // GPA
                    units: elements[9], // 取得単位数
                    status: "", // 仮配属ステータス
                    entry: [] // 志望研究室
                }
                for (let l = 0; l < 12; ++l) {
                    const pref = {
                        lab: labs[l].name, // 研究室名
                        priority: elements[l * 2 + 10], // 志望順
                        point: elements[l * 2 + 11], // ポイント
                    };
                    student.entry.push(pref);
                }
                // 志望順位でソート
                student.entry.sort(function (x, y) {
                    return x.priority - y.priority;
                });
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
                            alert("同率のため比較不可: " + lab.name + " / "
                                + students[x.id].name + " - "
                                + students[y.id].name);
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
                    }
                    lab.applicants = [] // 志望者リストのクリア
                });
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
