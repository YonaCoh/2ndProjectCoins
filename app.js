class CoinData {
    constructor(data) {
        this.imgUrl = data.image.small;
        this.coins = {
            "usd": data.market_data.current_price.usd + " $",
            "eur": data.market_data.current_price.eur + " €",
            "ils": data.market_data.current_price.ils + " ₪"
        };
    }
}
function handleNavbar() {
    isBtnOpened = !isBtnOpened;
    if(isBtnOpened){
        $('#allPage').css('padding-top','150px');
        return;
    }
    $('#allPage').css({ 'padding-top' : '35px' });
}

$(document).ready(() => {
    
    $("#navBarBtn").click(handleNavbar);
    $("#searchBar").keydown(handleSearch);
    $('#liveReportsTab').click(handleReports);
    $('#aboutTag').click(handleAbout);
    $("#homeTag").click(handleHome);
    $("#navbar-brand-id").click(handleHome);
    $("#homeTag").click();
});

let isBtnOpened = false;
let checkBoxes;
let intervalId;
let globalData;
let progInterval;
let arrChecked = [];
let checkedInModal = [];
let isModalOpen = false;
let isMoreInfo = false;


// window.onload = function() {
// }

function handleHome() {
    tabIsPressed();
    if(!globalData) {
        handleProgBar();
        getAllData(function(data) {
            globalData = data;
            data = data.filter(word => word.name.length < 8 && word.name.length > 3);
            finishProgBar(()=> createTemplate(data));
        });
        $("#home").show();    
        return;
    }
    globalData = globalData.filter(word => word.name.length < 8 && word.name.length > 3);
    createTemplate(globalData);
    $("#home").show();
    // $(arrChecked).bootstrapToggle("on");
}

//Get data from APIs
//------------------------------------

