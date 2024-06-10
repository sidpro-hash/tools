function parseJwt(token) {
    try{
        let splitted = token.split('.');
        let Header = null, Payload = null, signature = null;
        if(splitted.length >= 1){
            Header = Json(splitted[0].trim());
        }
        if(splitted.length >= 2){
            Payload = Json(splitted[1].trim());
        }
        // if(splitted.length >= 3){
        //     signature = Json(splitted[2].trim());
        // }
        let jsonPayload = {
            "Header": Header,
            "Payload": Payload,
            "signature": signature
        }
        //return JSON.parse(JSON.stringify(jsonPayload));
        return jsonPayload;
    }catch(e){
        console.log(e);
        return null;
    }
}

function Json(data){
    let jsonPayload = null;
    if(!data)return jsonPayload;
    try{
        let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }catch(e){
        console.log(e);
    }
    return jsonPayload;
}

textareaElement = document.getElementById("textarea");

textareaElement.addEventListener("input", function(event) {
    startParser();
});



function startParser(){
    var mytext = textareaElement.value; //You already have the element as a variable
    let jsonPayload = parseJwt(mytext);
    let result = document.getElementById("result");
    result.innerHTML = '';
    if(jsonPayload.Header){
        let j = JSON.parse(jsonPayload.Header);
        output("Header:</br>",syntaxHighlight(JSON.stringify(j,null," ")));
    }

    if(jsonPayload.Payload){
        let j = JSON.parse(jsonPayload.Payload);
        if(j.exp){
            var expTime = j.exp * 1000;
            var expDate = new Date(expTime);// Milliseconds to date
            document.getElementById("d").innerHTML="</br></br>EXP TIME: "+expDate.toString()+"</br></br>PAYLOAD_DATA:</br>";
        }
        else{
            document.getElementById("d").innerHTML="</br></br>PAYLOAD_DATA:</br>";
        }
        
        output("Payload:</br>",syntaxHighlight(JSON.stringify(j,null," ")));
    }

    if(jsonPayload.signature){
        let j = JSON.parse(jsonPayload.signature);
        output("signature:</br>",syntaxHighlight(JSON.stringify(j,null," ")));
    }
    
}

function output(title,inp) {
    let result = document.getElementById("result");
    result.appendChild(document.createElement('pre')).innerHTML = title + inp;
}

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}     
function getIP(json) {
    document.getElementById("ip").innerHTML = "Yout Public IP address is: " + json.ip + "<br/><br/>";
} 

textareaElement.value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
startParser();