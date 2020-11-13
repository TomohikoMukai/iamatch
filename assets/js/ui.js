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


        //td_assigned.attribute("title", "ファイルを読み込むとここに配属学生一覧が表示されます");
        //$('[data-toggle="tooltip"]').tooltip()

        let td_search = createElement('td');
        let checkbox_search = createCheckbox("", false);
        input_assigned.addClass('form-control form-control-sm col-xs-4');
        checkbox_search.parent(td_search);
        checkbox_search.mouseClicked(proposeReduction);
        td_search.parent(tr);

        labs[i].element_tr = tr;
        labs[i].element_lab_name = td_lab_name;
        labs[i].element_slots = input_capacity;
        labs[i].element_td_assigned = td_assigned;
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

$(function() {
    $('[data-toggle="tooltip"]').tooltip()
})




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