// Get all coins data
function getAllData(cb) {
    let xhr = new XMLHttpRequest();
    let url = "https://api.coingecko.com/api/v3/coins/list";

    xhr.addEventListener("load", function() {
        cb(this.response);
    });
    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
};
// Get specific coin data
function getCoinData(coin, cb) {

    let xhr = new XMLHttpRequest();
    let url = `https://api.coingecko.com/api/v3/coins/${coin}`

    xhr.addEventListener("load", function() {
        cb(this.response);
    });

    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
};
// Get data of coins checked by the user
function getReportData(symbols, cb) {
    let xhr = new XMLHttpRequest();
    let url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=usd,eur,ils`;

    xhr.addEventListener("load", function() {
        cb(this.response);
    })

    xhr.open('GET', url);
    xhr.responseType= "json";
    xhr.send();
}


// Gets all the data relevent and creates the chart. 
function renderChart(coinsData) {
    let dataObjects = []

    for(let coin in coinsData) {
        dataObjects.push(
            {
                type: "spline",
                showInLegend: true,
                //axisYIndex: 0, //Defaults to Zero
                name: coin,
                xValueFormatString: "####",
                dataPoints: coinsData[coin]
            }
        )
    }

    let chart = new CanvasJS.Chart("chartContainer",{              
        title:{
            text: "Virtual Coins Live Reports"
        },
        axisX:{
            interval: 2,
            intervalType: "second",
        },
        axisY:[{
            title: "Linear Scale",
            lineColor: "#369EAD",
            titleFontColor: "#369EAD",
            labelFontColor: "#369EAD"
        },
        {
            title: "Logarithmic Scale",
            logarithmic: true,
            lineColor: "#C24642",
            titleFontColor: "#C24642",
            labelFontColor: "#C24642"
        }],
        axisY2:[{
            title: "Linear Scale",
            lineColor: "#7F6084",
            titleFontColor: "#7F6084",
            labelFontColor: "#7F6084"
        },
        {
            title: "Logarithmic Scale",
            logarithmic: true,
            interval: 1,
            lineColor: "#86B402",
            titleFontColor: "#86B402",
            labelFontColor: "#86B402"
        }],
        data: dataObjects
    });

    chart.render();
}

function handleReports(){
    if(arrChecked.length <= 0) {
        alert("Please choose at least one coin");
        return;
    }
    tabIsPressed();
    handleProgBar();
    $("#liveReports").show();

    let firstChart = true;
    let coinData = {};
    let arrValues = arrChecked.map(c => c.getAttribute('symbol'));
    let strIds = arrValues.join();
    
    intervalId = setInterval(function() {
        getReportData(strIds, function(data) {
            if(data["Response"] === "Error") {
                finishProgBar(() => {
                    clearInterval(intervalId);
                    alert(data["Message"]);
                    $("#liveReports").hide();
                    $("#home").show();
                })
                return;
            }
            for(let coin in data) {
                if(!coinData[coin]) {
                    coinData[coin] = [];
                }
                coinData[coin].push({x: new Date(), y: data[coin]["USD"]});
            }
            if(firstChart) {
                finishProgBar(() => renderChart(coinData));  
                firstChart = false;
            } else {
                renderChart(coinData);
            }
        });
    },2000)
}

// More info button related function
// ----------------------------------------------
// Handles more Info buttion

handleCoinInfo = (coinObj, coinId) => {
    let collapsedMoreInfo = $(`#${coinId}-text`);
    
        collapsedMoreInfo.append($('<div class="m-2"><img src="'+coinObj.imgUrl+'"</div>'));        
    let valuesElem = $("<ul></ul>");

        for(key in coinObj.coins) {
            valuesElem.append($(`<li>${key} - ${coinObj.coins[key]}</li>`))
        }
        collapsedMoreInfo.append(valuesElem);
}
// Check if more Info button is "open" + check if it was already clicked and do something respectively
function handleMoreInfo(e) {
    if(e.target.innerHTML == "Less Info") {
        e.target.innerHTML = "More Info";
        return
    }

    e.target.innerHTML = "Less Info";
    // let coinId = e.target.id;
    let coinId = extractId(e.target.id);
    if($(`#${coinId}-text`).children().length === 0){
        getCoinData(coinId, function(data) {
            let curCoin = new CoinData(data);
            handleCoinInfo(curCoin, coinId);
            return;
        });
    }    
}

function handleToggle(e) {

    if($(this).prop('checked')) {
        for(elm of arrChecked) {
            if(e.target.id === elm.id) {
                return;
            }
        }
        arrChecked.push(this);
    } else {
        arrChecked.splice(arrChecked.indexOf(this), 1);
    }
    if(arrChecked.length > 5 && $(this).prop('checked')) {
        handleModal();
    }
}
// MODAL:
// Handles save button of the modal.

function extractId(htmlId) {
    return htmlId.split("_")[0];
}


function handleModal() {
    $('#modal').modal();
    $('#save-btn').click(handleSave);
    let checkedCoins = $('#checkedList h5');
    checkBoxes = $('#checkedList input');
    for(i in arrChecked) {
        let coinId = extractId(arrChecked[i].id);
        checkedCoins[i].textContent = coinId;
        checkBoxes[i].id = coinId;
        $(checkBoxes[i]).click(handleCheckBox);
        $(checkBoxes[i]).prop("checked", false);
    }
}

function handleCheckBox(e) {
    if(e.target.checked) {
        checkedInModal.push(this.id);
    } else {
        checkedInModal.splice(checkedInModal.indexOf(this.id), 1);
    }
}


function handleSave() {
    if(checkedInModal.length > 5) {
        alert("Please select up to 5 coins");
    } else {
        for(checkBoxId of checkBoxes) {
            $(checkBoxId).off("click");
        }
        $('#save-btn').off("click");
        $('#modal').modal('hide');
        $(arrChecked).bootstrapToggle("off");
        let checkedInModalElem = checkedInModal.map(coinId => $("#"+coinId+"_check")[0]);
        $(checkedInModalElem).bootstrapToggle("on");
        arrChecked = [...checkedInModalElem];
        checkedInModal = [];
        checkedInModalElem = [];
    }
}


