               

                let passBox = document.getElementById("passBox");
                let copyIcon = document.getElementById("copyIcon")
                let lenrange = document.querySelector("[name='lenrange']");
                let lennumber = document.querySelector("[name='lennumber']");
                let ilower = document.querySelector("[name='ilower']");
                let iupper = document.querySelector("[name='iupper']");
                let inumber = document.querySelector("[name='inumber']");
                let isymbol = document.querySelector("[name='isymbol']");
                let iexclude = document.querySelector("[name='iexclude']");
                let iexcludeb = document.querySelector("[name='iexcludeb']");
                let iunique = document.querySelector("[name='iunique']");
                

                function genMathRand(){
                    if (window.crypto){
                        var tempGRArray = new Uint32Array(1);
                        return (window.crypto.getRandomValues(tempGRArray)/65536/65536);
                    }
                    else{
                        return Math.random();
                    }
                }

                function doInput(diin){
                    if (diin<4){
                        lenrange.value = 4;
                        lennumber.value = 4;
                    }else if (diin>50){
                        lenrange.value = 50;
                        lennumber.value = 50;
                    }else{
                        lenrange.value = diin;
                    }
                    generatePass();
                }


                function doSliding(dsin){
                    lennumber.value = dsin;
                    lenrange.value = dsin;
                    generatePass();
                }

                function htmlEncode(s){
                    var el = document.createElement("div");
                    el.innerText = el.textContent = s;
                    s = el.innerHTML;
                    return s;
                }
                function getOneChar(gocIn){
                    var gocLen = gocIn.length;
                    var gocInd = Math.floor((genMathRand()*gocLen));
                    if (gocLen==gocInd) gocInd = Math.floor((genMathRand()*(gocLen-1)));
                    return gocIn.substr(gocInd, 1);
                }
                var pCounter = 0;
                function generatePass(){
                    pCounter = 0;
                    setTimeout(delayAndProcessPass, 50);
                    return false;
                }

                function changeColor(e){
                    e.classList.add('cliptrans');
                    let src = e.src;
                    e.src = "";
                    e.alt = "copied!";
                    setTimeout(function(){ 
                        e.classList.remove('cliptrans');
                        e.src = src;
                        e.alt = "copy";
                    }, 3000);  
                }

                function getEntropy(password) {

                    let thisStr = "";
                    if (password.search(/[abcdefghjkmnpqrstuvwxyz]/) != -1) {
                        thisStr += "abcdefghijklmnopqrstuvwxyz";
                    } 

                    if (password.search(/[ABCDEFGHJKMNPQRSTUVWXYZ]/) != -1) {
                        thisStr += "ABCDEFGIHJKLMNPQORSTUVWXYZ";
                    } 

                    if (password.search(/[123456789]/) != -1) {
                        thisStr += "0123456789";
                    } 

                    if (password.search(/[!"#$%&'()*+,\-./:;<=>?@\[\]\^_`{\|}\~]/) != -1) {
                        thisStr += "!\"#$%&'()*+,-./:;<=>?@[]^_`{|}~";
                    }

                    if(password.search(/[<>\(\)\[\]\{\}]/) != -1){
                        thisStr += "<>()[]{}";
                    } 
                    possibilityNum = Math.pow(thisStr.length, password.length);
                                
                    var pEntropy = Math.log(possibilityNum)/Math.LN2;
                    let outVal = '<table>';
                    pEntropy = Math.round(pEntropy*10)/10;
                    outVal += '<tr><td class="pss">Password Strength:</td><td align="center">';
                    if (pEntropy<36){
                        outVal += '<b><font color="#ff0000">Very Weak</font></b><table width="150" height="8"><td bgcolor="#ff0000" width="30" height="8"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td></table>';
                    }else if (pEntropy<48){
                        outVal += '<b><font color="#ff6600">Weak</font></b><table width="150" height="8"><td bgcolor="#ff6600" width="30" height="8"></td><td bgcolor="#ff6600" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td></table>';
                    }else if (pEntropy<60){
                        outVal += '<b><font color="#66cc66">Good</font></b><table width="150" height="8"><td bgcolor="#66cc66" width="30" height="8"></td><td bgcolor="#66cc66" width="30"></td><td bgcolor="#66cc66" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td></table>';
                    }else if (pEntropy<120){
                        outVal += '<b><font color="#33cc33">Strong</font></b><table width="150" height="8"><td bgcolor="#33cc33" width="30" height="8"></td><td bgcolor="#33cc33" width="30"></td><td bgcolor="#33cc33" width="30"></td><td bgcolor="#33cc33" width="30"></td><td bgcolor="#eeeeee" width="30"></td></table>';
                    }else{
                        outVal += '<b><font color="#009900">Very Strong</font></b><table width="150" height="8"><td bgcolor="#009900" width="30" height="8"></td><td bgcolor="#009900" width="30"></td><td bgcolor="#009900" width="30"></td><td bgcolor="#009900" width="30"></td><td bgcolor="#009900" width="30"></td></table>';
                    }
                    outVal += '</td></tr><tr><td class="pss">Password Entropy:</td><td class="pss">'+pEntropy+' bits</td></tr></table>';
                
                    document.getElementById("resultid").innerHTML = outVal;
                    
                }

                function delayAndProcessPass(){
                    if ((pCounter++)<1){
                        var baseStr = "";
                        var thisStr = "";
                        var passGen = '';
                        if (ilower.checked){
                            if (iexclude.checked){
                                thisStr = "abcdefghjkmnpqrstuvwxyz";
                            }else{
                                thisStr = "abcdefghijklmnopqrstuvwxyz";
                            }
                            var thisChar = getOneChar(thisStr);
                            passGen += thisChar;
                            if (iunique.checked) thisStr = thisStr.replace(thisChar, "");
                            baseStr += thisStr;
                        }
                        if (iupper.checked){
                            if (iexclude.checked){
                                thisStr = "ABCDEFGHJKMNPQRSTUVWXYZ";
                            }else{
                                thisStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                            }
                            var thisChar = getOneChar(thisStr);
                            passGen += thisChar;
                            if (iunique.checked) thisStr = thisStr.replace(thisChar, "");
                            baseStr += thisStr;
                        }
                        if (inumber.checked){
                            if (iexclude.checked){
                                thisStr = "123456789";
                            }else{
                                thisStr = "0123456789";
                            }
                            var thisChar = getOneChar(thisStr);
                            passGen += thisChar;
                            if (iunique.checked) thisStr = thisStr.replace(thisChar, "");
                            baseStr += thisStr;
                        }
                        if (isymbol.checked){
                            if (iexcludeb.checked){
                                if (iexclude.checked){
                                    thisStr = "!#$%&*+/=?@\^~";
                                }else{
                                    thisStr = "!\"#$%&'*+,-./:;=?@\^_`|~";
                                }
                            }else{
                                if (iexclude.checked){
                                    thisStr = "!#$%&()*+/<=>?@[\]^{}~";
                                }else{
                                    thisStr = "!\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~";
                                }
                            }
                            var thisChar = getOneChar(thisStr);
                            passGen += thisChar;
                            if (iunique.checked) thisStr = thisStr.replace(thisChar, "");
                            baseStr += thisStr;
                        }
                        var outVal = '';
                        if (baseStr.length<1){
                            outVal += '<font color="red">Please include at least one characters set for the password to be based on.</font>';
                            pCounter = 100;
                        }else{
                            var passLen = lennumber.value;
                            var startLen= passGen.length;
                            if ((iunique.checked)&&((baseStr.length+startLen)<passLen)){
                                outVal += '<font color="red">Not enough characters to generate such a long non-repeating password.</font>';
                                pCounter = 100;
                            }else{
                                var outVal = '';
                                var tempPass = passGen;
                                for (i=startLen; i<passLen; i++) {
                                    var tempChar = getOneChar(baseStr);
                                    tempPass += tempChar;
                                    if (iunique.checked) baseStr = baseStr.replace(tempChar, "");
                                }
                                passGen = "";
                                for (i=0; i<passLen; i++) {
                                    var tempChar = getOneChar(tempPass);
                                    passGen += tempChar;
                                    tempPass = tempPass.replace(tempChar, "");
                                }
                                var possibilityNum = 1;
                                if (iunique.checked){
                                    var tempTotalLen = passGen.length + baseStr.length;
                                    for (i=0; i<passGen.length; i++) {
                                        possibilityNum *= tempTotalLen;
                                        tempTotalLen--;
                                    }
                                }else{
                                    possibilityNum = Math.pow(baseStr.length, passGen.length);
                                }
                                var pEntropy = Math.log(possibilityNum)/Math.LN2;
                                outVal += '<table>';
                                pEntropy = Math.round(pEntropy*10)/10;
                                outVal += '<tr><td class="pss">Password Strength:</td><td align="center">';
                                if (pEntropy<36){
                                    outVal += '<b><font color="#ff0000">Very Weak</font></b><table width="150" height="8"><td bgcolor="#ff0000" width="30" height="8"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td></table>';
                                }else if (pEntropy<48){
                                    outVal += '<b><font color="#ff6600">Weak</font></b><table width="150" height="8"><td bgcolor="#ff6600" width="30" height="8"></td><td bgcolor="#ff6600" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td></table>';
                                }else if (pEntropy<60){
                                    outVal += '<b><font color="#66cc66">Good</font></b><table width="150" height="8"><td bgcolor="#66cc66" width="30" height="8"></td><td bgcolor="#66cc66" width="30"></td><td bgcolor="#66cc66" width="30"></td><td bgcolor="#eeeeee" width="30"></td><td bgcolor="#eeeeee" width="30"></td></table>';
                                }else if (pEntropy<120){
                                    outVal += '<b><font color="#33cc33">Strong</font></b><table width="150" height="8"><td bgcolor="#33cc33" width="30" height="8"></td><td bgcolor="#33cc33" width="30"></td><td bgcolor="#33cc33" width="30"></td><td bgcolor="#33cc33" width="30"></td><td bgcolor="#eeeeee" width="30"></td></table>';
                                }else{
                                    outVal += '<b><font color="#009900">Very Strong</font></b><table width="150" height="8"><td bgcolor="#009900" width="30" height="8"></td><td bgcolor="#009900" width="30"></td><td bgcolor="#009900" width="30"></td><td bgcolor="#009900" width="30"></td><td bgcolor="#009900" width="30"></td></table>';
                                }
                                outVal += '</td></tr><tr><td class="pss">Password Entropy:</td><td class="pss">'+pEntropy+' bits</td></tr></table>';
                            }
                        }
                        document.getElementById("passBox").value = passGen;
                        checkThisPassword(passGen);
                        document.getElementById("resultid").innerHTML = outVal;
                        setTimeout(delayAndProcessPass, 50);
                    }
                    return false;
                }

                function copyToClipboard(){
                    return copyStringToClipboard(btoa(passBox.value));
                }

                function copyStringToClipboard(str) {
                    var cstcel = document.createElement('textarea');
                    cstcel.value = atob(str);
                    cstcel.setAttribute('readonly', '');
                    cstcel.style = {position: 'absolute', left: '-9999px'};
                    document.body.appendChild(cstcel);
                    cstcel.select();
                    document.execCommand('copy');
                    document.body.removeChild(cstcel);
                    return false;
                }
                generatePass();

                function generateRandomTip() {
                    var tip_number = Math.floor(Math.random() * 7);
                    switch (tip_number) {
                        case 0:
                            document.getElementById('tip').innerHTML = 'Stronger passwords use different types of characters';
                            break;
                        case 1:
                            document.getElementById('tip').innerHTML = 'Avoid sequences or repeated characters in your passwords';
                            break;
                        case 2:
                            document.getElementById('tip').innerHTML = 'Don’t simply change e’s for 3′s, a’s for 4′s etc. These are well-established password tricks which any hacker will be familiar with';
                            break;
                        case 3:
                            document.getElementById('tip').innerHTML = 'Avoid the use of dictionary words or common names, and avoid using any personal information';
                            break;
                        case 4:
                            document.getElementById('tip').innerHTML = 'When adding a capital or digit to your password, don’t simply put the capital at the start and the digit at the end';
                            break;
                        case 5:
                            document.getElementById('tip').innerHTML = 'It’s often better to have longer passwords than shorter,</br> more complex ones';
                            break;
                        case 6:
                            document.getElementById('tip').innerHTML = 'Try to make your passwords at least 15 characters long';
                            break;
                    }
                }

                function toWords(number) {
        //is merely seconds, just return rounded numebr
        if (number < 120) {
            return getNumberWords(number, true) + " seconds";
        }
        var hour = 60 * 60;
        if (number < hour) {
            minutes = number / 60;
            return getNumberWords(minutes, true) + " minutes";
        }
        var day = hour * 24;
        if (number < (2 * day)) {
            hours = number / hour;
            return getNumberWords(hours) + " hours";
        }
        var month = day * 30;
        if (number < month) {
            days = number / day;
            return getNumberWords(days) + " days";
        }
        var year = day * 365;
        if (number < year) {
            months = number / month;
            return getNumberWords(months) + " months";
        }
        var century = year * 100;
        if (number < century * 10) {
            years = number / year;
            return getNumberWords(years) + " years";
        }
        if (number < century * 100) {
            centuries = number / century;
            return getNumberWords(centuries) + " centuries";
        }
        years = number / year;
        return getNumberWords(years) + " years";
    }

    function getNumberWords(number, twoDP) {
        var numberWords = "";
        var trillion = Math.pow(10, 12);
        var billion = Math.pow(10, 9);
        var million = Math.pow(10, 6);
        var thousand = Math.pow(10, 4);
        var hundred = Math.pow(10, 3);
        while (number / trillion >= 1) {
            numberWords = " trillion " + numberWords;
            number = number / trillion;
        }
        while (number / billion >= 1) {
            numberWords = " billion " + numberWords;
            number = number / billion;
        }
        while (number / million >= 1) {
            numberWords = " million " + numberWords;
            number = number / million;
        }
        while (number / thousand >= 1) {
            numberWords = " thousand " + numberWords;
            number = number / thousand;
        }
        while (number / hundred >= 1) {
            numberWords = " hundred " + numberWords;
            number = number / hundred;
        }
        if (twoDP) {
            decimalPoint = 100;
        } else {
            decimalPoint = 1;
        }
        number = (Math.round(number * decimalPoint) / decimalPoint)
        numberWords = number + numberWords;
        return numberWords;
    }

    function showCharCount(password) {
        document.getElementById("character_count").innerHTML = password.length;
    }

    function showHasChars(typeofchar, clear) {
        if (document.getElementById(typeofchar + "_count")) {
            thiselem = document.getElementById(typeofchar + "_count");
        } else {
            return false;
        }
        if (clear) {
            thiselem.style.backgroundColor = "red";
        } else {
            thiselem.style.backgroundColor = "green";
        }
    }
    function dump(arr, level) {
    var dumped_text = "";
    if (!level) level = 0;
    var level_padding = "";
    for (var j = 0; j < level + 1; j++) level_padding += "    ";
    if (typeof(arr) == 'object') { //Array/Hashes/Objects
        for (var item in arr) {
            var value = arr[item];
            if (typeof(value) == 'object') { //If it is an array,
                dumped_text += level_padding + "'" + item + "' ...<br />";
                dumped_text += dump(value, level + 1);
            } else {
                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"<br />";
            }
        }
    } else { //Stings/Chars/Numbers etc.
        dumped_text = "===>" + arr + "<===(" + typeof(arr) + ")";
    }
    return dumped_text;
}

    function checkThisPassword(password) {
        var checked = zxcvbn(password);
        var timetocrack = checked.crack_time;
        var strength = checked.score;
        var timeinwords = toWords(timetocrack);
        document.getElementById("first_estimate").innerHTML =  timeinwords ;
        if (password == "") strength = 5;
        displayStrength(strength)
        getCharacterSetOf(password)
        showCharCount(password);
        if (strength < 3) {
            matchSequence = checked.match_sequence;
            displayWeakExplanation(matchSequence, strength);
        } else {
            document.getElementById("explanation").innerHTML = "";
        }
        if (password != "") {
            displayMetaphor(strength);
        } else {
            document.getElementById("metaphor").innerHTML = "";
        }
        //displaydiv(dump(checked))
        return true;
    }

    function displayMetaphor(strength) {
        var metaphor = ""
        switch (strength) {
            case 0:
                metaphor = "  Oh dear, using that password is like leaving your front door wide open.  ";
                break;
            case 1:
                metaphor = " Oops, using that password is like leaving your key in the lock.  ";
                break;
            case 2:
                metaphor = " Hmm, using that password is like locking your front door, but leaving the key under the mat.  ";
                break;
            case 3:
                metaphor = " Good, using that password is like locking your front door and keeping the key in a safety deposit box. ";
                break;
            case 4:
                metaphor = " Fantastic, using that password makes you as secure as Fort Knox. ";
                break;
        }
        document.getElementById("metaphor").innerHTML = '<span style="font-weight:bold">Review:</span> ' + metaphor;
    }

    function displayWeakExplanation(matchSequence, strength) {
        var strengthtext = false;
        switch (strength) {
            case 0:
                strengthtext = " very weak ";
                break;
            case 1:
                strengthtext = " weak ";
                break;
            case 2:
                strengthtext = " of medium strength ";
                break;
        }
        var matchSize = matchSequence.length;
        var pattern = false;
        var dictionary = false;
        var word = false;
        var matchType = false;
        var containsWord = "contains";
        var result = new Array();
        for (var i = 0; i < matchSize; i++) {
            pattern = matchSequence[i].pattern;
            thisRes = false;
            switch (pattern) {
                case "dictionary":
                    dictionary = dictionaryType(matchSequence[i])
                    thisType = dictionary["type"];
                    thisWord = dictionary["word"];
                    if (!result[thisType]) {
                        result[thisType] = new Array();
                    }
                    //result[thisType]["count"]++;
                    result[thisType][thisWord] = true;
                    break;
                case "spatial":
                    if (matchSequence[i]["graph"] != "dvorak") {
                        if (!result["combination of characters that are close together on the keyboard"]) {
                            result["combination of characters that are close together on the keyboard"] = new Array();
                        }
                        thisWord = matchSequence[i]["matched_word"];
                        result["combination of characters that are close together on the keyboard"][thisWord] = true;
                    }
                    break;
                case "sequence":
                    if (!result["sequence of characters"]) {
                        result["sequence of characters"] = new Array();
                    }
                    thisWord = matchSequence[i]["matched_word"];
                    result["sequence of characters"][thisWord] = true;
                    break;
            }
        }
        //document.getElementById("explanation").innerHTML = dump(result);
        //return;
        var hasWords = false;
        if (matchSize > 0) {
            if (matchSize === 1) {
                explanation = "Your password is " + strengthtext + " because it is ";
            } else {
                explanation = "Your password is " + strengthtext + " because it contains ";
            }
            matchSize = 0;
            for (h in result) {
                matchSize++;
            }
            var andString = " ";
            var commaString = ", ";
            var thisCount = 0;
            //gathered all information, now to translate into words
            for (matchType in result) {
                thisElem = result[matchType];
                count = 0;
                for (h in thisElem) {
                    count++;
                }
                thisCount++;
                if (thisCount >= matchSize && matchSize != 1) {
                    andString = " and ";
                }
                if (count > 1) {
                    explanation += andString + count + " " + matchType + "s";
                    hasWords = true;
                } else {
                    explanation += andString + " a " + matchType;
                    hasWords = true;
                }
                andString = ", ";
            }
            explanation += ".";
        }
        // document.getElementById("explanation").innerHTML = dump(result);
        document.getElementById("explanation").innerHTML = "";
        if (hasWords) document.getElementById("explanation").innerHTML = explanation;
    }

    function dictionaryType(pattern) {
        var word = pattern["matched_word"];
        var dictionary = pattern["dictionary_name"];
        var type = false;
        switch (dictionary) {
            case "passwords":
                type = "common password";
                break;
            case "english":
                type = "dictionary word";
                break;
            case "male_names":
                type = "male name";
                break;
            case "female_names":
                type = "female name";
                break;
            case "surnames":
                type = "surname";
                break;
        }
        var res = new Array();
        res["word"] = word;
        res["type"] = type;
        return res;
    }

    function displaydiv(text) {
        document.getElementById("test").innerHTML = text;
    }

    function displayStrength(c) {
        var f = "Very Weak";
        var e = "e40808";
        if (c == 0) {
            f = "Very Weak"
        }
        if (c == 1) {
            f = "Weak";
            e = "e40808"
        }
        if (c == 2) {
            f = "Medium";
            e = "ffd800"
        }
        if (c == 3) {
            f = "Strong";
            e = "2cb117 "
        }
        if (c == 4) {
            f = "Very Strong";
            e = "2cb117"
        }
        if (c == 5) {
            f = "No Password";
            e = "D0D0D0"
        }
        //document.getElementById("complexity-span").innerHTML = f;
        //document.getElementById("complexity").style.backgroundColor = "#" + e
    }

    function getCharacterSetOf(password) {
        if (password.search(/[a-z]/) != -1) {
            showHasChars("lower");
        } else {
            showHasChars("lower", true);
        }
        if (password.search(/[A-Z]/) != -1) {
            showHasChars("upper");
        } else {
            showHasChars("upper", true);
        }
        if (password.search(/[0-9]/) != -1) {
            showHasChars("digits");
        } else {
            showHasChars("digits", true);
        }
        if (password.search(/[!"#£$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/) != -1) {
            showHasChars("special");
        } else {
            showHasChars("special", true);
        }
    }

    function showHasChars(typeofchar, clear) {
        if (document.getElementById(typeofchar + "_count")) {
            thiselem = document.getElementById(typeofchar + "_count");
        } else {
            return false;
        }
        if (clear) {
            thiselem.className = "char_type";
        } else {
            if (thiselem.className.indexOf('char_type_valid') == -1) {
                thiselem.className = thiselem.className + ' char_type_valid';
            }
        }
    } 
