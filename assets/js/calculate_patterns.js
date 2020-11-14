// 配属組み合わせを計算するためのコード Tetsuaki Baba
// 下限（min），上限(max), 研究室数（sum_studio），配属人数（sum_student)から自動的に候補を算出する
// 必要なDOMを用意した後，getAssignPattern()を呼び出すだけ．中身は再帰関数になっている．

var studio_patterns = [];
var assign_patterns = [];　 // この配列に候補となる組み合わせが格納される

function getCandidateStudioCombination(A) {
    var min = int(document.getElementById("min").value);
    var max = int(document.getElementById("max").value);
    var sum_studio = int(document.getElementById("sum_studio").value);

    // 終端条件 
    if (A.length == (max - min + 1)) {

        let sum = 0;
        A.forEach(a => {
            sum += a;
        });
        if (sum == sum_studio) {
            studio_patterns.push(A.concat());
        }
        return;
    }

    for (let i = 0; i <= sum_studio; i++) {
        A.push(i)
        getCandidateStudioCombination(A)
        A.pop() //# これが結構ポイント
    }
}



function getAssignPatterns() {

    // 組み合わせによっては時間がかかる場合があるので，組み合わせを計算中アニメーションを表示させておく．
    var place_to_show = document.getElementById("assign_patterns_placeholder");
    studio_patterns = [];
    assign_patterns = [];
    var min = document.getElementById("min").value;
    var max = document.getElementById("max").value;
    var sum_studio = document.getElementById("sum_studio").value;
    var sum_student = document.getElementById("sum_student").value;


    // 合計が12になるスタジオ構成のすべての組み合わせを返す
    getCandidateStudioCombination([]);

    // 検索数が多すぎる場合にbreakしたかったので、someメソッドを使ってます。分かりづらい。
    studio_patterns.some(function(r) {
        let sum = 0;
        var num = [];
        for (let i = max; i >= min; i--) {
            num.push(int(i));
        }
        sum = 0;
        for (let i = 0; i < r.length; i++) {
            sum += r[i] * num[i];
        }

        if (sum == sum_student) {
            assign_patterns.push(r);
        }
        console.log(assign_patterns.length);
        if (assign_patterns.length > 50) {
            alert("配属パターンが多すぎるため処理を中断しました。最大50パターンまです。上限および下限を操作して配属パターンを減らしてください。");
            return true;
        }
    });
    //console.log(assign_patterns);

    var place_to_show = document.getElementById("assign_patterns_placeholder");
    place_to_show.innerHTML = "配属可能パターン（例：[5,2] -> 5人スタジオが5つ，4人スタジオが2つ）<br>[ ";
    for (let i = max; i >= min; i--) {
        place_to_show.innerHTML += str(i) + "人配属研究室,";
    }
    place_to_show.innerHTML += "]<br>";
    assign_patterns.forEach(pattern => {
        place_to_show.innerHTML += "[ " + pattern + " ]<br>";
    });


}