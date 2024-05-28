function parseJwt(token) {
    try{
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }catch(e){
        console.log(e);
        return null;
    }
}

textareaElement = document.getElementById("textarea");

textareaElement.addEventListener("input", function(event) {
    startParser();
});



function startParser(){
    var mytext = textareaElement.value; //You already have the element as a variable
    var j = parseJwt(mytext);
    if(j){
        if(j.exp){
            var expTime = j.exp * 1000;
            var expDate = new Date(expTime);// Milliseconds to date
            document.getElementById("d").innerHTML="</br></br>EXP TIME: "+expDate.toString()+"</br></br>PAYLOAD_DATA:</br>";
        }
        else{
            document.getElementById("d").innerHTML="</br></br>PAYLOAD_DATA:</br>";
        }
        output(syntaxHighlight(JSON.stringify(j,null," ")));
    }
    else{
        let result = document.getElementById("result");
    result.innerHTML = '';
        document.getElementById("d").innerHTML = '<code style="color:red">Invalid JWT Token</code>';
    }
}

function output(inp) {
    let result = document.getElementById("result");
    result.innerHTML = '';
    result.appendChild(document.createElement('pre')).innerHTML = inp;
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