function createTemplate(data) {
    $('#rows').empty(); 
    let html = `
<div class="col-lg-4 col-md-6 mb-4">
    <div class="card h-100">
        <div class="card-body" cId="%coinId%">
            <div>
                <h4 class="card-title" style="display:inline-block;"><a href="#">%coinName%</a></h4>
                <input type="checkbox" id="%coinId%_check" symbol="%symbol%" data-on="On" data-off="Off" class="toggles toggleBtn" data-toggle="toggle">
            </div>
            <div style="margin-top: 18px;">
                <h5>%symbol%</h5>
                <button style="float:left" class="moreInfo" id="%coinId%_moreInfo" data-toggle="collapse" data-target="#%coinId%-text" aria-expanded="truex" aria-controls="%coinId%-text">More Info</button>
                <div class="collapse" id="%coinId%-text"></div>
            </div>
        </div>
    </div>
</div>`;
    let newHtml;

    for(i in data.slice(0, 100)) {
        newHtml = html.replace(/%coinName%/g, data[i].name);
        newHtml = newHtml.replace(/%symbol%/g, data[i].symbol);
        newHtml = newHtml.replace(/%coinId%/g, data[i].id);
        $('#rows').append($(newHtml));
    }
    $("[data-toggle=toggle]").bootstrapToggle();
    $('.moreInfo').click(handleMoreInfo);
    $('.toggles').change(handleToggle);
    $(".moreInfo").collapse();
    arrChecked.forEach(toggleBtn => $(`#${toggleBtn.id}.toggles`).bootstrapToggle("on"));
}


function finishProgBar(cb) {
    $('#progress .progress-bar').width('100%');
    clearInterval(progInterval);
    setTimeout(() => {
        $('#progress').hide();
        $('#progress .progress-bar').width('10%');
        cb();
    }, 600);
};


// handle search, calls finishProgBar respectively
function handleSearch(e) {
    if(e.keyCode !== 13){
        return;
    }
    let input = $('#searchBar').val().toLowerCase();
    let arrCoins = [];
    for(coin of globalData) {
        if(input === coin.symbol.toLowerCase() || input === coin.name.toLowerCase()) {
            arrCoins.push(coin);
        }
    }
    if(arrCoins.length === 0) {
        alert(`"${input}" does not exist in the data base. Please check your spelling or try a different coin name.`);
        // $("#home").show();
        return;
    }
    $('#rows').empty();
    tabIsPressed();
    $("#home").show();
    createTemplate(arrCoins);
};


function handleProgBar() {
    $('#progress').show();
    $('#progress .progress-bar').width('10%');
    progInterval = setInterval(() => {$('#progress .progress-bar').width($('#progress .progress-bar').width() * 1.4)}, 100);
};


function handleAbout() {
    tabIsPressed();
    let html = `<h1><u>About</u></h1><br>
    <h4>Personal Info</h4>
    <ul style="list-style-type:none;">
        <li><strong>Yonatan Cohen</strong></li>
        <li><strong>054-3550603</strong></li>
        <li><strong>312489677</strong></li>
    </ul>
    <br>
    <div>This site contains information about various of virtual coins.<br>
        The user can search for specfic coin of his/her choice via the search bar.<br>
        The "More Info" button grant the user with exrta information about the coins.<br>
        By turning on the toggle button the user can choose certain coins to see these coins' values in real time.
        Clicking on the live reports tab, the user will have access to a graph chart of the selected coins the updates every 2 seconds.<br>
        Wish you a pleasant time using this web application.
    </div>`
    $("#aboutText").html(html);
    $("#about").show();
}

function tabIsPressed() {
    $("#chartContainer").empty();
    clearInterval(intervalId);
    $("#home").hide();
    $("#liveReports").hide();
    $("#about").hide();
};