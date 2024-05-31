

window.addEventListener("load", (event) => {
    
    document.getElementById('imageInput').addEventListener('change', function() {
        readImage(this);
    });

   
    const dropzone = document.getElementById('dropzone');
        dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            showImageProcessing(true);
            imageProcess(file);
        }
    });

    dropzone.addEventListener('paste', function(e) {
        const items = (e.clipboardData || window.clipboardData).items;
        for (let item of items) {
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            showImageProcessing(true);
            imageProcess(file);
          }
        }
      });

});


var input = document.getElementById('input');
var input_overlay = document.getElementById('input-overlay');
var ioctx = input_overlay.getContext('2d');
var output_text = document.getElementById('log');
var language = 'eng';
var demoStarted = false;

var dimensions = {

	width:0,

	height:0,

	getWidth: function () {
		if (window.innerWidth) {
		   return window.innerWidth;
		}
		if (document.documentElement && document.documentElement.clientHeight){
			return document.documentElement.clientWidth;
		}
		if (document.body) {
			return document.body.clientWidth;
		}
		return 0;
	},

	getHeight: function () {
		if (window.innerWidth) {
		   return window.innerHeight;
		}
		if (document.documentElement && document.documentElement.clientHeight){
			return document.documentElement.clientHeight;
		}
		if (document.body) {
			return document.body.clientHeight;
		}
		return 0;
	},

	update: function () {
		var curW = this.getWidth();
		var curH = this.getHeight();
		if (curW!=this.width||curH!=this.height){
			this.width=curW;
			this.height=curH;
			return true;
		}
		return false;
	}	
}



const workerPromise = Tesseract.createWorker('eng', 1, {
	logger: progressUpdate,
});

function progressUpdate(packet){
	var log = document.getElementById('log');

	const statusLabel = {"initializing api": "Initializing API", "initializing api": "Initializing API", "recognizing text" : "Recognizing Text",
	"initializing tesseract": "Initializing Tesseract", "initializing tesseract" : "Initializing Tesseract",
	"loading language traineddata": "Loading Language Traineddata", "loading language traineddata": "Loading Language Traineddata",
	"loading language traineddata (from cache)": "Loading Language Traineddata",
	"loading tesseract core": "Loading Tesseract Core", "done": "done"}[packet.status];

	if (!statusLabel) console.log(packet.status);

	if(log.firstChild && log.firstChild.status === statusLabel){
		if('progress' in packet){
			var progress = log.firstChild.querySelector('progress');
			progress.value = packet.progress;
		}
	}else{
		var line = document.createElement('div');
		line.status = statusLabel;
		var status = document.createElement('div');
		status.className = 'status';
		status.appendChild(document.createTextNode(statusLabel));
		line.appendChild(status);

		if('progress' in packet){
			var progress = document.createElement('progress');
			progress.value = packet.progress;
			progress.max = 1;
			line.appendChild(progress);
		}


		if(packet.status == 'done'){
			var pre = document.createElement('pre');
			pre.appendChild(document.createTextNode(packet.data.text));
			line.innerHTML = '';
			line.appendChild(pre);
		}

		log.insertBefore(line, log.firstChild);
	}
}

function setUp(){
    let height = (input.height == 0) ? "100%" : (input.height + 'px');
	input_overlay.width = input.naturalWidth;
	input_overlay.height = input.naturalHeight;
	output_text.style.height = height;
}

setUp();
input.onload = setUp();

function result(res){
	progressUpdate({ status: 'done', data: res });
	res.words.forEach(function(w){
		var b = w.bbox;
		ioctx.strokeWidth = 2;
		ioctx.strokeStyle = 'red';
		ioctx.strokeRect(b.x0, b.y0, b.x1-b.x0, b.y1-b.y0);
		ioctx.beginPath();
		ioctx.moveTo(w.baseline.x0, w.baseline.y0);
		ioctx.lineTo(w.baseline.x1, w.baseline.y1);
		ioctx.strokeStyle = 'green';
		ioctx.stroke();
	})
}

function clearOverLayAndOutput(){
	ioctx.clearRect(0,0, input_overlay.width, input_overlay.height);
	output_text.innerHTML = '';
    document.getElementById("arrow").style.display = 'none';
}

const recognizeFromFile = async (file) => {
	var reader = new FileReader();
	reader.onload = function(e){
		input.src = e.target.result;
		input.onload = function(){
            clearOverLayAndOutput();
			setUp();
            document.getElementById("arrow").style.display = 'block';
            input.classList.add('border-1');
		}
	};
	reader.readAsDataURL(file);
	const worker = await workerPromise;
	await worker.reinitialize(language);
	const { data } = await worker.recognize(file);
	result(data);
}



function readImage(input) {
    if (input.files && input.files[0]) {
        showImageProcessing(true);
        imageProcess(input.files[0]);
    }
}


function showImageProcessing(show) {
    const overlay = document.getElementById('overlay');
    overlay.style.display = show ? 'block' : 'none';
}

async function imageProcess(file) {
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validFormats.includes(file.type)) {
        alert('Invalid file format. Please upload PNG, JPEG, or JPG image.');
        showImageProcessing(false);
        return;
    }
    recognizeFromFile(file);
    showImageProcessing(false);
}

